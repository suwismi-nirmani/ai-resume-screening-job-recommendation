from fastapi import FastAPI, File, UploadFile
from fastapi import HTTPException
from contextlib import asynccontextmanager
from .nlp import extract_skills  #connect skill extraction from nlp.py
from .db import (
    init_db,
    save_resume,
    get_resume,
    seed_sample_jobs,
    get_active_jobs,
)
from .extraction import MAX_FILE_SIZE, extract_resume_text

@asynccontextmanager
async def lifespan(app):
    init_db()
    seed_sample_jobs()
    yield


app = FastAPI(
    title="CareerMatch AI",
    lifespan=lifespan,
)


@app.get("/")
def home():
    return {"message": "CareerMatch AI backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/resumes")
def upload_resume(file: UploadFile = File(...)):
    filename = file.filename or ""

    try:
        content = file.file.read(MAX_FILE_SIZE + 1)

        text = extract_resume_text(
            filename=filename,
            content=content,
        )
    finally:
        file.file.close()

    skills = extract_skills(text)

    resume_id = save_resume(
        filename=filename,
        extracted_text=text,
        skills=skills,
    )

    return {
        "resume_id": resume_id,
        "filename": filename,
        "extracted_text": text,
        "character_count": len(text),
        "skills": skills,
        "skill_count": len(skills),
    }

@app.get("/api/resumes/{resume_id}")
def read_resume(resume_id: int):
    resume = get_resume(resume_id)

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    return resume

@app.get("/api/jobs")
def read_jobs():
    return get_active_jobs()
