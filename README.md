# awesome-interview

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Daily question](https://img.shields.io/badge/daily-question-blue.svg)](.github/workflows/daily-question.yml)
[![Pages](https://img.shields.io/badge/random-picker-blueviolet.svg)](docs/index.html)

A curated, opinionated interview-prep workspace. Algorithm drills with Python/TypeScript/Java solutions, framework deep dives, system design, AI/ML, behavioral STAR scaffolds, real-company question banks, week-by-week roadmaps, and a couple of scripts to keep you honest about practicing. Every page supports EN ↔ 中文 and light/dark theme.

> If you only have ten minutes today, run `python tools/random_pick.py knowledge/` and answer whatever comes out.

## What's in here

| Section | What it is | Count |
|---|---|---|
| [knowledge/](knowledge/) | Topic-organized Q&A banks (algorithms in Py+TS+Java, AI/ML, frontend, backend, architecture, devops) | 600 |
| [interviews/](interviews/) | Real, publicly known interview questions by company (Google, Meta, Amazon, Microsoft, Apple, ByteDance, Alibaba, Tencent) — ~50 algorithm + ~12 non-algorithm per company | 500 |
| [mock-interviews/](mock-interviews/) | Full transcript-style mock interviews — system design and behavioral | 6 |
| [roadmap/](roadmap/) | 8-10 week study plans for frontend, backend, fullstack + a universal week-of checklist | 4 |
| [behavioral/](behavioral/) | 50 STAR questions across 8 themes + the 16 Amazon Leadership Principles | 66 |
| [tools/](tools/) | Timer, random picker, streak tracker, index builder, local installer, translator (stdlib Python + one PowerShell) | 7 |
| [docs/](docs/) | Static site — random question picker + markdown reader with tab-switchable code samples | 1 |

Every Q&A entry uses the same `### N. Question` heading format, so the picker and the daily-question workflow can drill into any file uniformly. Algorithm questions ship with Python, TypeScript, and Java implementations; the reader renders them as switchable tabs.

## Quick start

```bash
git clone https://github.com/<you>/awesome-interview.git
cd awesome-interview

# Pick a random question:
python tools/random_pick.py knowledge/

# Start the local web service for module browsing, markdown reading, and the question picker:
python tools/run_service.py --open

# Open the friendly markdown reader in your browser:
http://127.0.0.1:8099/docs/reader.html

# Drill it with a 25-minute coding-phase timer:
python tools/timer.py 25 --coding

# Mark today as done:
python tools/streak.py done
```

## Local web service

`tools/run_service.py` starts a small browser-based service so you can read, browse, and drill questions without leaving the terminal.

```bash
python tools/run_service.py                # serves on http://127.0.0.1:8099
python tools/run_service.py --port 9000    # custom port
python tools/run_service.py --open         # open the reader in your default browser
python tools/run_service.py --no-build     # skip regenerating questions.json / md_files.json
python tools/run_service.py --no-kill      # don't auto-kill an existing process holding the port
```

By default the service auto-detects an existing process on the same port (via `netstat`/`lsof`) and kills it before binding, so re-running the command Just Works. Pass `--no-kill` to opt out.

It serves three pages:

| URL | Page | What you get |
|---|---|---|
| `/` | Module home | Card grid linking to every section of the repo |
| `/docs/reader.html` | Markdown reader | Browse and read all `*.md` files in a clean HTML view with sidebar + TOC |
| `/docs/index.html` | Question picker | Filter by category / difficulty / topic and pull a random question |

On first run it generates `docs/questions.json` (via `tools/build_index.py`) and `docs/md_files.json` so the picker and reader have content to render. Pass `--no-build` to skip that step.

### Language switching (EN ↔ 中文) and theme (Light / Dark)

All three pages have an EN / 简体中文 toggle and a Light / Dark theme toggle in the top-right. Both choices are stored in `localStorage` and persist across pages and reloads. The theme defaults to your OS preference (`prefers-color-scheme`) on first visit.

### Run as a service on Windows (autostart at boot)

[`tools/install.ps1`](tools/install.ps1) registers a Scheduled Task on the local Windows machine that runs `run_service.py` at boot, restarts on failure, and adds a Windows Firewall inbound rule for the port.

```powershell
# Open PowerShell as Administrator, then:
cd C:\path\to\awesome-interview

.\tools\install.ps1                   # install on default port 8099
.\tools\install.ps1 -Port 9000        # custom port
.\tools\install.ps1 -Status           # task + port + firewall status
.\tools\install.ps1 -Restart          # restart after editing markdown/code
.\tools\install.ps1 -Uninstall        # stop + unregister + remove firewall rule
```

After install, the service is reachable at `http://localhost:8099/` and `http://<your-lan-ip>:8099/` (the script prints both URLs).

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

Algorithm entries additionally include `**Python:**`, `**TypeScript:**`, and `**Java:**` code blocks. The markdown reader renders consecutive `**Lang:**` + fenced-code pairs as switchable tabs, with the chosen language remembered in `localStorage` and applied across all questions. Company-interview entries add `**Position:**` and `**Years:**` fields.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. The short version:

Add or correct anything you like. The numbering inside each file is a guide, not a contract — renumber freely.

1. Add or edit a `### N. Question` entry.
2. Run `python tools/build_index.py` to refresh `docs/questions.json`.
3. Run `python tools/validate.py` and resolve anything it reports.
4. Commit both files. CI will block the PR if you forget to refresh the index.

## License

MIT. See [LICENSE](LICENSE).
