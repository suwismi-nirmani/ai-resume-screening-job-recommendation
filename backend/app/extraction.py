from io import BytesIO
from pathlib import Path

from fastapi import HTTPException
from pypdf import PdfReader

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def extract_resume_text(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()

    if extension not in {".pdf", ".txt"}:
        raise HTTPException(
            status_code=415,
            detail="Only PDF and TXT files are supported.",
        )

    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 5 MB.",
        )

    if extension == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file.",
            )

        try:
            reader = PdfReader(BytesIO(content))

            if reader.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail="Password-protected PDFs are not supported.",
                )

            if len(reader.pages) > 30:
                raise HTTPException(
                    status_code=400,
                    detail="Maximum 30 PDF pages are supported.",
                )

            text = "\n".join(
                page.extract_text() or "" for page in reader.pages
            )

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Could not read the PDF file.",
            )

    else:
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="TXT file must use UTF-8 encoding.",
            )

        if any(ord(char) < 32 and char not in "\n\r\t" for char in text):
            raise HTTPException(
                status_code=400,
                detail="TXT file contains invalid binary content.",
            )

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="No readable text found. Use a text-based resume.",
        )

    return text.strip()
