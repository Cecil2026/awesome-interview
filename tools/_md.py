#!/usr/bin/env python3
"""Shared markdown parsing helpers for the tools scripts.

This module centralizes the regexes and file-walking logic used by
``build_index.py``, ``daily_plan.py`` and ``validate.py`` so the question
schema is defined in exactly one place.

Nothing here has external dependencies — standard library only.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# --- Entry schema regexes (the single source of truth) ---------------------
HEADING_RE = re.compile(r"^### (\d+)\.\s+(.+?)\s*$", re.MULTILINE)
TOPICS_RE = re.compile(r"^\*\*Topics:\*\*\s*(.+?)\s*$", re.MULTILINE)
DIFFICULTY_RE = re.compile(r"^\*\*Difficulty:\*\*\s*(.+?)\s*$", re.MULTILINE)
TAGS_RE = re.compile(r"^\*\*Tags:\*\*\s*(.+?)\s*$", re.MULTILINE)
COMPLEXITY_RE = re.compile(r"^\*\*Complexity:\*\*\s*(.+?)\s*$", re.MULTILINE)
FOLLOWUPS_RE = re.compile(r"^\*\*Follow-ups:\*\*\s*$", re.MULTILINE)

# Chinese mirror markers (used when validating .zh.md files)
HEADING_ZH_RE = HEADING_RE  # zh files keep the same "### N. title" heading
TAGS_ZH_RE = re.compile(r"^\*\*\u6807\u7b7e\uff1a\*\*\s*(.+?)\s*$", re.MULTILINE)
FOLLOWUPS_ZH_RE = re.compile(r"^\*\*\u5e38\u89c1\u8ffd\u95ee\uff1a\*\*\s*$", re.MULTILINE)
COMPLEXITY_ZH_RE = re.compile(r"^\*\*\u590d\u6742\u5ea6\uff1a\*\*\s*(.+?)\s*$", re.MULTILINE)

# Markdown inline link: [text](target)
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")

SKIP_DIRS = {".git", "node_modules", ".github", "docs"}


@dataclass
class Entry:
    """One ``### N. Title`` question block parsed from a markdown file."""

    number: int
    title: str
    body: str
    line: int
    topics: list[str] = field(default_factory=list)
    difficulty: str | None = None
    tags: str | None = None

    @property
    def has_tags(self) -> bool:
        return self.tags is not None

    @property
    def has_complexity(self) -> bool:
        return bool(COMPLEXITY_RE.search(self.body) or COMPLEXITY_ZH_RE.search(self.body))

    @property
    def has_followups(self) -> bool:
        return bool(FOLLOWUPS_RE.search(self.body) or FOLLOWUPS_ZH_RE.search(self.body))


def category_for(path: Path) -> str:
    parts = path.relative_to(REPO_ROOT).parts
    if not parts:
        return "misc"
    return parts[0]


def is_zh(path: Path) -> bool:
    return path.name.lower().endswith(".zh.md")


def parse_entries(text: str) -> list[Entry]:
    """Parse all ``### N. Title`` blocks out of markdown text."""
    matches = list(HEADING_RE.finditer(text))
    entries: list[Entry] = []
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end]
        topics_match = TOPICS_RE.search(body)
        difficulty_match = DIFFICULTY_RE.search(body)
        tags_match = TAGS_RE.search(body) or TAGS_ZH_RE.search(body)
        line = text.count("\n", 0, m.start()) + 1
        entries.append(
            Entry(
                number=int(m.group(1)),
                title=m.group(2),
                body=body,
                line=line,
                topics=[t.strip() for t in topics_match.group(1).split(",")] if topics_match else [],
                difficulty=difficulty_match.group(1) if difficulty_match else None,
                tags=tags_match.group(1) if tags_match else None,
            )
        )
    return entries


def read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return None


def parse_file(path: Path) -> list[Entry]:
    text = read_text(path)
    if text is None:
        return []
    return parse_entries(text)


def walk_markdown(*, include_zh: bool = False, include_readme: bool = False) -> list[Path]:
    """Return sorted markdown files under the repo, skipping infra dirs."""
    out: list[Path] = []
    for path in REPO_ROOT.rglob("*.md"):
        rel_parts = path.relative_to(REPO_ROOT).parts
        if any(part in SKIP_DIRS for part in rel_parts):
            continue
        if not include_readme and path.name.lower() == "readme.md":
            continue
        if not include_zh and is_zh(path):
            continue
        out.append(path)
    return sorted(out)
