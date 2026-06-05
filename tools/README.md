# Tools

Small Python utilities for interview prep practice. No external dependencies — standard library only. Tested on Python 3.9+.

| Script | Purpose |
|---|---|
| [timer.py](timer.py) | Whiteboard / problem-solving countdown with phase reminders |
| [random_pick.py](random_pick.py) | Pick a random question from any of the markdown banks |
| [streak.py](streak.py) | Track your daily prep streak (writes to `~/.awesome-interview-streak.json`) |
| [build_index.py](build_index.py) | Rebuild `docs/questions.json` from all markdown files (used by the GitHub Pages picker and the daily-question workflow) |

## Quick start

```bash
# Drill a random algorithm problem with a 25-minute timer:
python tools/random_pick.py knowledge/algorithms.md
python tools/timer.py 25

# Mark today as done:
python tools/streak.py done

# Rebuild the questions index after editing markdown:
python tools/build_index.py
```

All scripts accept `--help` for full usage.
