#!/usr/bin/env python3
"""Whiteboard-style countdown timer with phase reminders.

Usage:
    python tools/timer.py 25                # 25-minute single timer
    python tools/timer.py 45 --coding       # coding-interview phase breakdown
    python tools/timer.py 60 --system-design # system-design phase breakdown
"""
from __future__ import annotations

import argparse
import sys
import time


CODING_PHASES = [
    (0.10, "Clarify the problem, ask about constraints and edge cases."),
    (0.20, "Sketch one or two approaches out loud, pick one with justification."),
    (0.55, "Write the solution. Talk through what you're doing."),
    (0.85, "Walk through with an example. Trace variables."),
    (1.00, "State complexity (time + space). Mention what you'd improve."),
]

SYSTEM_DESIGN_PHASES = [
    (0.10, "Clarify requirements. Functional and non-functional."),
    (0.20, "Back-of-envelope: QPS, storage, bandwidth."),
    (0.35, "API design and data model."),
    (0.60, "High-level architecture. Load balancer, app, cache, DB, queue."),
    (0.85, "Deep dive on one component. Sharding, replication, consistency."),
    (1.00, "Wrap. Trade-offs. What you'd do with more time."),
]


def fmt(seconds: int) -> str:
    m, s = divmod(max(seconds, 0), 60)
    return f"{m:02d}:{s:02d}"


def run(total_seconds: int, phases: list[tuple[float, str]] | None) -> None:
    start = time.monotonic()
    upcoming = list(phases or [])
    print(f"\nTimer started: {fmt(total_seconds)}\n")
    if phases:
        print("Phases:")
        for frac, msg in phases:
            mark = int(total_seconds * frac)
            print(f"  {fmt(mark)}  {msg}")
        print()

    try:
        while True:
            elapsed = int(time.monotonic() - start)
            remaining = total_seconds - elapsed
            if remaining <= 0:
                break

            while upcoming and elapsed >= int(total_seconds * upcoming[0][0]):
                frac, msg = upcoming.pop(0)
                print(f"\n>>> [{fmt(elapsed)}] {msg}\n")

            bar_width = 30
            filled = int(bar_width * elapsed / total_seconds)
            bar = "#" * filled + "-" * (bar_width - filled)
            sys.stdout.write(f"\r[{bar}] {fmt(remaining)} remaining ")
            sys.stdout.flush()
            time.sleep(1)

        print(f"\n\n*** Time's up! ({fmt(total_seconds)}) ***\n")
        try:
            sys.stdout.write("\a")
            sys.stdout.flush()
        except Exception:
            pass
    except KeyboardInterrupt:
        elapsed = int(time.monotonic() - start)
        print(f"\n\nStopped at {fmt(elapsed)}.\n")
        sys.exit(130)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("minutes", type=float, help="Timer length in minutes (e.g. 25 or 25.5)")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--coding", action="store_true", help="Show coding-interview phase reminders")
    g.add_argument("--system-design", action="store_true", help="Show system-design phase reminders")
    args = p.parse_args()

    total = int(args.minutes * 60)
    if total < 10:
        p.error("Timer must be at least 10 seconds.")

    phases = CODING_PHASES if args.coding else SYSTEM_DESIGN_PHASES if args.system_design else None
    run(total, phases)


if __name__ == "__main__":
    main()
