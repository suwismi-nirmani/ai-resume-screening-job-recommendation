"""
Shared matching logic used by several routers.

A candidate's skills = skills extracted from their latest resume
+ skills they added on their profile. The resume text is used for
TF-IDF similarity.
"""

from . import db
from .matching import MODEL_VERSION, rank_jobs
from .nlp import normalize_skill

JOB_FIELDS = (
    "company", "category", "category_name", "location", "employment_type",
    "work_mode", "experience_level", "salary_range", "responsibilities",
    "nice_to_have", "posted_date", "active",
)


def candidate_skills(user_id: int, resume: dict | None) -> list[str]:
    skills = set(resume["skills"]) if resume else set()
    skills.update(normalize_skill(skill) for skill in db.get_user_skills(user_id))
    return sorted(skills)


def attach_job_details(result: dict, job: dict) -> dict:
    for field in JOB_FIELDS:
        result[field] = job.get(field)
    return result


def rank_for_candidate(user: dict, save: bool = True) -> tuple[dict | None, list[dict]]:
    """
    Rank all active jobs for the user's latest resume.
    Returns (resume, results). Results are empty when there is no resume.
    """
    resume = db.get_latest_resume(user["id"])
    if resume is None:
        return None, []

    jobs = db.get_active_jobs()
    results = rank_jobs(
        resume_text=resume["extracted_text"],
        resume_skills=candidate_skills(user["id"], resume),
        jobs=jobs,
    )

    if save:
        db.save_match_results(resume["id"], results, MODEL_VERSION)

    jobs_by_id = {job["id"]: job for job in jobs}
    for result in results:
        attach_job_details(result, jobs_by_id[result["job_id"]])

    return resume, results


def scores_by_job(user: dict) -> dict[int, dict]:
    """job_id -> match result, for showing scores on any job list."""
    _, results = rank_for_candidate(user, save=False)
    return {result["job_id"]: result for result in results}


def resume_summary(resume: dict | None) -> dict | None:
    if resume is None:
        return None
    return {
        "id": resume["id"],
        "filename": resume["filename"],
        "skills": resume["skills"],
        "character_count": len(resume["extracted_text"]),
        "created_at": resume["created_at"],
    }
