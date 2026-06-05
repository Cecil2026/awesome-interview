# awesome-interview

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Daily question](https://img.shields.io/badge/daily-question-blue.svg)](.github/workflows/daily-question.yml)
[![Pages](https://img.shields.io/badge/random-picker-blueviolet.svg)](docs/index.html)

A curated, opinionated interview-prep workspace. Algorithm drills, framework deep dives, system design, behavioral STAR scaffolds, real-company question banks, week-by-week roadmaps, and a couple of scripts to keep you honest about practicing.

> If you only have ten minutes today, run `python tools/random_pick.py knowledge/` and answer whatever comes out.

## What's in here

| Section | What it is | Count |
|---|---|---|
| [knowledge/](knowledge/) | Topic-organized Q&A banks (algorithms in Py+TS, frontend, backend, architecture, devops) | 500 |
| [interviews/](interviews/) | Real, publicly known interview questions by company (Google, Meta, Amazon, Microsoft, Apple, ByteDance, Alibaba, Tencent) | 160 |
| [mock-interviews/](mock-interviews/) | Full transcript-style mock interviews — system design and behavioral | 5 |
| [roadmap/](roadmap/) | 8-10 week study plans for frontend, backend, fullstack + a universal week-of checklist | 4 |
| [behavioral/](behavioral/) | 50 STAR questions across 8 themes + the 16 Amazon Leadership Principles | 66 |
| [tools/](tools/) | Timer, random picker, streak tracker, index builder (stdlib Python only) | 4 |
| [docs/](docs/) | GitHub Pages site — random question picker with filters | 1 |

Every Q&A entry uses the same `### N. Question` heading format, so the picker and the daily-question workflow can drill into any file uniformly.

## Quick start

```bash
git clone https://github.com/<you>/awesome-interview.git
cd awesome-interview

# Pick a random question:
python tools/random_pick.py knowledge/

# Start the local web service for module browsing, markdown reading, and the question picker:
python tools/run_service.py

# Open the friendly markdown reader in your browser:
http://127.0.0.1:8000/docs/reader.html

# Drill it with a 25-minute coding-phase timer:
python tools/timer.py 25 --coding

# Mark today as done:
python tools/streak.py done
```

## Local web service

`tools/run_service.py` starts a small browser-based service so you can read, browse, and drill questions without leaving the terminal.

```bash
python tools/run_service.py                # serves on http://127.0.0.1:8000
python tools/run_service.py --port 9000    # custom port
python tools/run_service.py --open         # open the reader in your default browser
python tools/run_service.py --no-build     # skip regenerating questions.json / md_files.json
```

It serves three pages:

| URL | Page | What you get |
|---|---|---|
| `/` | Module home | Card grid linking to every section of the repo |
| `/docs/reader.html` | Markdown reader | Browse and read all `*.md` files in a clean HTML view with sidebar + TOC |
| `/docs/index.html` | Question picker | Filter by category / difficulty / topic and pull a random question |

On first run it generates `docs/questions.json` (via `tools/build_index.py`) and `docs/md_files.json` so the picker and reader have content to render. Pass `--no-build` to skip that step.

### Language switching (EN ↔ 中文)

All three pages have an EN / 简体中文 toggle in the top-right. The choice is stored in `localStorage` and persists across pages and reloads.

### Translating markdown content

The reader supports a parallel-file convention for translated content:

- Original: `interviews/companies/google.md`
- Chinese:  `interviews/companies/google.zh.md`

When the language is set to 中文, the reader serves `*.zh.md` if it exists; otherwise it falls back to the original and shows a "translation not available" notice. `.zh.md` files don't appear as separate entries in the sidebar — they're treated as variants of the original. Restart `run_service.py` after adding or removing one to refresh `docs/md_files.json`. See `interviews/_template.zh.md` for a working example.

To generate translations in bulk via the Claude API, use [`tools/translate_to_zh.py`](tools/translate_to_zh.py) (requires `pip install anthropic` and `ANTHROPIC_API_KEY`). Run with `--dry-run` first to preview what would be translated. See [tools/README.md](tools/README.md#generating-translations-in-bulk) for full usage.

## How to use this repo

**Daily** — let the [daily-question workflow](.github/workflows/daily-question.yml) open a fresh GitHub issue every morning; answer it in the issue thread.

**Weekly** — pick a roadmap (e.g. [backend-engineer.md](roadmap/backend-engineer.md)) and check off the week's items as you go. Mock yourself with a [mock-interviews/](mock-interviews/) transcript on the weekend.

**Targeted prep** — interviewing at a specific company? Read its file under [interviews/companies/](interviews/companies/). It calls out the format, the focus areas, and 20 real questions per company.

**Cramming** — open the [random picker](docs/index.html) (deploy via GitHub Pages from `docs/`), filter by difficulty and topic, and drill until your timer goes off.

## Entry format

Every question follows the same shape so it can be parsed, picked, and indexed:

```
### N. <Question title>

**Difficulty:** Easy | Medium | Hard   (optional)
**Topics:** comma, separated, tags    (optional)

**Question:** ...

**Answer:** Concise prose (3-10 lines).

**Key points:**
- bullet
- bullet
```

Algorithm entries additionally include `**Python:**` and `**TypeScript:**` code blocks. Company-interview entries add `**Position:**` and `**Years:**` fields.

## Contributing

Add or correct anything you like. The numbering inside each file is a guide, not a contract — renumber freely.

1. Add or edit a `### N. Question` entry.
2. Run `python tools/build_index.py` to refresh `docs/questions.json`.
3. Commit both files. CI will block the PR if you forget to refresh the index.

## License

MIT. See [LICENSE](LICENSE).
