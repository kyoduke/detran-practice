#!/usr/bin/env python3
import argparse
import json
import re
import time
from html import unescape
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen


DEFAULT_URL = "http://simulado.detran.rj.gov.br/simulados/iniciarProva/habilitacao"
IMAGE_BASE_URL = "http://simulado.detran.rj.gov.br/img/placas/"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "public" / "detran_rj_exams.json"


def fetch_html(url, timeout):
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; detran-rj-scraper/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    with urlopen(req, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def extract_js_object(html, variable_name):
    pattern = re.compile(
        r"var\s+" + re.escape(variable_name) + r"\s*=\s*(\{.*?\});", re.DOTALL
    )
    match = pattern.search(html)
    if not match:
        raise ValueError(f"Could not find JavaScript variable: {variable_name}")
    return match.group(1)


def extract_numero_prova(html):
    match = re.search(r"var\s+numero_prova\s*=\s*'([^']+)'\s*;", html)
    if not match:
        raise ValueError("Could not find JavaScript variable: numero_prova")
    return match.group(1)


def normalize_questions(raw_questoes):
    data = json.loads(raw_questoes)
    questions = []

    for question in data.get("Questao", []):
        if not question:
            continue

        correct_key = str(question.get("respCorreta", ""))
        alternatives = {
            "1": question.get("resposta1"),
            "2": question.get("resposta2"),
            "3": question.get("resposta3"),
            "4": question.get("resposta4"),
        }

        questions.append(
            {
                "sequence": int(question["sequenciaQuestao"]),
                "question": question.get("desc_questao"),
                "image_code": question.get("codigoImagem") or None,
                "image_url": (
                    f"{IMAGE_BASE_URL}{question.get('codigoImagem')}.GIF"
                    if question.get("codigoImagem")
                    else None
                ),
                "video_libras": question.get("videoLibras") or None,
                "alternatives": alternatives,
                "correct_answer": correct_key,
                "correct_answer_text": alternatives.get(correct_key),
                "raw": question,
            }
        )

    return questions


def normalize_text(value):
    return " ".join((value or "").split()).casefold()


def make_question_key(question):
    return (
        normalize_text(question.get("question")),
        normalize_text(question.get("image_code")),
        normalize_text(question.get("correct_answer_text")),
    )


def add_unique_alternative(question, text, is_correct):
    normalized = normalize_text(text)
    if not normalized:
        return

    for alternative in question["alternatives"]:
        if normalize_text(alternative["text"]) == normalized:
            alternative["is_correct"] = alternative["is_correct"] or is_correct
            return

    question["alternatives"].append(
        {
            "id": str(len(question["alternatives"]) + 1),
            "text": text,
            "is_correct": is_correct,
        }
    )


def deduplicate_exams(exams):
    questions_by_key = {}
    unique_questions = []
    exam_versions = {}

    for version, exam in sorted(exams.items(), key=lambda item: int(item[0])):
        question_ids = []

        for original in exam["questions"]:
            key = make_question_key(original)
            question = questions_by_key.get(key)

            if question is None:
                question = {
                    "id": f"q{len(unique_questions) + 1}",
                    "question": original.get("question"),
                    "image_code": original.get("image_code"),
                    "image_url": original.get("image_url"),
                    "video_libras": original.get("video_libras"),
                    "alternatives": [],
                    "correct_answer_text": original.get("correct_answer_text"),
                    "sources": [],
                }
                questions_by_key[key] = question
                unique_questions.append(question)

            for alternative_id, alternative_text in original.get(
                "alternatives", {}
            ).items():
                add_unique_alternative(
                    question,
                    alternative_text,
                    alternative_id == original.get("correct_answer"),
                )

            source = {
                "numero_prova": version,
                "sequence": original.get("sequence"),
                "original_correct_answer": original.get("correct_answer"),
            }
            if source not in question["sources"]:
                question["sources"].append(source)

            question_ids.append(question["id"])

        exam_versions[version] = {
            "numero_prova": version,
            "source_url": exam["source_url"],
            "question_count": len(question_ids),
            "question_ids": question_ids,
        }

    return unique_questions, exam_versions


def scrape(url, target_versions, max_attempts, delay, timeout):
    exams = {}
    errors = []

    for attempt in range(1, max_attempts + 1):
        if target_versions and len(exams) >= target_versions:
            break

        try:
            html = fetch_html(url, timeout)
            numero_prova = extract_numero_prova(html)
            raw_questoes = extract_js_object(html, "questoes")
            questions = normalize_questions(unescape(raw_questoes))

            if numero_prova not in exams:
                exams[numero_prova] = {
                    "numero_prova": numero_prova,
                    "source_url": url,
                    "question_count": len(questions),
                    "questions": questions,
                }
                print(
                    f"Collected exam version {numero_prova} ({len(questions)} questions)"
                )
            else:
                print(f"Skipped duplicate exam version {numero_prova}")

        except (
            ValueError,
            json.JSONDecodeError,
            HTTPError,
            URLError,
            TimeoutError,
        ) as exc:
            message = f"Attempt {attempt} failed: {exc}"
            errors.append(message)
            print(message)

        if delay > 0 and attempt < max_attempts:
            time.sleep(delay)

    unique_questions, exam_versions = deduplicate_exams(exams)

    return {
        "source_url": url,
        "attempts": attempt,
        "versions_collected": len(exams),
        "total_exam_question_slots": sum(
            len(exam["questions"]) for exam in exams.values()
        ),
        "unique_questions_collected": len(unique_questions),
        "questions": unique_questions,
        "exam_versions": exam_versions,
        "errors": errors,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Detran RJ simulated exam versions to JSON."
    )
    parser.add_argument("--url", default=DEFAULT_URL, help="Exam start URL")
    parser.add_argument(
        "--output", default=str(DEFAULT_OUTPUT_PATH), help="Output JSON file"
    )
    parser.add_argument(
        "--target-versions",
        type=int,
        default=10,
        help="Stop after this many unique versions",
    )
    parser.add_argument(
        "--max-attempts", type=int, default=100, help="Maximum page fetches"
    )
    parser.add_argument(
        "--delay", type=float, default=0.25, help="Delay between requests in seconds"
    )
    parser.add_argument(
        "--timeout", type=float, default=20, help="Request timeout in seconds"
    )
    args = parser.parse_args()

    result = scrape(
        args.url, args.target_versions, args.max_attempts, args.delay, args.timeout
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as output_file:
        json.dump(result, output_file, ensure_ascii=False, indent=2)

    print(f"Saved {result['versions_collected']} exam versions to {output_path}")


if __name__ == "__main__":
    main()
