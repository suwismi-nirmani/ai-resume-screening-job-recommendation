from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from .. import db
from ..extraction import MAX_FILE_SIZE, extract_resume_text
from ..matching import MODEL_VERSION, compute_skill_match, rank_jobs
from ..nlp import extract_skills
from ..security import get_current_user

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])


def _owned_resume(resume_id: int, user: dict) -> dict:
    resume = db.get_resume(resume_id)
    if resume is None or resume.get("user_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return resume


@router.post("")
def upload_resume(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    filename = file.filename or ""

    try:
        content = file.file.read(MAX_FILE_SIZE + 1)
        text = extract_resume_text(filename=filename, content=content)
    finally:
        file.file.close()

    skills = extract_skills(text)
    resume_id = db.save_resume(
        filename=filename,
        extracted_text=text,
        skills=skills,
        user_id=user["id"],
    )

    return {
        "resume_id": resume_id,
        "filename": filename,
        "extracted_text": text,
        "character_count": len(text),
        "skills": skills,
        "skill_count": len(skills),
    }


@router.get("")
def list_my_resumes(user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, filename, skills, created_at, length(extracted_text) AS character_count
            FROM resumes WHERE user_id = ? ORDER BY id DESC
            """,
            (user["id"],),
        ).fetchall()
    return [db.resume_from_row(row) for row in rows]


@router.get("/latest")
def read_latest_resume(user: dict = Depends(get_current_user)):
    resume = db.get_latest_resume(user["id"])
    if resume is None:
        raise HTTPException(status_code=404, detail="You have not uploaded a resume yet.")
    return resume


@router.get("/{resume_id}")
def read_resume(resume_id: int, user: dict = Depends(get_current_user)):
    return _owned_resume(resume_id, user)


@router.post("/{resume_id}/matches")
def match_resume(resume_id: int, user: dict = Depends(get_current_user)):
    resume = _owned_resume(resume_id, user)

    results = rank_jobs(
        resume_text=resume["extracted_text"],
        resume_skills=resume["skills"],
        jobs=db.get_active_jobs(),
    )
    db.save_match_results(resume_id=resume_id, results=results, model_version=MODEL_VERSION)

    return {
        "resume_id": resume_id,
        "model_version": MODEL_VERSION,
        "job_count": len(results),
        "results": results,
    }


@router.get("/{resume_id}/matches")
def read_matches(resume_id: int, user: dict = Depends(get_current_user)):
    resume = _owned_resume(resume_id, user)
    results = db.get_match_results(resume_id)

    # Matched and missing skills are not stored, so rebuild them.
    for result in results:
        result.update(compute_skill_match(resume["skills"], result["required_skills"]))

    return {"resume_id": resume_id, "job_count": len(results), "results": results}
