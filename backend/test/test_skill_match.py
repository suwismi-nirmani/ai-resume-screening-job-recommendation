
from app.matching import compute_skill_match


def test_skill_match():
    result = compute_skill_match(
        ["Python", "JavaScript", "SQL"],
        ["Python", "Django", "JavaScript", "SQL", "AWS"],
    )

    assert result["matched_skills"] == [
        "python", "javascript", "sql"
    ]
    assert result["missing_skills"] == ["django", "aws"]
    assert result["skill_match"] == 60.0


def test_empty_required_skills():
    result = compute_skill_match(["Python"], [])

    assert result["matched_skills"] == []
    assert result["missing_skills"] == []
    assert result["skill_match"] == 0.0


def test_no_matching_skills():
    result = compute_skill_match(["Java"], ["Python", "SQL"])

    assert result["matched_skills"] == []
    assert result["missing_skills"] == ["python", "sql"]
    assert result["skill_match"] == 0.0
