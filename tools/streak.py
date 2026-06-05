#!/usr/bin/env python3
"""Track a daily interview-prep streak.

State is stored at ~/.awesome-interview-streak.json. Each "done" marks today
as completed; missing a day resets the current streak. The longest streak
is preserved.

Usage:
    python tools/streak.py done           # mark today as completed
    python tools/streak.py status         # show current + longest streak
    python tools/streak.py log            # show the last 30 days
    python tools/streak.py reset          # wipe state (asks for confirmation)
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path


STATE_FILE = Path.home() / ".awesome-interview-streak.json"


def load() -> dict:
    if not STATE_FILE.exists():
        return {"days": [], "longest": 0}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"days": [], "longest": 0}


def save(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def compute_current_streak(days: list[str]) -> int:
    if not days:
        return 0
    today = date.today()
    yesterday = today - timedelta(days=1)
    sorted_days = sorted({date.fromisoformat(d) for d in days}, reverse=True)
    if sorted_days[0] not in (today, yesterday):
        return 0
    streak, expected = 0, sorted_days[0]
    for d in sorted_days:
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        else:
            break
    return streak


def cmd_done() -> None:
    state = load()
    today = date.today().isoformat()
    days = set(state.get("days", []))
    if today in days:
        print(f"Already marked done today ({today}).")
    else:
        days.add(today)
        state["days"] = sorted(days)
        current = compute_current_streak(state["days"])
        state["longest"] = max(state.get("longest", 0), current)
        save(state)
        print(f"Marked {today} as done.")
    cmd_status()


def cmd_status() -> None:
    state = load()
    current = compute_current_streak(state.get("days", []))
    longest = max(state.get("longest", 0), current)
    total = len(state.get("days", []))
    print(f"\n  Current streak: {current} day{'s' if current != 1 else ''}")
    print(f"  Longest streak: {longest} day{'s' if longest != 1 else ''}")
    print(f"  Total days marked: {total}\n")


def cmd_log() -> None:
    state = load()
    days = set(state.get("days", []))
    today = date.today()
    lines = []
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        marker = "X" if d.isoformat() in days else "."
        if i % 7 == 6:
            lines.append("")
        lines.append(f"  {d.isoformat()}  {marker}")
    print("\nLast 30 days (X = done, . = missed):\n" + "\n".join(lines) + "\n")


def cmd_reset() -> None:
    confirm = input(f"Delete {STATE_FILE}? Type 'yes' to confirm: ").strip().lower()
    if confirm == "yes":
        STATE_FILE.unlink(missing_ok=True)
        print("Streak history cleared.")
    else:
        print("Aborted.")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("command", choices=["done", "status", "log", "reset"])
    args = p.parse_args()
    {"done": cmd_done, "status": cmd_status, "log": cmd_log, "reset": cmd_reset}[args.command]()


if __name__ == "__main__":
    main()
