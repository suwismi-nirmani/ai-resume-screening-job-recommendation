import re

SKILL_ALIASES = {
    "python": ["python"],
    "java": ["java"],
    "javascript": ["javascript", "js"],
    "react": ["react", "reactjs", "react.js"],
    "fastapi": ["fastapi", "fast api"],
    "sql": ["sql"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "git": ["git"],
    "github": ["github"],
    "machine learning": ["machine learning"],
    "data analysis": ["data analysis", "data analytics"],
    "excel": ["excel", "microsoft excel"],
    "c++": ["c++"],
    "c#": ["c#"],
}


def preprocess_text(text: str) -> str:
    text = text.lower()

    # Preserve punctuation used in C++, C# and React.js.
    text = re.sub(r"[^a-z0-9+#.\s]", " ", text)

    return re.sub(r"\s+", " ", text).strip()


def extract_skills(text: str) -> list[str]:
    cleaned_text = preprocess_text(text)
    detected_skills = []

    for skill, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = (
                r"(?<![a-z0-9+#])"
                + re.escape(alias)
                + r"(?![a-z0-9+#])"
            )

            if re.search(pattern, cleaned_text):
                detected_skills.append(skill)
                break

    return sorted(detected_skills)
