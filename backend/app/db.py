import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path

DATABASE_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "app.db"
)


@contextmanager
def get_connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db():
    with get_connection() as connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                extracted_text TEXT NOT NULL,
                skills TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                required_skills TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS match_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resume_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                text_similarity REAL NOT NULL,
                skill_match REAL NOT NULL,
                final_score REAL NOT NULL,
                model_version TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (resume_id) REFERENCES resumes(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );
        """)


def save_resume(filename, extracted_text, skills):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO resumes (
                filename, extracted_text, skills
            )
            VALUES (?, ?, ?)
            """,
            (
                filename,
                extracted_text,
                json.dumps(skills),
            ),
        )

        return cursor.lastrowid


def get_resume(resume_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM resumes WHERE id = ?",
            (resume_id,),
        ).fetchone()

    if row is None:
        return None

    resume = dict(row)
    resume["skills"] = json.loads(resume["skills"])

    return resume


def seed_sample_jobs():
    sample_jobs = [
        (
            "Python Developer",
            "Build backend APIs using Python, FastAPI and SQL. "
            "Use Git for version control.",
            ["python", "fastapi", "sql", "git"],
        ),
        (
            "Frontend Developer",
            "Build responsive web interfaces using React, "
            "JavaScript, HTML and CSS. Use Git.",
            ["react", "javascript", "html", "css", "git"],
        ),
        (
            "Data Analyst",
            "Perform data analysis using Python, SQL and Excel. "
            "Prepare reports from business data.",
            ["python", "sql", "excel", "data analysis"],
        ),
    ]

    with get_connection() as connection:
        count = connection.execute(
            "SELECT COUNT(*) FROM jobs"
        ).fetchone()[0]

        # Add sample jobs only when the table is empty.
        if count > 0:
            return

        connection.executemany(
            """
            INSERT INTO jobs (
                title, description, required_skills
            )
            VALUES (?, ?, ?)
            """,
            [
                (title, description, json.dumps(skills))
                for title, description, skills in sample_jobs
            ],
        )


def get_active_jobs():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM jobs
            WHERE active = 1
            ORDER BY id
            """
        ).fetchall()

    jobs = []

    for row in rows:
        job = dict(row)
        job["required_skills"] = json.loads(job["required_skills"])
        job["active"] = bool(job["active"])
        jobs.append(job)

    return jobs

