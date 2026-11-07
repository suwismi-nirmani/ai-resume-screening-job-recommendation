from fastapi import APIRouter, Depends, HTTPException, Query

from .. import db
from ..db import CATEGORIES
from ..security import get_optional_user
from ..services import scores_by_job

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("")
def list_jobs(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    user: dict | None = Depends(get_optional_user),
):
    """Active jobs. Logged-in candidates also get their match score per job."""
    if category and category not in CATEGORIES:
        raise HTTPException(status_code=404, detail="Category not found.")

    jobs = db.get_active_jobs(category=category, query=q)

    if user and user["role"] == "candidate":
        scores = scores_by_job(user)
        saved = _saved_ids(user["id"])
        for job in jobs:
            match = scores.get(job["id"])
            job["final_score"] = match["final_score"] if match else None
            job["match_label"] = match["match_label"] if match else None
            job["saved"] = job["id"] in saved

    return jobs


@router.get("/categories")
def list_categories():
    with db.get_connection() as connection:
        counts = {
            row["category"]: row["total"]
            for row in connection.execute(
                "SELECT category, COUNT(*) AS total FROM jobs WHERE active = 1 GROUP BY category"
            )
        }
    return [
        {"slug": slug, "name": name, "job_count": counts.get(slug, 0)}
        for slug, name in CATEGORIES.items()
    ]


@router.get("/{job_id}")
def read_job(job_id: int, user: dict | None = Depends(get_optional_user)):
    job = db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    job["match"] = None
    job["saved"] = False
    job["application"] = None

    if user and user["role"] == "candidate":
        job["match"] = scores_by_job(user).get(job_id)
        job["saved"] = job_id in _saved_ids(user["id"])
        with db.get_connection() as connection:
            row = connection.execute(
                "SELECT id, status, created_at FROM applications WHERE user_id = ? AND job_id = ?",
                (user["id"], job_id),
            ).fetchone()
        job["application"] = dict(row) if row else None

    # A closed job stays visible to its recruiter and to candidates who saved
    # or applied to it, so their history still works. Everyone else gets 404.
    if not job["active"]:
        is_owner = user is not None and job.get("recruiter_id") == user["id"]
        if not (is_owner or job["saved"] or job["application"]):
            raise HTTPException(status_code=404, detail="Job not found.")

    return job


def _saved_ids(user_id: int) -> set[int]:
    with db.get_connection() as connection:
        return {
            row["job_id"]
            for row in connection.execute(
                "SELECT job_id FROM saved_jobs WHERE user_id = ?", (user_id,)
            )
        }
