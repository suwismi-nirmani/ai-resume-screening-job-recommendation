import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routers import auth, candidate, jobs, profile, recruiter, resumes, support
from .seed import seed_all


@asynccontextmanager
async def lifespan(app):
    init_db()
    seed_all()
    yield


app = FastAPI(
    title="CareerMatch AI",
    description="AI Resume Screening and Job Recommendation System (Group 06).",
    version="1.0.0",
    lifespan=lifespan,
)

# The React dev server runs on port 5173. In development Vite also proxies
# /api to this server, so CORS mainly matters if the frontend is opened
# from another origin.
allowed_origins = os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def home():
    return {"message": "CareerMatch AI backend is running"}


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(candidate.router)
app.include_router(recruiter.router)
app.include_router(support.router)
