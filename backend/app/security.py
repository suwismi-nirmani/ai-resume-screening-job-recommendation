"""
Password hashing and login sessions.

Uses only the Python standard library:
- Passwords are hashed with PBKDF2-SHA256 and a random salt.
- Login returns a random token. Only its SHA-256 hash is stored, so a leaked
  database does not reveal usable tokens.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import db

PBKDF2_ITERATIONS = 200_000
SESSION_DAYS = 7

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        _, iterations, salt, expected = stored_hash.split("$")
    except ValueError:
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations)
    ).hex()
    return hmac.compare_digest(digest, expected)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)

    with db.get_connection() as connection:
        connection.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            (_hash_token(token), user_id, expires_at.isoformat()),
        )

    return token


def delete_session(token: str):
    with db.get_connection() as connection:
        connection.execute(
            "DELETE FROM sessions WHERE token_hash = ?", (_hash_token(token),)
        )


def _user_for_token(token: str) -> dict | None:
    with db.get_connection() as connection:
        row = connection.execute(
            """
            SELECT u.*, s.expires_at
            FROM sessions AS s
            JOIN users AS u ON u.id = s.user_id
            WHERE s.token_hash = ?
            """,
            (_hash_token(token),),
        ).fetchone()

    if row is None:
        return None

    if datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
        delete_session(token)
        return None

    user = db.user_from_row(row)
    user.pop("expires_at", None)
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict | None:
    if credentials is None:
        return None
    return _user_for_token(credentials.credentials)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    user = _user_for_token(credentials.credentials) if credentials else None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to continue.",
        )

    return user


def require_candidate(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="This page is for candidates.")
    return user


def require_recruiter(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="This page is for recruiters.")
    return user
