#!/usr/bin/env python3
"""Pick a random question from one or more markdown question banks.

Markdown banks use `### N. <title>` numbered headings (the format used across
all knowledge/, interviews/, and behavioral/ files in this repo).

Usage:
    python tools/random_pick.py knowledge/algorithms.md
    python tools/random_pick.py knowledge/frontend.md knowledge/backend.md
    python tools/random_pick.py knowledge/   # picks across all .md in the dir
    python tools/random_pick.py --all        # picks across the whole repo
    python tools/random_pick.py --count 3 knowledge/
"""
from __future__ import annotations

import argparse
import random
import re
import sys
from pathlib import Path


HEADING_RE = re.compile(r"^### \d+\.\s+(.+?)\s*$", re.MULTILINE)


def gather_files(paths: list[Path]) -> list[Path]:
    out: list[Path] = []
    for p in paths:
        if p.is_file() and p.suffix == ".md":
            out.append(p)
        elif p.is_dir():
            out.extend(sorted(p.rglob("*.md")))
    return [p for p in out if p.name.lower() != "readme.md"]


def parse_questions(path: Path) -> list[tuple[str, int, int]]:
    """Return [(title, line_no, char_offset), ...] for each `### N.` heading."""
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return []
    out = []
    for m in HEADING_RE.finditer(text):
        line_no = text.count("\n", 0, m.start()) + 1
        out.append((m.group(1), line_no, m.start()))
    return out


def extract_body(path: Path, start_offset: int) -> str:
    text = path.read_text(encoding="utf-8")
    next_match = HEADING_RE.search(text, start_offset + 4)
    end = next_match.start() if next_match else len(text)
    return text[start_offset:end].rstrip()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("paths", nargs="*", help="Files or directories to pick from")
    p.add_argument("--all", action="store_true", help="Pick from every .md in the current dir tree")
    p.add_argument("--count", type=int, default=1, help="Number of questions to pick (default 1)")
    p.add_argument("--titles-only", action="store_true", help="Print titles + locations, not full body")
    p.add_argument("--seed", type=int, help="Seed for reproducible picks")
    args = p.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    if args.all:
        roots = [Path(".")]
    elif args.paths:
        roots = [Path(s) for s in args.paths]
    else:
        p.error("Provide a path, or pass --all to scan the current directory.")

    files = gather_files(roots)
    if not files:
        sys.exit("No .md files found at the given paths.")

    pool: list[tuple[Path, str, int, int]] = []
    for f in files:
        for title, line, offset in parse_questions(f):
            pool.append((f, title, line, offset))

    if not pool:
        sys.exit("No `### N.` headings found in the selected files.")

    n = min(args.count, len(pool))
    picks = random.sample(pool, n)

    for i, (path, title, line, offset) in enumerate(picks):
        location = f"{path.as_posix()}:{line}"
        if args.titles_only:
            print(f"{i + 1}. {title}  ({location})")
        else:
            print(f"\n=== Pick {i + 1}/{n}: {title} ===")
            print(f"Source: {location}\n")
            print(extract_body(path, offset))
            print()


if __name__ == "__main__":
    main()
