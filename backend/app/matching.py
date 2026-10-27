"""
"Resume-to-Job Matching and Score Calculation"

Final Match Score = (0.60 x Text Similarity Score) + (0.40 x Skill Match Score)

- Text Similarity Score = TF-IDF cosine similarity, as a percentage (0-100)
- Skill Match Score     = matched required skills / total required skills x 100
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .nlp import preprocess_text

MODEL_VERSION = "tfidf-cosine-v1"

TEXT_WEIGHT = 0.60
SKILL_WEIGHT = 0.40

TOKEN_PATTERN = r"[a-z0-9][a-z0-9+#]*(?:\.[a-z0-9]+)*"


def build_job_text(job: dict) -> str:
    """Combine the job fields that describe the role into one text."""
    parts = [
        job.get("title", ""),
        job.get("description", ""),
        " ".join(job.get("responsibilities") or []),
        " ".join(job.get("required_skills") or []),
        " ".join(job.get("nice_to_have") or []),
    ]
    return " ".join(part for part in parts if part)


MATCH_LABELS = [
    (70, "Excellent Match"),
    (55, "Great Match"),
    (40, "Good Match"),
    (25, "Moderate Match"),
    (0, "Basic Match"),
]


def match_label(final_score: float) -> str:
    for minimum, label in MATCH_LABELS:
        if final_score >= minimum:
            return label
    return MATCH_LABELS[-1][1]


def compute_text_similarities(resume_text: str, job_texts: list[str]) -> list[float]:
    """
    Return one cosine similarity (0.0 - 1.0) per job text.

    The vectorizer is fitted on the resume and all job texts together, so
    IDF weights reflect the current set of active jobs.
    """
    if not job_texts:
        return []

    documents = [preprocess_text(resume_text)] + [
        preprocess_text(text) for text in job_texts
    ]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        token_pattern=TOKEN_PATTERN,
       
        ngram_range=(1, 1),
        sublinear_tf=True,
    )

    try:
        matrix = vectorizer.fit_transform(documents)
    except ValueError:
        
        return [0.0] * len(job_texts)

    resume_vector = matrix[0]
    job_vectors = matrix[1:]

    similarities = cosine_similarity(resume_vector, job_vectors)[0]

    return [float(value) for value in similarities]


def compute_skill_match(resume_skills: list[str], required_skills: list[str]) -> dict:
    """Compare resume skills with a job's required skills."""
    resume_set = {skill.strip().lower() for skill in resume_skills}
    required = []
    for skill in required_skills:
        cleaned = skill.strip().lower()
        if cleaned and cleaned not in required:
            required.append(cleaned)

    matched = [skill for skill in required if skill in resume_set]
    missing = [skill for skill in required if skill not in resume_set]


    score = (len(matched) / len(required) * 100) if required else 0.0

    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "skill_match": round(score, 2),
    }


def compute_final_score(text_similarity: float, skill_match: float) -> float:
    """Both inputs are percentages (0-100). Returns a percentage (0-100)."""
    score = TEXT_WEIGHT * text_similarity + SKILL_WEIGHT * skill_match
    return round(min(max(score, 0.0), 100.0), 2)


def build_reasons(
    text_similarity: float,
    matched: list[str],
    missing: list[str],
    audience: str = "candidate",
) -> list[str]:
    """
    Short plain-language reasons shown with each result.
    audience="candidate" speaks to the job seeker ("You have...");
    audience="recruiter" describes the candidate ("The candidate has...").
    """
    you = audience == "candidate"
    has = "You have" if you else "The candidate has"
    resume = "Your resume" if you else "The resume"
    reasons = []

    if matched:
        reasons.append(f"{has} {len(matched)} of the required skills: {', '.join(matched)}.")
    if missing:
        reasons.append(f"Missing skills: {', '.join(missing)}.")

    if text_similarity >= 50:
        reasons.append(f"{resume} content closely matches the job description.")
    elif text_similarity >= 20:
        reasons.append(f"{resume} content partly matches the job description.")
    else:
        reasons.append(f"{resume} content has little overlap with the job description.")

    return reasons


def score_job(resume_text: str, resume_skills: list[str], job: dict, jobs: list[dict]) -> dict:
    """
    Score one job. The other active jobs are passed too, because TF-IDF
    weights depend on the whole set of documents being compared.
    """
    corpus = jobs if any(other["id"] == job["id"] for other in jobs) else jobs + [job]
    for result in rank_jobs(resume_text, resume_skills, corpus):
        if result["job_id"] == job["id"]:
            return result
    raise ValueError("Job was not scored.")


def rank_jobs(resume_text: str, resume_skills: list[str], jobs: list[dict]) -> list[dict]:
    """
    Score every job against the resume and return them ranked,
    highest final score first.
    """
    if not jobs:
        return []

    similarities = compute_text_similarities(
        resume_text,
        [build_job_text(job) for job in jobs],
    )

    results = []

    for job, similarity in zip(jobs, similarities):
        text_similarity = round(similarity * 100, 2)
        skills = compute_skill_match(resume_skills, job.get("required_skills", []))
        final_score = compute_final_score(text_similarity, skills["skill_match"])

        results.append({
            "job_id": job["id"],
            "title": job["title"],
            "description": job.get("description", ""),
            "required_skills": job.get("required_skills", []),
            "match_label": match_label(final_score),
            "text_similarity": text_similarity,
            "skill_match": skills["skill_match"],
            "final_score": final_score,
            "matched_skills": skills["matched_skills"],
            "missing_skills": skills["missing_skills"],
            "contribution": {
                "text_similarity": round(TEXT_WEIGHT * text_similarity, 2),
                "skill_match": round(SKILL_WEIGHT * skills["skill_match"], 2),
            },
            "reasons": build_reasons(
                text_similarity,
                skills["matched_skills"],
                skills["missing_skills"],
            ),
        })

    # Highest final score first; ties broken by skill match, then title.
    results.sort(key=lambda item: (-item["final_score"], -item["skill_match"], item["title"]))

    for position, item in enumerate(results, start=1):
        item["rank"] = position

    return results
