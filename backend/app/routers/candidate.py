import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import db
from ..schemas import ApplicationIn
from ..security import require_candidate
from ..services import rank_for_candidate, resume_summary, scores_by_job

router = APIRouter(prefix="/api", tags=["Candidate"])


# ---------- Recommendations ----------

@router.get("/recommendations")
def recommendations(
    limit: int = Query(default=10, ge=1, le=100),
    user: dict = Depends(require_candidate),
):
    """Jobs ranked by final match score for the user's latest resume."""
    resume, results = rank_for_candidate(user, save=True)

    saved = _saved_ids(user["id"])
    for result in results:
        result["saved"] = result["job_id"] in saved

    return {
        "resume": resume_summary(resume),
        "total": len(results),
        "results": results[:limit],
    }


# ---------- Saved jobs ----------

def _saved_ids(user_id: int) -> set[int]:
    with db.get_connection() as connection:
        return {
            row["job_id"]
            for row in connection.execute(
                "SELECT job_id FROM saved_jobs WHERE user_id = ?", (user_id,)
            )
        }


@router.get("/saved-jobs")
def list_saved_jobs(user: dict = Depends(require_candidate)):
    with db.get_connection() as connection:
        rows = connection.execute(
            """
            SELECT j.*, s.created_at AS saved_at
            FROM saved_jobs AS s
            JOIN jobs AS j ON j.id = s.job_id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC, j.id DESC
            """,
            (user["id"],),
        ).fetchall()

    with db.get_connection() as connection:
        applied = {
            row["job_id"]: row["status"]
            for row in connection.execute(
                "SELECT job_id, status FROM applications WHERE user_id = ?", (user["id"],)
            )
        }

    scores = scores_by_job(user)
    jobs = []
    for row in rows:
        job = db.job_from_row(row)
        match = scores.get(job["id"])
        job["final_score"] = match["final_score"] if match else None
        job["match_label"] = match["match_label"] if match else None
        job["application_status"] = applied.get(job["id"])
        jobs.append(job)
    return jobs


@router.post("/saved-jobs/{job_id}", status_code=201)
def save_job(job_id: int, user: dict = Depends(require_candidate)):
    job = db.get_job(job_id)
    if job is None or not job["active"]:
        raise HTTPException(status_code=404, detail="Job not found.")

    with db.get_connection() as connection:
        connection.execute(
            "INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)",
            (user["id"], job_id),
        )
    return {"job_id": job_id, "saved": True}


@router.delete("/saved-jobs/{job_id}")
def unsave_job(job_id: int, user: dict = Depends(require_candidate)):
    with db.get_connection() as connection:
        connection.execute(
            "DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?", (user["id"], job_id)
        )
    return {"job_id": job_id, "saved": False}


# ---------- Applications ----------

@router.get("/applications")
def list_applications(user: dict = Depends(require_candidate)):
    with db.get_connection() as connection:
        rows = connection.execute(
            """
            SELECT a.id, a.status, a.final_score, a.cover_letter, a.created_at, a.updated_at,
                   j.id AS job_id, j.title, j.company, j.location, j.employment_type,
                   j.work_mode, j.category, j.active
            FROM applications AS a
            JOIN jobs AS j ON j.id = a.job_id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC, a.id DESC
            """,
            (user["id"],),
        ).fetchall()
    return [dict(row) | {"active": bool(row["active"])} for row in rows]


@router.post("/applications", status_code=201)
def apply(body: ApplicationIn, user: dict = Depends(require_candidate)):
    job = db.get_job(body.job_id)
    if job is None or not job["active"]:
        raise HTTPException(status_code=404, detail="This job is no longer accepting applications.")

    resume = db.get_latest_resume(user["id"])
    if resume is None:
        raise HTTPException(status_code=400, detail="Upload your resume before applying.")

    match = scores_by_job(user).get(body.job_id)

    try:
        with db.get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO applications (
                    user_id, job_id, resume_id, full_name, email, phone,
                    cover_letter, final_score
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"], body.job_id, resume["id"], body.full_name, body.email,
                    body.phone, body.cover_letter, match["final_score"] if match else None,
                ),
            )
            application_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="You have already applied for this job.")

    return {"id": application_id, "job_id": body.job_id, "status": "under_review"}


@router.delete("/applications/{application_id}")
def withdraw_application(application_id: int, user: dict = Depends(require_candidate)):
    with db.get_connection() as connection:
        row = connection.execute(
            "SELECT status FROM applications WHERE id = ? AND user_id = ?",
            (application_id, user["id"]),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Application not found.")
        if row["status"] != "under_review":
            raise HTTPException(
                status_code=400,
                detail="Only applications that are still under review can be withdrawn.",
            )
        connection.execute("DELETE FROM applications WHERE id = ?", (application_id,))
    return {"message": "Application withdrawn."}
