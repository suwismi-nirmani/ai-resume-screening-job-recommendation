"""
Seed demo accounts and sample jobs.

Runs automatically when the API starts (only fills empty tables).
To rebuild the local database from scratch:

    python -m app.seed --reset
"""

import argparse
import json
from datetime import date, timedelta
from pathlib import Path

from . import db
from .security import hash_password

SAMPLE_JOBS_FILE = Path(__file__).resolve().parents[2] / "samples" / "sample_jobs.json"

DEMO_PASSWORD = "Demo@123"
DEMO_USERS = [
    {
        "full_name": "Demo Candidate",
        "email": "candidate@careermatch.demo",
        "role": "candidate",
        "location": "Colombo, Sri Lanka",
        "current_status": "Student",
    },
    {
        "full_name": "Demo Recruiter",
        "email": "recruiter@careermatch.demo",
        "role": "recruiter",
        "location": "Colombo, Sri Lanka",
        "current_status": "Recruiter",
    },
]


def seed_demo_users():
    with db.get_connection() as connection:
        for user in DEMO_USERS:
            exists = connection.execute(
                "SELECT 1 FROM users WHERE email = ?", (user["email"],)
            ).fetchone()
            if exists:
                continue
            connection.execute(
                """
                INSERT INTO users (
                    full_name, email, password_hash, role,
                    location, current_status
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user["full_name"],
                    user["email"],
                    hash_password(DEMO_PASSWORD),
                    user["role"],
                    user["location"],
                    user["current_status"],
                ),
            )


def seed_sample_jobs():
    """Insert the sample jobs, but only into an empty jobs table."""
    jobs = json.loads(SAMPLE_JOBS_FILE.read_text(encoding="utf-8"))

    with db.get_connection() as connection:
        if connection.execute("SELECT COUNT(*) FROM jobs").fetchone()[0] > 0:
            return

        recruiter = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (DEMO_USERS[1]["email"],),
        ).fetchone()
        recruiter_id = recruiter["id"] if recruiter else None

        connection.executemany(
            """
            INSERT INTO jobs (
                title, company, category, location, employment_type,
                work_mode, experience_level, salary_range, description,
                responsibilities, required_skills, nice_to_have,
                posted_date, recruiter_id, active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            [
                (
                    job["title"],
                    job["company"],
                    job["category"],
                    job["location"],
                    job["employment_type"],
                    job["work_mode"],
                    job["experience_level"],
                    job["salary_range"],
                    job["description"],
                    json.dumps(job["responsibilities"]),
                    json.dumps(job["required_skills"]),
                    json.dumps(job["nice_to_have"]),
                    (date.today() - timedelta(days=job["posted_days_ago"])).isoformat(),
                    recruiter_id,
                )
                for job in jobs
            ],
        )


def seed_all():
    seed_demo_users()
    seed_sample_jobs()


def main():
    parser = argparse.ArgumentParser(description="Seed the CareerMatch AI database.")
    parser.add_argument("--reset", action="store_true", help="Delete the database first.")
    args = parser.parse_args()

    if args.reset and db.DATABASE_PATH.exists():
        db.DATABASE_PATH.unlink()
        print(f"Deleted {db.DATABASE_PATH}")

    db.init_db()
    seed_all()
    print("Database ready. Demo logins (password Demo@123):")
    for user in DEMO_USERS:
        print(f"  {user['role']:<10} {user['email']}")


if __name__ == "__main__":
    main()
