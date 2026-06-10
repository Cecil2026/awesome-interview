#!/usr/bin/env python3
"""Validate the question bank against the repo's entry schema.

Catches the kinds of mistakes that are easy to make by hand: a missing
``.zh.md`` translation, an EN/ZH question-count mismatch, a numbering gap, a
question with no ``**Tags:**`` line, a stale ``docs/questions.json``, and
broken internal markdown links.

Levels:
    ERROR  -> always fails the run (exit code 1)
    WARN   -> informational unless ``--strict`` is passed

Usage:
    python tools/validate.py                 # report ERRORs (exit 1 if any)
    python tools/validate.py --strict        # WARNs also fail (use in CI)
    python tools/validate.py --only links    # run a single check group
    python tools/validate.py --json          # machine-readable output
"""
from __future__ import annotations

import argparse
import json
import sys

from _md import (
    REPO_ROOT,
    LINK_RE,
    Entry,
    is_zh,
    parse_entries,
    parse_file,
    read_text,
    walk_markdown,
)

# The structured ``**Tags:**`` / ``**Topics:**`` / ``**Complexity:**`` convention
# is specific to the company question banks. Other banks (knowledge, behavioral,
# mock-interviews) use a different, prose-oriented layout and are not held to it.
COMPANY_PREFIX = "interviews/companies/"
# Top-N company questions expected to have Follow-ups (matches the curation goal).
COMPANY_TOPN_FOLLOWUPS = 10

CHECK_GROUPS = ("bilingual", "numbering", "tags", "complexity", "followups", "links", "index")


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    def extend(self, other: "Report") -> None:
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)


def rel(path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def is_template(path) -> bool:
    """Scaffolding files (``_template.md`` etc.) are excluded from content checks."""
    return path.name.startswith("_")


def is_company(path) -> bool:
    return rel(path).startswith(COMPANY_PREFIX)


def check_numbering(path, entries: list[Entry], report: Report) -> None:
    numbers = [e.number for e in entries]
    seen: set[int] = set()
    for n in numbers:
        if n in seen:
            report.error(f"{rel(path)}: duplicate question number {n}")
        seen.add(n)
    expected = list(range(1, len(numbers) + 1))
    if sorted(numbers) != expected and numbers:
        report.error(
            f"{rel(path)}: numbering is not contiguous 1..{len(numbers)} "
            f"(got {sorted(numbers)})"
        )


def check_tags(path, entries: list[Entry], report: Report) -> None:
    # ``**Tags:**`` is only a convention in the company question banks.
    if not is_company(path):
        return
    for e in entries:
        if not e.has_tags:
            report.error(f"{rel(path)}#{e.number} ({e.title!r}): missing **Tags:** line")


def check_complexity(path, entries: list[Entry], report: Report) -> None:
    if not is_company(path):
        return
    for e in entries:
        tags = (e.tags or "").lower()
        if "#algorithm" not in tags and "#coding" not in tags:
            continue
        # Accept either a structured **Complexity:** line or an inline big-O note.
        if not e.has_complexity and "o(" not in e.body.lower():
            report.error(
                f"{rel(path)}#{e.number} ({e.title!r}): algorithm entry has no complexity note"
            )


def check_followups(path, entries: list[Entry], report: Report) -> None:
    if not rel(path).startswith("interviews/companies/"):
        return
    for e in entries:
        if e.number <= COMPANY_TOPN_FOLLOWUPS and not e.has_followups:
            report.warn(
                f"{rel(path)}#{e.number} ({e.title!r}): top-{COMPANY_TOPN_FOLLOWUPS} "
                f"company question has no **Follow-ups:**"
            )


def check_links(path, text: str, report: Report) -> None:
    base = path.parent
    for m in LINK_RE.finditer(text):
        target = m.group(1).strip()
        if target.startswith(("http://", "https://", "mailto:", "#")):
            continue
        # strip any anchor / line fragment
        file_part = target.split("#", 1)[0]
        if not file_part:
            continue
        candidate = (base / file_part).resolve()
        if not candidate.exists():
            report.warn(f"{rel(path)}: broken internal link -> {target}")


def check_bilingual(report: Report) -> None:
    for path in walk_markdown(include_zh=False):
        if is_template(path):
            continue
        zh = path.with_suffix(".zh.md")
        if not zh.exists():
            report.warn(f"{rel(path)}: no Chinese mirror ({zh.name}) found")
            continue
        en_entries = parse_file(path)
        zh_entries = parse_file(zh)
        if len(en_entries) != len(zh_entries):
            report.error(
                f"{rel(path)}: EN has {len(en_entries)} questions but "
                f"{zh.name} has {len(zh_entries)} (must match)"
            )


def check_index(report: Report) -> None:
    """Fail if docs/questions.json is stale relative to the markdown sources."""
    import build_index

    data = build_index.build()
    new = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    out = build_index.OUTPUT
    if not out.exists():
        report.error("docs/questions.json does not exist; run python tools/build_index.py")
        return
    if out.read_text(encoding="utf-8") != new:
        report.error(
            "docs/questions.json is stale; run python tools/build_index.py and commit the result"
        )


def run(only: str | None) -> Report:
    report = Report()
    groups = (only,) if only else CHECK_GROUPS

    per_file_groups = {"numbering", "tags", "complexity", "followups", "links"}
    if per_file_groups & set(groups):
        for path in walk_markdown(include_zh=True):
            text = read_text(path)
            if text is None:
                continue
            entries = parse_entries(text)
            if "links" in groups:
                check_links(path, text, report)
            # entry-level checks apply to source files; skip scaffolding templates
            # and Chinese mirrors (mirror counts are checked in `bilingual`).
            if not entries or is_template(path) or is_zh(path):
                continue
            if "numbering" in groups:
                check_numbering(path, entries, report)
            if "tags" in groups:
                check_tags(path, entries, report)
            if "complexity" in groups:
                check_complexity(path, entries, report)
            if "followups" in groups:
                check_followups(path, entries, report)

    if "bilingual" in groups:
        check_bilingual(report)
    if "index" in groups:
        check_index(report)
    return report


def main() -> None:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    p.add_argument("--strict", action="store_true", help="Treat warnings as failures")
    p.add_argument("--only", choices=CHECK_GROUPS, help="Run only one check group")
    p.add_argument("--json", action="store_true", help="Emit a JSON report")
    args = p.parse_args()

    report = run(args.only)

    if args.json:
        print(
            json.dumps(
                {"errors": report.errors, "warnings": report.warnings},
                indent=2,
                ensure_ascii=False,
            )
        )
    else:
        for w in report.warnings:
            print(f"WARN  {w}")
        for e in report.errors:
            print(f"ERROR {e}")
        print(
            f"\n{len(report.errors)} error(s), {len(report.warnings)} warning(s)."
        )

    failed = bool(report.errors) or (args.strict and bool(report.warnings))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
