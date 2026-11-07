import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..nlp import normalize_skill
from ..schemas import (
    DeleteAccount,
    EducationIn,
    ExperienceIn,
    PasswordChange,
    PrivacyUpdate,
    ProfileUpdate,
    SkillsIn,
)
from ..security import get_current_user, hash_password, verify_password
from ..services import resume_summary

router = APIRouter(prefix="/api/profile", tags=["Profile"])


def _profile(user_id: int) -> dict:
    with db.get_connection() as connection:
        user = db.user_from_row(
            connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        )
        education = [
            dict(row)
            for row in connection.execute(
                "SELECT * FROM education WHERE user_id = ? ORDER BY graduation_year DESC, id DESC",
                (user_id,),
            )
        ]
        experience = [
            dict(row)
            for row in connection.execute(
                "SELECT * FROM experience WHERE user_id = ? ORDER BY id DESC", (user_id,)
            )
        ]

    skills = db.get_user_skills(user_id)
    resume = db.get_latest_resume(user_id)

    checks = [
        bool(user["full_name"]),
        bool(user["phone"]),
        bool(user["location"]),
        bool(education),
        bool(experience),
        bool(skills),
        resume is not None,
    ]

    return {
        "user": user,
        "education": education,
        "experience": experience,
        "skills": skills,
        "resume": resume_summary(resume),
        "completion": round(sum(checks) / len(checks) * 100),
    }


@router.get("")
def read_profile(user: dict = Depends(get_current_user)):
    return _profile(user["id"])


@router.put("")
def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    try:
        with db.get_connection() as connection:
            connection.execute(
                """
                UPDATE users
                SET full_name = ?, email = ?, phone = ?, location = ?, current_status = ?
                WHERE id = ?
                """,
                (body.full_name, body.email, body.phone, body.location,
                 body.current_status, user["id"]),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Another account already uses this email.")

    return _profile(user["id"])


# ---------- Education ----------

@router.post("/education", status_code=201)
def add_education(body: EducationIn, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        connection.execute(
            """
            INSERT INTO education (user_id, degree, institution, graduation_year, cgpa)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user["id"], body.degree, body.institution, body.graduation_year, body.cgpa),
        )
    return _profile(user["id"])


@router.put("/education/{education_id}")
def update_education(education_id: int, body: EducationIn, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE education
            SET degree = ?, institution = ?, graduation_year = ?, cgpa = ?
            WHERE id = ? AND user_id = ?
            """,
            (body.degree, body.institution, body.graduation_year, body.cgpa,
             education_id, user["id"]),
        )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Education record not found.")
    return _profile(user["id"])


@router.delete("/education/{education_id}")
def delete_education(education_id: int, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        connection.execute(
            "DELETE FROM education WHERE id = ? AND user_id = ?", (education_id, user["id"])
        )
    return _profile(user["id"])


# ---------- Experience ----------

@router.post("/experience", status_code=201)
def add_experience(body: ExperienceIn, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        connection.execute(
            """
            INSERT INTO experience (user_id, job_title, company, start_date, end_date, description)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user["id"], body.job_title, body.company, body.start_date,
             body.end_date, body.description),
        )
    return _profile(user["id"])


@router.put("/experience/{experience_id}")
def update_experience(experience_id: int, body: ExperienceIn, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE experience
            SET job_title = ?, company = ?, start_date = ?, end_date = ?, description = ?
            WHERE id = ? AND user_id = ?
            """,
            (body.job_title, body.company, body.start_date, body.end_date,
             body.description, experience_id, user["id"]),
        )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Experience record not found.")
    return _profile(user["id"])


@router.delete("/experience/{experience_id}")
def delete_experience(experience_id: int, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        connection.execute(
            "DELETE FROM experience WHERE id = ? AND user_id = ?", (experience_id, user["id"])
        )
    return _profile(user["id"])


# ---------- Skills ----------

@router.put("/skills")
def replace_skills(body: SkillsIn, user: dict = Depends(get_current_user)):
    skills = sorted({normalize_skill(skill) for skill in body.skills if skill.strip()})

    with db.get_connection() as connection:
        connection.execute("DELETE FROM user_skills WHERE user_id = ?", (user["id"],))
        connection.executemany(
            "INSERT INTO user_skills (user_id, skill) VALUES (?, ?)",
            [(user["id"], skill) for skill in skills],
        )
    return _profile(user["id"])


# ---------- Settings ----------

@router.put("/password")
def change_password(body: PasswordChange, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        row = connection.execute(
            "SELECT password_hash FROM users WHERE id = ?", (user["id"],)
        ).fetchone()

        if not verify_password(body.current_password, row["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")

        connection.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(body.new_password), user["id"]),
        )
    return {"message": "Password updated."}


@router.put("/privacy")
def update_privacy(body: PrivacyUpdate, user: dict = Depends(get_current_user)):
    with db.get_connection() as connection:
        connection.execute(
            "UPDATE users SET profile_visible = ? WHERE id = ?",
            (int(body.profile_visible), user["id"]),
        )
    return _profile(user["id"])


@router.post("/delete")
def delete_account(body: DeleteAccount, user: dict = Depends(get_current_user)):
    """Deletes the account and the user's resumes, matches and applications."""
    with db.get_connection() as connection:
        row = connection.execute(
            "SELECT password_hash FROM users WHERE id = ?", (user["id"],)
        ).fetchone()
        if not verify_password(body.password, row["password_hash"]):
            raise HTTPException(status_code=400, detail="Password is incorrect.")

        # match_results was created before cascades were added, so clear it first.
        connection.execute(
            """
            DELETE FROM match_results
            WHERE resume_id IN (SELECT id FROM resumes WHERE user_id = ?)
            """,
            (user["id"],),
        )
        # A recruiter's jobs stay for applicants' history but are closed.
        connection.execute(
            "UPDATE jobs SET active = 0, recruiter_id = NULL WHERE recruiter_id = ?",
            (user["id"],),
        )
        connection.execute("DELETE FROM resumes WHERE user_id = ?", (user["id"],))
        connection.execute("DELETE FROM users WHERE id = ?", (user["id"],))

    return {"message": "Account deleted."}
