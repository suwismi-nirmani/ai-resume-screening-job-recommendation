"""Request bodies. Pydantic validates them and FastAPI returns 422 on bad input."""

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_PATTERN.match(value):
        raise ValueError("Enter a valid email address.")
    return value


def _strip(value: str) -> str:
    return value.strip() if isinstance(value, str) else value


class StrippedModel(BaseModel):
    """Trims spaces from every text field."""

    @field_validator("*", mode="before")
    @classmethod
    def strip_text(cls, value):
        return _strip(value)


# ---------- Auth ----------

class SignupRequest(StrippedModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=254)
    password: str = Field(min_length=6, max_length=128)
    role: Literal["candidate", "recruiter"] = "candidate"
    agree_terms: bool

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        return _clean_email(value)

    @field_validator("agree_terms")
    @classmethod
    def must_agree(cls, value):
        if not value:
            raise ValueError("You must agree to the Terms of Use and Privacy Policy.")
        return value


class LoginRequest(StrippedModel):
    email: str
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def lower_email(cls, value):
        return value.lower()


# ---------- Profile ----------

class ProfileUpdate(StrippedModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=254)
    phone: str = Field(default="", max_length=30)
    location: str = Field(default="", max_length=100)
    current_status: str = Field(default="", max_length=60)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        return _clean_email(value)

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value):
        if value and not re.fullmatch(r"[0-9+()\-\s]{7,30}", value):
            raise ValueError("Enter a valid phone number.")
        return value


class EducationIn(StrippedModel):
    degree: str = Field(min_length=2, max_length=150)
    institution: str = Field(min_length=2, max_length=150)
    graduation_year: int | None = Field(default=None, ge=1950, le=2100)
    cgpa: float | None = Field(default=None, ge=0, le=4.5)


class ExperienceIn(StrippedModel):
    job_title: str = Field(min_length=2, max_length=120)
    company: str = Field(min_length=2, max_length=120)
    start_date: str = Field(default="", max_length=20)
    end_date: str = Field(default="", max_length=20)
    description: str = Field(default="", max_length=1000)


class SkillsIn(BaseModel):
    skills: list[str] = Field(max_length=50)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)


class PrivacyUpdate(BaseModel):
    profile_visible: bool


class DeleteAccount(BaseModel):
    password: str = Field(min_length=1)


# ---------- Applications ----------

class ApplicationIn(StrippedModel):
    job_id: int
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=254)
    phone: str = Field(default="", max_length=30)
    cover_letter: str = Field(default="", max_length=500)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        return _clean_email(value)


class ApplicationStatusIn(BaseModel):
    status: Literal["under_review", "shortlisted", "rejected"]


# ---------- Recruiter ----------

class JobIn(StrippedModel):
    title: str = Field(min_length=2, max_length=120)
    company: str = Field(min_length=2, max_length=120)
    category: Literal[
        "software-development",
        "data-analysis",
        "ai-machine-learning",
        "web-development",
        "internships",
    ]
    location: str = Field(min_length=2, max_length=100)
    employment_type: Literal["Full-time", "Part-time", "Contract", "Internship"]
    work_mode: Literal["On-site", "Hybrid", "Remote"]
    experience_level: str = Field(default="", max_length=60)
    salary_range: str = Field(default="", max_length=60)
    description: str = Field(min_length=20, max_length=5000)
    responsibilities: list[str] = Field(default_factory=list, max_length=20)
    required_skills: list[str] = Field(min_length=1, max_length=30)
    nice_to_have: list[str] = Field(default_factory=list, max_length=30)


class JobStatusIn(BaseModel):
    active: bool


class ScreenIn(BaseModel):
    resume_id: int
    job_id: int


# ---------- Support ----------

class SupportMessageIn(StrippedModel):
    subject: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=10, max_length=2000)
