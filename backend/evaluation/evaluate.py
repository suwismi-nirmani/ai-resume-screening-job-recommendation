"""
Runs every labelled resume through the same matching code the API uses and
reports Precision@K, Recall@K, F1-score and Top-K accuracy.

Run from the backend folder:
    python -m evaluation.evaluate
    python -m evaluation.evaluate --k 3 5 10
"""

import argparse
import csv
import json
from pathlib import Path

from app.matching import MODEL_VERSION, rank_jobs
from app.nlp import extract_skills

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SAMPLES = PROJECT_ROOT / "samples"
EVALUATION_DIR = SAMPLES / "evaluation"
RESULTS_FILE = Path(__file__).resolve().parent / "results.csv"


def load_jobs() -> list[dict]:
    jobs = json.loads((SAMPLES / "sample_jobs.json").read_text(encoding="utf-8"))
    for index, job in enumerate(jobs, start=1):
        job["id"] = index
    return jobs


def precision_at_k(ranked: list[str], relevant: set[str], k: int) -> float:
    return len([title for title in ranked[:k] if title in relevant]) / k


def recall_at_k(ranked: list[str], relevant: set[str], k: int) -> float:
    if not relevant:
        return 0.0
    return len([title for title in ranked[:k] if title in relevant]) / len(relevant)


def f1(precision: float, recall: float) -> float:
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def top_k_hit(ranked: list[str], relevant: set[str], k: int) -> float:
    return 1.0 if any(title in relevant for title in ranked[:k]) else 0.0


def evaluate(ks: list[int]) -> dict:
    jobs = load_jobs()
    labels = json.loads((EVALUATION_DIR / "labels.json").read_text(encoding="utf-8"))

    known_titles = {job["title"] for job in jobs}
    rows = []

    for filename, relevant_titles in labels.items():
        unknown = set(relevant_titles) - known_titles
        if unknown:
            raise ValueError(f"{filename}: labels name unknown jobs {unknown}")

        text = (EVALUATION_DIR / "resumes" / filename).read_text(encoding="utf-8")
        ranked = [r["title"] for r in rank_jobs(text, extract_skills(text), jobs)]
        relevant = set(relevant_titles)

        row = {"resume": filename, "top_3": " | ".join(ranked[:3])}
        for k in ks:
            p = precision_at_k(ranked, relevant, k)
            r = recall_at_k(ranked, relevant, k)
            row[f"precision@{k}"] = p
            row[f"recall@{k}"] = r
            row[f"f1@{k}"] = f1(p, r)
            row[f"top{k}_hit"] = top_k_hit(ranked, relevant, k)
        rows.append(row)

    summary = {"model_version": MODEL_VERSION, "resumes": len(rows), "jobs": len(jobs)}
    for k in ks:
        for metric in ["precision", "recall", "f1"]:
            key = f"{metric}@{k}"
            summary[key] = sum(row[key] for row in rows) / len(rows)
        summary[f"top{k}_accuracy"] = sum(row[f"top{k}_hit"] for row in rows) / len(rows)

    return {"summary": summary, "rows": rows}


def main():
    parser = argparse.ArgumentParser(description="Evaluate job recommendations.")
    parser.add_argument("--k", type=int, nargs="+", default=[3, 5])
    args = parser.parse_args()

    result = evaluate(args.k)
    summary = result["summary"]

    print(f"Model {summary['model_version']}: {summary['resumes']} resumes, {summary['jobs']} jobs\n")
    print(f"{'K':>3}  {'Precision':>9}  {'Recall':>7}  {'F1':>6}  {'Top-K acc':>9}")
    for k in args.k:
        print(
            f"{k:>3}  {summary[f'precision@{k}']:>9.2%}  {summary[f'recall@{k}']:>7.2%}"
            f"  {summary[f'f1@{k}']:>6.2%}  {summary[f'top{k}_accuracy']:>9.2%}"
        )

    with RESULTS_FILE.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(result["rows"][0].keys()))
        writer.writeheader()
        writer.writerows(result["rows"])

    print(f"\nPer-resume results saved to {RESULTS_FILE}")


if __name__ == "__main__":
    main()
