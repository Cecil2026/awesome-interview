#!/usr/bin/env python3
"""Batch-translate markdown files to Simplified Chinese using Claude.

Walks the repo for *.md files and, for each one without a sibling *.zh.md,
calls the Anthropic API (Sonnet 4.6 by default) and writes the translation
next to the source. Re-runnable — files that already have a .zh.md sibling
are skipped unless --force is passed.

Usage:
    python tools/translate_to_zh.py                       # translate all missing
    python tools/translate_to_zh.py --dry-run             # list, do not call API
    python tools/translate_to_zh.py --file behavioral/star-questions.md
    python tools/translate_to_zh.py --pattern "interviews/companies/*.md"
    python tools/translate_to_zh.py --limit 3             # cap (useful for testing)
    python tools/translate_to_zh.py --force               # overwrite existing .zh.md
    python tools/translate_to_zh.py --model claude-sonnet-4-6

Requirements:
    pip install anthropic
    export ANTHROPIC_API_KEY=sk-ant-...
"""
from __future__ import annotations

import argparse
import fnmatch
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", ".github", "docs"}

DEFAULT_MODEL = "claude-sonnet-4-6"
DEFAULT_MAX_TOKENS = 48000

SYSTEM_PROMPT = """You are translating technical interview-prep markdown documentation from English to Simplified Chinese.

Translation rules:
1. Preserve ALL markdown syntax exactly: headings (##), lists (-, 1.), bold (**), italic (*), links [text](url), blockquotes (>), horizontal rules (---), tables, YAML frontmatter.
2. Do NOT translate fenced code blocks (```...```) — keep them verbatim.
3. Do NOT translate inline code (`...`) — keep verbatim.
4. Do NOT translate URLs, file paths (e.g. tools/build_index.py), command-line arguments, environment variable names, CLI flags.
5. Keep well-known English proper nouns as-is (Google, Meta, AWS, GitHub, Kubernetes, Docker, React, Redis, PostgreSQL, etc.). Translate company names that have established Chinese forms: Amazon -> 亚马逊, Alibaba -> 阿里巴巴, ByteDance -> 字节跳动, Tencent -> 腾讯, Microsoft -> 微软, Apple -> 苹果.
6. Keep technical jargon in English when there's no clean Chinese equivalent (SLO, SLA, OAuth, JWT, REST, gRPC, CRUD). Use Chinese for common technical terms (database -> 数据库, algorithm -> 算法, interview -> 面试, system design -> 系统设计).
7. Preserve the document structure 1:1 — same heading levels, same number of list items, same paragraph breaks.
8. Use natural, professional Simplified Chinese — not literal word-for-word translation.

Output ONLY the translated markdown. No preamble, no commentary, no wrapping code fence around the whole output."""


def walk_markdown() -> list[Path]:
    out = []
    for path in REPO_ROOT.rglob("*.md"):
        parts = path.relative_to(REPO_ROOT).parts
        if any(part in SKIP_DIRS for part in parts):
            continue
        if path.name.lower() == "readme.md":
            continue
        if path.name.lower().endswith(".zh.md"):
            continue
        out.append(path)
    return sorted(out)


def needs_translation(src: Path, force: bool) -> bool:
    return force or not src.with_suffix(".zh.md").exists()


def select_files(args) -> list[Path]:
    candidates = walk_markdown()
    if args.file:
        target = (REPO_ROOT / args.file).resolve()
        candidate_set = {c.resolve(): c for c in candidates}
        if target not in candidate_set:
            print(f"error: {args.file} is not a translatable .md (must exist, not be a README, not be .zh.md)", file=sys.stderr)
            return []
        return [candidate_set[target]]
    if args.pattern:
        return [c for c in candidates if fnmatch.fnmatch(c.relative_to(REPO_ROOT).as_posix(), args.pattern)]
    return candidates


def translate(client, source_text: str, model: str, max_tokens: int) -> str:
    chars = 0
    with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        thinking={"type": "disabled"},
        output_config={"effort": "low"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": source_text}],
    ) as stream:
        for text in stream.text_stream:
            chars += len(text)
            print(f"\r  ... streaming: {chars} chars", end="", flush=True)
        message = stream.get_final_message()
    print(f"\r  ... received {chars} chars" + " " * 20)

    out = "".join(b.text for b in message.content if b.type == "text").strip()
    if not out:
        raise RuntimeError(f"empty translation (stop_reason={message.stop_reason})")
    if message.stop_reason == "max_tokens":
        raise RuntimeError(f"output truncated at {max_tokens} tokens — file may be too long for one pass")
    if not out.endswith("\n"):
        out += "\n"
    return out


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--dry-run", action="store_true", help="List files that would be translated, no API calls")
    p.add_argument("--file", help="Translate one specific file (repo-relative path)")
    p.add_argument("--pattern", help="Glob pattern relative to repo root (e.g. 'interviews/companies/*.md')")
    p.add_argument("--force", action="store_true", help="Overwrite existing .zh.md files")
    p.add_argument("--limit", type=int, help="Cap the number of files translated (useful for testing)")
    p.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model ID (default: {DEFAULT_MODEL})")
    p.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS, help=f"Max output tokens per file (default: {DEFAULT_MAX_TOKENS})")
    return p.parse_args()


def rebuild_index() -> None:
    sys.path.insert(0, str(REPO_ROOT / "tools"))
    from run_service import build_md_index
    build_md_index()


def main() -> int:
    args = parse_args()

    candidates = select_files(args)
    if not candidates:
        return 1 if (args.file or args.pattern) else 0

    already = [c for c in candidates if c.with_suffix(".zh.md").exists()]
    todo = [c for c in candidates if needs_translation(c, args.force)]
    if args.limit:
        todo = todo[: args.limit]

    print(f"Found {len(candidates)} candidate .md files")
    print(f"  {len(already)} already have a .zh.md sibling{' (will overwrite)' if args.force else ' (skipping)'}")
    print(f"  {len(todo)} to translate")

    if not todo:
        print("Nothing to do.")
        return 0

    total_chars = sum(p.stat().st_size for p in todo)
    print(f"  total source size: {total_chars:,} bytes")
    print()
    for path in todo:
        rel = path.relative_to(REPO_ROOT).as_posix()
        size = path.stat().st_size
        print(f"  {rel} ({size:,} bytes)")

    if args.dry_run:
        print("\n--dry-run: skipping API calls")
        return 0

    try:
        import anthropic
    except ImportError:
        print("\nerror: 'anthropic' package not installed. Run: pip install anthropic", file=sys.stderr)
        return 2

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\nerror: ANTHROPIC_API_KEY environment variable not set", file=sys.stderr)
        return 2

    client = anthropic.Anthropic()
    print(f"\nTranslating with {args.model}... (Ctrl-C to abort; per-file failures are logged but do not stop the batch)\n")

    succeeded: list[str] = []
    failed: list[tuple[str, str]] = []

    for i, path in enumerate(todo, 1):
        rel = path.relative_to(REPO_ROOT).as_posix()
        zh_path = path.with_suffix(".zh.md")
        zh_rel = zh_path.relative_to(REPO_ROOT).as_posix()
        print(f"[{i}/{len(todo)}] {rel} -> {zh_rel}")
        try:
            source = path.read_text(encoding="utf-8")
            translated = translate(client, source, args.model, args.max_tokens)
            zh_path.write_text(translated, encoding="utf-8")
            print(f"  wrote {zh_rel} ({len(translated):,} chars)")
            succeeded.append(rel)
        except KeyboardInterrupt:
            print("\n\naborted by user")
            break
        except Exception as exc:
            print(f"  FAILED: {exc}")
            failed.append((rel, str(exc)))

    print(f"\nSummary: {len(succeeded)} succeeded, {len(failed)} failed")
    if failed:
        print("Failures:")
        for rel, err in failed:
            print(f"  {rel}: {err}")

    if succeeded:
        try:
            rebuild_index()
            print("Rebuilt docs/md_files.json")
        except Exception as exc:
            print(f"warning: failed to rebuild docs/md_files.json: {exc}")

    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
