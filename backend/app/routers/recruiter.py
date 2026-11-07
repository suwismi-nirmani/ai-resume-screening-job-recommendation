import json

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import db
from ..matching import MODEL_VERSION, build_reasons, score_job
from ..nlp import normalize_skill
from ..schemas import ApplicationStatusIn, JobIn, JobStatusIn, ScreenIn
from ..security import require_recruiter

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter"])


def _clean_skills(skills: list[str]) -> list[str]:
    cleaned = []
    for skill in skills:
        canonical = normalize_skill(skill)
        if canonical and canonical not in cleaned:
            cleaned.append(canonical)
    return cleaned


def _own_job(job_id: int, recruiter: dict) -> dict:
    job = db.get_job(job_id)
    if job is None or job.get("recruiter_id") != recruiter["id"]:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


def _job_values(body: JobIn) -> tuple:
    return (
        body.title, body.company, body.category, body.location, body.employment_type,
        body.work_mode, body.experience_level, body.salary_range, body.description,
        json.dumps([item for item in body.responsibilities if item]),
        json.dumps(_clean_skills(body.required_skills)),
        json.dumps(_clean_skills(body.nice_to_have)),
    )


# ---------- Dashboard ----------

@router.get("/stats")
def stats(recruiter: dict = Depends(require_recruiter)):
    with db.get_connection() as connection:
        row = connection.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM jobs WHERE recruiter_id = :id AND active = 1) AS active_jobs,
                (SELECT COUNT(*) FROM jobs WHERE recruiter_id = :id) AS total_jobs,
                (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id
                    WHERE j.recruiter_id = :id) AS applications,
                (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.id = a.job_id
                    WHERE j.recruiter_id = :id AND a.status = 'under_review') AS pending_review,
                (SELECT COUNT(*) FROM screening_results WHERE recruiter_id = :id) AS screenings
            """,
            {"id": recruiter["id"]},
        ).fetchone()
    return dict(row)


# ---------- Jobs (FR-06) ----------

@router.get("/jobs")
def list_my_jobs(recruiter: dict = Depends(require_recruiter)):
    with db.get_connection() as connection:
        rows = connection.execute(
            """
            SELECT j.*, COUNT(a.id) AS application_count
            FROM jobs AS j
            LEFT JOIN applications AS a ON a.job_id = j.id
            WHERE j.recruiter_id = ?
            GROUP BY j.id
            ORDER BY j.active DESC, j.posted_date DESC, j.id DESC
            """,
            (recruiter["id"],),
        ).fetchall()
    return [db.job_from_row(row) for row in rows]


@router.post("/jobs", status_code=201)
def create_job(body: JobIn, recruiter: dict = Depends(require_recruiter)):
    with db.get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO jobs (
                title, company, category, location, employment_type, work_mode,
                experience_level, salary_range, description, responsibilities,
                required_skills, nice_to_have, posted_date, recruiter_id, active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, 1)
            """,
            _job_values(body) + (recruiter["id"],),
        )
        job_id = cursor.lastrowid
    return db.get_job(job_id)


@router.get("/jobs/{job_id}")
def read_my_job(job_id: int, recruiter: dict = Depends(require_recruiter)):
    return _own_job(job_id, recruiter)


@router.put("/jobs/{job_id}")
def update_job(job_id: int, body: JobIn, recruiter: dict = Depends(require_recruiter)):
    _own_job(job_id, recruiter)
    with db.get_connection() as connection:
        connection.execute(
            """
            UPDATE jobs SET
                title = ?, company = ?, category = ?, location = ?, employment_type = ?,
                work_mode = ?, experience_level = ?, salary_range = ?, description = ?,
                responsibilities = ?, required_skills = ?, nice_to_have = ?
            WHERE id = ?
            """,
            _job_values(body) + (job_id,),
        )
    return db.get_job(job_id)


@router.patch("/jobs/{job_id}/status")
def set_job_status(job_id: int, body: JobStatusIn, recruiter: dict = Depends(require_recruiter)):
    _own_job(job_id, recruiter)
    with db.get_connection() as connection:
        connection.execute(
            "UPDATE jobs SET active = ? WHERE id = ?", (int(body.active), job_id)
        )
    return db.get_job(job_id)


# ---------- Screening (FR-12) ----------

def _screenable_resumes(recruiter_id: int) -> dict[int, dict]:
    """
    Resumes a recruiter may screen:
    - resumes the recruiter uploaded themselves
    - resumes attached to applications for the recruiter's jobs
    - the latest resume of candidates who made their profile visible
    """
    with db.get_connection() as connection:
        rows = connection.execute(
            """
            SELECT r.id, r.filename, r.skills, r.created_at,
                   u.full_name AS candidate_name, u.email AS candidate_email, 'uploaded' AS source
            FROM resumes r JOIN users u ON u.id = r.user_id
            WHERE r.user_id = :id

            UNION ALL

            SELECT r.id, r.filename, r.skills, r.created_at,
                   u.full_name, u.email, 'applicant'
            FROM applications a
            JOIN jobs j ON j.id = a.job_id
            JOIN resumes r ON r.id = a.resume_id
            JOIN users u ON u.id = a.user_id
            WHERE j.recruiter_id = :id

            UNION ALL

            SELECT r.id, r.filename, r.skills, r.created_at,
                   u.full_name, u.email, 'visible profile'
            FROM users u
            JOIN resumes r ON r.id = (
                SELECT MAX(id) FROM resumes WHERE user_id = u.id
            )
            WHERE u.role = 'candidate' AND u.profile_visible = 1
            """,
            {"id": recruiter_id},
        ).fetchall()

    resumes = {}
    for row in rows:
        if row["id"] not in resumes:
            resume = db.resume_from_row(row)
            if resume["source"] == "uploaded":
                resume["candidate_name"] = f"Uploaded: {resume['filename']}"
                resume["candidate_email"] = ""
            resumes[row["id"]] = resume
    return resumes


@router.get("/resumes")
def list_screenable_resumes(recruiter: dict = Depends(require_recruiter)):
    resumes = _screenable_resumes(recruiter["id"])
    return sorted(resumes.values(), key=lambda resume: resume["id"], reverse=True)


@router.post("/screen")
def screen_resume(body: ScreenIn, recruiter: dict = Depends(require_recruiter)):
    resume_info = _screenable_resumes(recruiter["id"]).get(body.resume_id)
    if resume_info is None:
        raise HTTPException(status_code=404, detail="Resume not found or not available to you.")

    job = _own_job(body.job_id, recruiter)
    resume = db.get_resume(body.resume_id)

    result = score_job(resume["extracted_text"], resume["skills"], job, db.get_active_jobs())
    result["reasons"] = build_reasons(
        result["text_similarity"], result["matched_skills"], result["missing_skills"],
        audience="recruiter",
    )

    with db.get_connection() as connection:
        connection.execute(
            """
            INSERT INTO screening_results (
                recruiter_id, resume_id, job_id, text_similarity,
                skill_match, final_score, model_version
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (recruiter["id"], body.resume_id, body.job_id, result["text_similarity"],
             result["skill_match"], result["final_score"], MODEL_VERSION),
        )

    return {
        "resume": {
            "id": resume["id"],
            "filename": resume["filename"],
            "skills": resume["skills"],
            "candidate_name": resume_info["candidate_name"],
            "candidate_email": resume_info["candidate_email"],
        },
        "job": {"id": job["id"], "title": job["title"], "company": job["company"]},
        "model_version": MODEL_VERSION,
        "result": result,
    }


@router.get("/screenings")
def list_screenings(recruiter: dict = Depends(require_recruiter)):
    with db.get_connection() as connection:
        rows = connection.execute(
            """
            SELECT s.id, s.resume_id, s.job_id, s.text_similarity, s.skill_match,
                   s.final_score, s.model_version, s.created_at,
                   r.filename, j.title AS job_title
            FROM screening_results s
            JOIN resumes r ON r.id = s.resume_id
            JOIN jobs j ON j.id = s.job_id
            WHERE s.recruiter_id = ?
            ORDER BY s.id DESC
            LIMIT 50
            """,
            (recruiter["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


# ---------- Applications ----------

@router.get("/applications")
def list_applications(
    job_id: int | None = Query(default=None),
    recruiter: dict = Depends(require_recruiter),
):
    sql = """
        SELECT a.id, a.full_name, a.email, a.phone, a.cover_letter, a.final_score,
               a.status, a.created_at, a.resume_id,
               j.id AS job_id, j.title AS job_title, r.skills AS resume_skills
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        LEFT JOIN resumes r ON r.id = a.resume_id
        WHERE j.recruiter_id = ?
    """
    params = [recruiter["id"]]
    if job_id is not None:
        sql += " AND j.id = ?"
        params.append(job_id)
    sql += " ORDER BY a.final_score DESC, a.created_at DESC"

    with db.get_connection() as connection:
        rows = connection.execute(sql, params).fetchall()

    applications = []
    for row in rows:
        application = dict(row)
        application["resume_skills"] = json.loads(application["resume_skills"] or "[]")
        applications.append(application)
    return applications


@router.patch("/applications/{application_id}")
def update_application_status(
    application_id: int,
    body: ApplicationStatusIn,
    recruiter: dict = Depends(require_recruiter),
):
    with db.get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE applications
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND job_id IN (SELECT id FROM jobs WHERE recruiter_id = ?)
            """,
            (body.status, application_id, recruiter["id"]),
        )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Application not found.")
    return {"id": application_id, "status": body.status}
