# Tools

Small Python utilities for interview prep practice. No external dependencies — standard library only. Tested on Python 3.9+.

| Script | Purpose |
|---|---|
| [timer.py](timer.py) | Whiteboard / problem-solving countdown with phase reminders |
| [random_pick.py](random_pick.py) | Pick a random question from any of the markdown banks |
| [streak.py](streak.py) | Track your daily prep streak (writes to `~/.awesome-interview-streak.json`) |
| [build_index.py](build_index.py) | Rebuild `docs/questions.json` from all markdown files (used by the GitHub Pages picker and the daily-question workflow) |
| [run_service.py](run_service.py) | Start a local browser-based service showing modules, a markdown reader, and the random picker (default port 8099, auto-kills an existing process holding the port) |
| [install.ps1](install.ps1) | (Windows only) Install `run_service.py` as a Scheduled Task that runs at boot, restarts on failure, and adds a Windows Firewall inbound rule. Run as Administrator. |
| [translate_to_zh.py](translate_to_zh.py) | Batch-translate `*.md` to Simplified Chinese (`*.zh.md`) via the Claude API (**requires `pip install anthropic`** and `ANTHROPIC_API_KEY`) |

## Quick start

```bash
# Drill a random algorithm problem with a 25-minute timer:
python tools/random_pick.py knowledge/algorithms.md
python tools/timer.py 25

# Mark today as done:
python tools/streak.py done

# Rebuild the questions index after editing markdown:
python tools/build_index.py

# Start the local web service (auto-builds indexes, opens browser):
python tools/run_service.py --open

# (Windows) Install as a background service that starts at boot:
# Run from an *Administrator* PowerShell:
.\tools\install.ps1
```

All Python scripts accept `--help`; PowerShell uses `Get-Help .\tools\install.ps1 -Full`.

## Chinese translations

The browser pages (`docs/index.html`, `docs/reader.html`, and the local-service home page) support an EN ↔ 中文 toggle in the top-right.

For markdown content, the reader uses a **parallel-file convention**:

- Original: `interviews/companies/google.md`
- Chinese:  `interviews/companies/google.zh.md`

When the language is set to 中文, the reader serves `*.zh.md` if it exists; otherwise it falls back to the original and shows an inline "translation not available" notice. `.zh.md` files do **not** appear as separate entries in the sidebar — they're treated as variants of the original.

After adding or removing a `.zh.md` file, regenerate the index so the reader knows about it:

```bash
python tools/run_service.py   # rebuilds docs/md_files.json on start
```

See `interviews/_template.zh.md` for a working example.

### Generating translations in bulk

`translate_to_zh.py` walks the repo and generates a `.zh.md` for every original `.md` that doesn't already have one, calling the Claude API per file. Re-runnable — already-translated files are skipped.

```bash
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...

python tools/translate_to_zh.py --dry-run                       # preview what would be translated
python tools/translate_to_zh.py --pattern "interviews/companies/*.md"  # subset
python tools/translate_to_zh.py --file behavioral/star-questions.md    # one file
python tools/translate_to_zh.py --limit 3                       # cap (good for sanity-testing cost first)
python tools/translate_to_zh.py                                 # translate everything missing
python tools/translate_to_zh.py --force                         # overwrite existing .zh.md
```

Defaults: `claude-sonnet-4-6`, `--max-tokens 48000`, `effort=low`, thinking disabled (translation is non-thinking instruction-following). Each file is one API call; failures are logged and the batch continues. `docs/md_files.json` is rebuilt at the end so the reader picks up the new translations immediately.

**Always run `--dry-run` first** to see the file list and total source size, and start with `--limit 1` or `--limit 3` to gauge cost and quality before doing the full sweep. Review the generated `.zh.md` files before committing — Claude-generated translations are a starting point, not finished prose.
