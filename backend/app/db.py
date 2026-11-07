import sqlite3
import json
import os
from contextlib import contextmanager
from pathlib import Path

DATABASE_PATH = Path(
    os.getenv(
        "DATABASE_PATH",
        Path(__file__).resolve().parent.parent / "data" / "app.db",
    )
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

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter')),
    phone TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    current_status TEXT NOT NULL DEFAULT '',
    profile_visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    degree TEXT NOT NULL,
    institution TEXT NOT NULL,
    graduation_year INTEGER,
    cgpa REAL
);

CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    start_date TEXT NOT NULL DEFAULT '',
    end_date TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS user_skills (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    PRIMARY KEY (user_id, skill)
);

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

CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    cover_letter TEXT NOT NULL DEFAULT '',
    final_score REAL,
    status TEXT NOT NULL DEFAULT 'under_review'
        CHECK (status IN ('under_review', 'shortlisted', 'rejected')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS screening_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    text_similarity REAL NOT NULL,
    skill_match REAL NOT NULL,
    final_score REAL NOT NULL,
    model_version TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


EXTRA_COLUMNS = {
    "resumes": {
        "user_id": "INTEGER REFERENCES users(id) ON DELETE CASCADE",
    },
    "jobs": {
        "company": "TEXT NOT NULL DEFAULT ''",
        "category": "TEXT NOT NULL DEFAULT 'software-development'",
        "location": "TEXT NOT NULL DEFAULT ''",
        "employment_type": "TEXT NOT NULL DEFAULT 'Full-time'",
        "work_mode": "TEXT NOT NULL DEFAULT 'On-site'",
        "experience_level": "TEXT NOT NULL DEFAULT ''",
        "salary_range": "TEXT NOT NULL DEFAULT ''",
        "responsibilities": "TEXT NOT NULL DEFAULT '[]'",
        "nice_to_have": "TEXT NOT NULL DEFAULT '[]'",
        "posted_date": "TEXT NOT NULL DEFAULT (date('now'))",
        "recruiter_id": "INTEGER REFERENCES users(id) ON DELETE SET NULL",
    },
}

CATEGORIES = {
    "software-development": "Software Development",
    "data-analysis": "Data Analysis",
    "ai-machine-learning": "AI / Machine Learning",
    "web-development": "Web Development",
    "internships": "Internships",
}


def _add_missing_columns(connection):
    for table, columns in EXTRA_COLUMNS.items():
        existing = {
            row["name"]
            for row in connection.execute(f"PRAGMA table_info({table})")
        }
        for name, definition in columns.items():
            if name not in existing:
                # SQLite cannot ADD COLUMN with a non-constant default.
                safe_definition = definition.replace("(date('now'))", "''")
                connection.execute(
                    f"ALTER TABLE {table} ADD COLUMN {name} {safe_definition}"
                )


def init_db():
    with get_connection() as connection:
        connection.executescript(SCHEMA)
        _add_missing_columns(connection)


# ---------- Row helpers ----------

def user_from_row(row) -> dict | None:
    if row is None:
        return None
    user = dict(row)
    user.pop("password_hash", None)
    user["profile_visible"] = bool(user.get("profile_visible", 1))
    return user


def job_from_row(row) -> dict | None:
    if row is None:
        return None
    job = dict(row)
    for key in ("required_skills", "responsibilities", "nice_to_have"):
        if key in job:
            job[key] = json.loads(job[key] or "[]")
    if "active" in job:
        job["active"] = bool(job["active"])
    if "category" in job:
        job["category_name"] = CATEGORIES.get(job["category"], job["category"])
    return job


def resume_from_row(row) -> dict | None:
    if row is None:
        return None
    resume = dict(row)
    resume["skills"] = json.loads(resume["skills"])
    return resume


# ---------- Resumes ----------

def save_resume(filename, extracted_text, skills, user_id=None):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO resumes (filename, extracted_text, skills, user_id)
            VALUES (?, ?, ?, ?)
            """,
            (filename, extracted_text, json.dumps(skills), user_id),
        )
        return cursor.lastrowid


def get_resume(resume_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM resumes WHERE id = ?",
            (resume_id,),
        ).fetchone()
    return resume_from_row(row)


def get_latest_resume(user_id):
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT * FROM resumes
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
    return resume_from_row(row)


# ---------- Jobs ----------

def get_active_jobs(category=None, query=None):
    sql = "SELECT * FROM jobs WHERE active = 1"
    params = []

    if category:
        sql += " AND category = ?"
        params.append(category)

    if query:
        sql += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)"
        like = f"%{query}%"
        params.extend([like, like, like])

    sql += " ORDER BY posted_date DESC, id"

    with get_connection() as connection:
        rows = connection.execute(sql, params).fetchall()

    return [job_from_row(row) for row in rows]


def get_job(job_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM jobs WHERE id = ?",
            (job_id,),
        ).fetchone()
    return job_from_row(row)


# ---------- Profile skills ----------

def get_user_skills(user_id) -> list[str]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT skill FROM user_skills WHERE user_id = ? ORDER BY skill",
            (user_id,),
        ).fetchall()
    return [row["skill"] for row in rows]


# ---------- Match results ----------

def save_match_results(resume_id, results, model_version):
    """Replace any earlier results for this resume with the new ones."""
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM match_results WHERE resume_id = ?",
            (resume_id,),
        )

        connection.executemany(
            """
            INSERT INTO match_results (
                resume_id, job_id, text_similarity,
                skill_match, final_score, model_version
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    resume_id,
                    result["job_id"],
                    result["text_similarity"],
                    result["skill_match"],
                    result["final_score"],
                    model_version,
                )
                for result in results
            ],
        )


def get_match_results(resume_id):
    """Saved results for a resume, highest final score first."""
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                m.job_id,
                j.title,
                j.description,
                j.required_skills,
                m.text_similarity,
                m.skill_match,
                m.final_score,
                m.model_version,
                m.created_at
            FROM match_results AS m
            JOIN jobs AS j ON j.id = m.job_id
            WHERE m.resume_id = ?
            ORDER BY m.final_score DESC, m.skill_match DESC, j.title
            """,
            (resume_id,),
        ).fetchall()

    results = []

    for position, row in enumerate(rows, start=1):
        result = dict(row)
        result["required_skills"] = json.loads(result["required_skills"])
        result["rank"] = position
        results.append(result)

    return results
