#!/usr/bin/env python3
"""Spaced-repetition review scheduler for the question bank (SM-2).

Records how well you recalled each question and schedules the next review using
the classic SM-2 algorithm. State is stored alongside the streak data in
``~/.awesome-interview-streak.json`` under a ``reviews`` key, so it coexists
with ``streak.py`` without clobbering your streak history.

Questions are referenced by their index id (``file#number``); a short suffix
such as ``google.md#3`` is accepted and resolved against ``docs/questions.json``.

Usage:
    python tools/review.py grade google.md#3 --quality 5   # record a recall (0-5)
    python tools/review.py due                             # questions due today
    python tools/review.py due --lang zh --output today.md # export a review plan
    python tools/review.py stats                           # coverage + mastery
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

from daily_plan import (
    classify_kind,
    load_index,
    render_question,
)

STATE_FILE = Path.home() / ".awesome-interview-streak.json"

DEFAULT_EASE = 2.5
MIN_EASE = 1.3


# --- state -----------------------------------------------------------------
def load_state() -> dict:
    if not STATE_FILE.exists():
        return {"days": [], "longest": 0, "reviews": {}}
    try:
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"days": [], "longest": 0, "reviews": {}}
    state.setdefault("reviews", {})
    return state


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


# --- SM-2 ------------------------------------------------------------------
def sm2(card: dict | None, quality: int, today: date) -> dict:
    """Return the updated card after a recall graded ``quality`` (0-5)."""
    ease = (card or {}).get("ease", DEFAULT_EASE)
    reps = (card or {}).get("reps", 0)
    interval = (card or {}).get("interval", 0)
    history = list((card or {}).get("grade_history", []))

    if quality < 3:
        reps = 0
        interval = 1
    else:
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            interval = round(interval * ease)
        reps += 1

    ease = max(MIN_EASE, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    history.append(quality)

    return {
        "ease": round(ease, 3),
        "reps": reps,
        "interval": interval,
        "due": (today + timedelta(days=interval)).isoformat(),
        "last": today.isoformat(),
        "grade_history": history,
    }


# --- id resolution ---------------------------------------------------------
def build_id_map(pool: list[dict]) -> dict[str, dict]:
    return {q["id"]: q for q in pool}


def resolve_id(raw: str, id_map: dict[str, dict]) -> str | None:
    """Resolve a user-typed id (possibly a suffix) to a full index id."""
    if raw in id_map:
        return raw
    matches = [qid for qid in id_map if qid.endswith(raw) or qid.split("/")[-1] == raw]
    if len(matches) == 1:
        return matches[0]
    return None


# --- commands --------------------------------------------------------------
def cmd_grade(args) -> None:
    if not 0 <= args.quality <= 5:
        sys.exit("--quality must be between 0 and 5.")
    pool = load_index()
    id_map = build_id_map(pool)
    qid = resolve_id(args.id, id_map)
    if qid is None:
        sys.exit(
            f"Could not resolve '{args.id}' to a single question. "
            f"Use the full id like 'interviews/companies/google.md#3'."
        )
    state = load_state()
    today = date.today()
    card = state["reviews"].get(qid)
    state["reviews"][qid] = sm2(card, args.quality, today)
    save_state(state)
    nxt = state["reviews"][qid]
    print(
        f"Graded {qid} = {args.quality}. "
        f"Next review in {nxt['interval']} day(s) on {nxt['due']} "
        f"(ease {nxt['ease']}, reps {nxt['reps']})."
    )


def due_ids(state: dict, today: date) -> list[str]:
    out = []
    for qid, card in state.get("reviews", {}).items():
        if card.get("due", "9999-12-31") <= today.isoformat():
            out.append(qid)
    return out


def cmd_due(args) -> None:
    pool = load_index()
    id_map = build_id_map(pool)
    state = load_state()
    today = date.today()
    ids = due_ids(state, today)
    # earliest due first
    ids.sort(key=lambda q: state["reviews"][q].get("due", ""))
    picks = [id_map[q] for q in ids if q in id_map]

    if not picks:
        msg = "No questions are due for review today. Grade some with `review.py grade`."
        if args.output:
            Path(args.output).expanduser().write_text(f"# Review — {today}\n\n{msg}\n", encoding="utf-8")
            print(f"Wrote review plan to {args.output}")
        else:
            print(msg)
        return

    header = "# 复习计划" if args.lang == "zh" else "# Review Plan"
    parts = [f"{header} — {today}", "", f"**{len(picks)}** due.", ""]
    for i, q in enumerate(picks, 1):
        parts.append(render_question(q, i, args.lang))
    body = "\n".join(parts)

    if args.output:
        out_path = Path(args.output).expanduser()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(body, encoding="utf-8")
        print(f"Wrote review plan ({len(picks)} questions) to {out_path}")
    else:
        try:
            sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except (AttributeError, OSError):
            pass
        sys.stdout.write(body)


def cmd_stats(args) -> None:
    pool = load_index()
    state = load_state()
    reviews = state.get("reviews", {})
    total = len(pool)
    tracked = len(reviews)
    today = date.today()
    due = len(due_ids(state, today))

    # mastery buckets by interval
    learning = sum(1 for c in reviews.values() if c.get("interval", 0) < 7)
    young = sum(1 for c in reviews.values() if 7 <= c.get("interval", 0) < 30)
    mature = sum(1 for c in reviews.values() if c.get("interval", 0) >= 30)

    # coverage per category
    id_map = build_id_map(pool)
    per_cat: dict[str, list[int]] = {}
    for q in pool:
        per_cat.setdefault(q["category"], [0, 0])
        per_cat[q["category"]][1] += 1
    for qid in reviews:
        q = id_map.get(qid)
        if q:
            per_cat.setdefault(q["category"], [0, 0])
            per_cat[q["category"]][0] += 1

    print(f"\n  Question bank: {total} questions")
    pct = (tracked / total * 100) if total else 0
    print(f"  Tracked:       {tracked} ({pct:.1f}% coverage)")
    print(f"  Due today:     {due}")
    print(f"  Learning (<7d): {learning}   Young (7-30d): {young}   Mature (>=30d): {mature}\n")
    print("  Coverage by category:")
    for cat in sorted(per_cat):
        done, tot = per_cat[cat]
        bar_len = round(done / tot * 20) if tot else 0
        bar = "#" * bar_len + "." * (20 - bar_len)
        print(f"    {cat:<16} {bar} {done}/{tot}")
    print()


def main(argv=None) -> None:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = p.add_subparsers(dest="command", required=True)

    g = sub.add_parser("grade", help="Record a recall quality (0-5) for a question")
    g.add_argument("id", help="Question id or suffix, e.g. 'google.md#3'")
    g.add_argument("--quality", type=int, required=True, help="Recall quality 0 (blank) - 5 (perfect)")
    g.set_defaults(func=cmd_grade)

    d = sub.add_parser("due", help="List questions due for review today")
    d.add_argument("--lang", choices=("en", "zh"), default="en")
    d.add_argument("--output", help="Write the review plan to this file instead of stdout")
    d.set_defaults(func=cmd_due)

    s = sub.add_parser("stats", help="Show coverage and mastery breakdown")
    s.set_defaults(func=cmd_stats)

    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
