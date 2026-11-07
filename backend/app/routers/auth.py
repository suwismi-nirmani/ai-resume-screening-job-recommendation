import sqlite3

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from .. import db
from ..schemas import LoginRequest, SignupRequest
from ..security import (
    bearer_scheme,
    create_session,
    delete_session,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", status_code=201)
def signup(body: SignupRequest):
    try:
        with db.get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (full_name, email, password_hash, role)
                VALUES (?, ?, ?, ?)
                """,
                (body.full_name, body.email, hash_password(body.password), body.role),
            )
            user_id = cursor.lastrowid
            user = db.user_from_row(
                connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    return {"token": create_session(user_id), "user": user}


@router.post("/login")
def login(body: LoginRequest):
    with db.get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ?", (body.email,)
        ).fetchone()

    # Same message for unknown email and wrong password, so the API does not
    # reveal which emails are registered.
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return {"token": create_session(row["id"]), "user": db.user_from_row(row)}


@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
    if credentials:
        delete_session(credentials.credentials)
    return {"message": "Logged out."}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user
