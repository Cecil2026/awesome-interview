#!/usr/bin/env python3
"""Walk all markdown files and rebuild docs/questions.json.

Each entry is the minimum needed by the GitHub Pages random picker and the
daily-question workflow: title, source file, line number, category, topics
(if present in the body).

Usage:
    python tools/build_index.py                  # writes docs/questions.json
    python tools/build_index.py --check          # exits non-zero if rebuild would change the file
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


HEADING_RE = re.compile(r"^### (\d+)\.\s+(.+?)\s*$", re.MULTILINE)
TOPICS_RE = re.compile(r"^\*\*Topics:\*\*\s*(.+?)\s*$", re.MULTILINE)
DIFFICULTY_RE = re.compile(r"^\*\*Difficulty:\*\*\s*(.+?)\s*$", re.MULTILINE)

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT = REPO_ROOT / "docs" / "questions.json"


SKIP_DIRS = {".git", "node_modules", ".github", "docs"}


def category_for(path: Path) -> str:
    parts = path.relative_to(REPO_ROOT).parts
    if not parts:
        return "misc"
    return parts[0]


def parse_file(path: Path) -> list[dict]:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return []
    matches = list(HEADING_RE.finditer(text))
    if not matches:
        return []
    out = []
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end]
        topics_match = TOPICS_RE.search(body)
        difficulty_match = DIFFICULTY_RE.search(body)
        rel = path.relative_to(REPO_ROOT).as_posix()
        line = text.count("\n", 0, m.start()) + 1
        out.append({
            "id": f"{rel}#{m.group(1)}",
            "number": int(m.group(1)),
            "title": m.group(2),
            "file": rel,
            "line": line,
            "category": category_for(path),
            "topics": [t.strip() for t in topics_match.group(1).split(",")] if topics_match else [],
            "difficulty": difficulty_match.group(1) if difficulty_match else None,
        })
    return out


def walk_markdown() -> list[Path]:
    out = []
    for path in REPO_ROOT.rglob("*.md"):
        if any(part in SKIP_DIRS for part in path.relative_to(REPO_ROOT).parts):
            continue
        if path.name.lower() == "readme.md":
            continue
        if path.name.lower().endswith(".zh.md"):
            continue
        out.append(path)
    return sorted(out)


def build() -> dict:
    questions = []
    for path in walk_markdown():
        questions.extend(parse_file(path))
    questions.sort(key=lambda q: (q["category"], q["file"], q["number"]))
    return {
        "generated_by": "tools/build_index.py",
        "total": len(questions),
        "categories": sorted({q["category"] for q in questions}),
        "questions": questions,
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--check", action="store_true", help="Exit non-zero if rebuild would change the file")
    args = p.parse_args()

    data = build()
    new = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    if args.check:
        if not OUTPUT.exists():
            print(f"{OUTPUT} does not exist; run without --check to create it.")
            sys.exit(1)
        existing = OUTPUT.read_text(encoding="utf-8")
        if existing != new:
            print(f"{OUTPUT.as_posix()} is out of date. Run: python tools/build_index.py")
            sys.exit(1)
        print(f"{OUTPUT.as_posix()} is up to date ({data['total']} questions).")
        return

    OUTPUT.write_text(new, encoding="utf-8")
    print(f"Wrote {OUTPUT.as_posix()} ({data['total']} questions across {len(data['categories'])} categories).")


if __name__ == "__main__":
    main()
