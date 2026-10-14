from fastapi import FastAPI, File, UploadFile

from .extraction import MAX_FILE_SIZE, extract_resume_text

app = FastAPI(title="CareerMatch AI")


@app.get("/")
def home():
    return {"message": "CareerMatch AI backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/resumes")
def upload_resume(file: UploadFile = File(...)):
    try:
        content = file.file.read(MAX_FILE_SIZE + 1)

        text = extract_resume_text(
            filename=file.filename or "",
            content=content,
        )
    finally:
        file.file.close()

    return {
        "filename": file.filename,
        "extracted_text": text,
        "character_count": len(text),
    }
