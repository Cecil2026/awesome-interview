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
import sys
from pathlib import Path

from _md import (
    REPO_ROOT,
    HEADING_RE,
    category_for,
    parse_file as parse_entries_file,
    read_text,
    walk_markdown,
)

OUTPUT = REPO_ROOT / "docs" / "questions.json"


def parse_zh_titles(zh_path: Path) -> dict[int, str]:
    text = read_text(zh_path)
    if text is None:
        return {}
    return {int(m.group(1)): m.group(2) for m in HEADING_RE.finditer(text)}


def parse_file(path: Path) -> list[dict]:
    entries = parse_entries_file(path)
    if not entries:
        return []
    zh_path = path.with_suffix(".zh.md")
    zh_titles = parse_zh_titles(zh_path) if zh_path.exists() else {}
    zh_rel = zh_path.relative_to(REPO_ROOT).as_posix() if zh_path.exists() else None
    rel = path.relative_to(REPO_ROOT).as_posix()
    out = []
    for e in entries:
        entry = {
            "id": f"{rel}#{e.number}",
            "number": e.number,
            "title": e.title,
            "file": rel,
            "line": e.line,
            "category": category_for(path),
            "topics": e.topics,
            "difficulty": e.difficulty,
        }
        if e.number in zh_titles:
            entry["title_zh"] = zh_titles[e.number]
        if zh_rel:
            entry["file_zh"] = zh_rel
        out.append(entry)
    return out


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
