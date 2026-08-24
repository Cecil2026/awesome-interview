#!/usr/bin/env python3
"""Assemble the ``www/`` directory that Capacitor packages into the Android APK.

The web app is a fully static site: ``docs/`` holds the HTML/JS/JSON and the
Markdown content lives in sibling directories (``knowledge/``, ``interviews/``,
etc.). The reader fetches Markdown with absolute paths (e.g. ``/knowledge/x.md``),
so the packaged web root must mirror the repository root layout:

    www/
      index.html        (redirect -> docs/index.html)
      docs/...           (copied wholesale)
      knowledge/...      (only the files referenced by docs/md_files.json)
      interviews/... etc.

Capacitor serves ``www/`` over ``https://localhost/`` on device, which is what
lets the absolute-path ``fetch`` calls work (a plain ``file://`` WebView would
block them). Run this before ``npx cap sync``.

Usage:
    python tools/build_www.py
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = REPO_ROOT / "docs"
WWW_DIR = REPO_ROOT / "www"

REDIRECT_INDEX = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Awesome Interview</title>
  <script>location.replace('docs/index.html');</script>
  <meta http-equiv="refresh" content="0; url=docs/index.html" />
</head>
<body>Loading…</body>
</html>
"""


def _referenced_md_paths() -> set[str]:
    """Every repo-relative Markdown path the reader can load, from md_files.json."""
    index_path = DOCS_DIR / "md_files.json"
    if not index_path.exists():
        sys.exit(
            "docs/md_files.json not found. Run the local service once "
            "(python tools/run_service.py) to generate it, then retry."
        )
    data = json.loads(index_path.read_text(encoding="utf-8"))
    entries = data["files"] if isinstance(data, dict) else data
    paths: set[str] = set()
    for entry in entries:
        file = entry.get("file")
        if file:
            paths.add(file)
        for tr in (entry.get("translations") or {}).values():
            if tr:
                paths.add(tr)
    return paths


def _copy_file(rel: str) -> bool:
    src = REPO_ROOT / rel
    if not src.exists():
        print(f"  ! skip (missing): {rel}")
        return False
    dst = WWW_DIR / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    return True


def main() -> None:
    if WWW_DIR.exists():
        shutil.rmtree(WWW_DIR)
    WWW_DIR.mkdir(parents=True)

    # 1. docs/ wholesale (HTML, JS, CSS, the *.json data files).
    shutil.copytree(DOCS_DIR, WWW_DIR / "docs")
    print(f"Copied docs/ -> www/docs/")

    # 2. Every Markdown file the reader references, mirroring repo structure.
    md_paths = sorted(_referenced_md_paths())
    copied = sum(_copy_file(rel) for rel in md_paths)
    print(f"Copied {copied}/{len(md_paths)} referenced Markdown files")

    # 3. Root-level docs the start page links to but which may sit outside the index.
    for extra in ("README.md", "SECURITY.md", "SECURITY.zh.md",
                  "CONTRIBUTING.md", "CONTRIBUTING.zh.md", "tools/README.md"):
        if (REPO_ROOT / extra).exists() and not (WWW_DIR / extra).exists():
            _copy_file(extra)

    # 4. Entry point: root redirect into the Start page.
    (WWW_DIR / "index.html").write_text(REDIRECT_INDEX, encoding="utf-8")
    print("Wrote www/index.html (redirect -> docs/index.html)")

    print(f"\nDone. www/ is ready. Next: npx cap sync android")


if __name__ == "__main__":
    main()
