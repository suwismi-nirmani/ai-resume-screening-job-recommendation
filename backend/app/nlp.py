
import re

SKILL_ALIASES = {
    # Programming languages
    "python": ["python"],
    "java": ["java"],
    "javascript": ["javascript", "js", "ecmascript"],
    "typescript": ["typescript"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "csharp"],
    "php": ["php"],
    "kotlin": ["kotlin"],

    # Web and frameworks
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "react": ["react", "reactjs", "react.js"],
    "angular": ["angular", "angularjs"],
    "vue": ["vue", "vue.js", "vuejs"],
    "node.js": ["node.js", "nodejs"],
    "express.js": ["express.js", "expressjs"],
    "django": ["django"],
    "flask": ["flask"],
    "fastapi": ["fastapi", "fast api"],
    "spring boot": ["spring boot", "springboot"],
    ".net": [".net", "dotnet", "asp.net"],
    "rest api": ["rest api", "rest apis", "restful", "restful api", "restful apis"],
    "tailwind css": ["tailwind", "tailwind css"],

    # Databases
    "sql": ["sql"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres"],
    "mongodb": ["mongodb", "mongo db"],
    "sqlite": ["sqlite"],

    # Cloud, DevOps and tools
    "git": ["git"],
    "github": ["github"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "linux": ["linux", "ubuntu"],
    "ci/cd": ["ci/cd", "ci cd", "continuous integration"],

    # Data and AI
    "data analysis": ["data analysis", "data analytics", "analysing data", "analyzing data"],
    "excel": ["excel", "microsoft excel", "ms excel"],
    "power bi": ["power bi", "powerbi"],
    "tableau": ["tableau"],
    "statistics": ["statistics", "statistical analysis"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "machine learning": ["machine learning", "ml models"],
    "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"],
    "scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"],
    "data visualization": ["data visualization", "data visualisation"],

    # Testing and support
    "software testing": ["software testing", "manual testing", "unit testing", "test cases"],
    "selenium": ["selenium"],
    "pytest": ["pytest"],
    "networking": ["networking", "computer networks", "tcp/ip"],
    "troubleshooting": ["troubleshooting", "troubleshoot"],
    "windows": ["windows"],

    # Design
    "figma": ["figma"],
    "ui/ux": ["ui/ux", "ui ux", "user experience", "ux design"],

    # Professional skills
    "communication": ["communication"],
    "problem solving": ["problem solving", "problem-solving"],
    "teamwork": ["teamwork", "team work", "team player"],
    "leadership": ["leadership"],
    "agile": ["agile", "scrum"],
}

# Having the left skill also means having the right skills.
SKILL_IMPLIES = {
    "mysql": ["sql"],
    "postgresql": ["sql"],
    "sqlite": ["sql"],
    "django": ["python"],
    "flask": ["python"],
    "fastapi": ["python"],
    "pandas": ["python"],
    "typescript": ["javascript"],
    "react": ["javascript"],
    "node.js": ["javascript"],
    "github": ["git"],
}


def preprocess_text(text: str) -> str:
    text = text.lower()

    # Preserve characters used in C++, C#, .NET, Node.js, CI/CD and UI/UX.
    text = re.sub(r"[^a-z0-9+#./\-\s]", " ", text)

    return re.sub(r"\s+", " ", text).strip()


def _contains(cleaned_text: str, alias: str) -> bool:
    pattern = (
        r"(?<![a-z0-9+#])"
        + re.escape(alias)
        + r"(?![a-z0-9+#])"
    )
    return re.search(pattern, cleaned_text) is not None


def extract_skills(text: str) -> list[str]:
    cleaned_text = preprocess_text(text)
    detected = set()

    for skill, aliases in SKILL_ALIASES.items():
        if any(_contains(cleaned_text, alias) for alias in aliases):
            detected.add(skill)

    for skill in list(detected):
        detected.update(SKILL_IMPLIES.get(skill, []))

    return sorted(detected)


def normalize_skill(skill: str) -> str:
    """Map a typed skill (for example "ReactJS") to its canonical form."""
    cleaned = preprocess_text(skill)

    for canonical, aliases in SKILL_ALIASES.items():
        if cleaned == canonical or cleaned in aliases:
            return canonical

    return cleaned
