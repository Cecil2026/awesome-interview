# Contributing to awesome-interview

Thanks for helping make this a better interview-prep resource. Corrections, new
questions, better answers, new mock transcripts, and translations are all welcome.

This repo is plain Markdown plus a handful of stdlib-only Python scripts. There is
nothing to install — if you have Python 3 on your PATH, you can run everything.

## Ways to contribute

- **Fix or improve an answer** — clarity, correctness, an extra trade-off, a better example.
- **Add a question** — to a `knowledge/` topic bank, a company file, or behavioral set.
- **Add a mock interview** — a full transcript with a debrief (see below).
- **Translate** — fill in or improve a `*.zh.md` mirror.
- **Tooling** — improve a script in `tools/` (keep it stdlib-only).

## Repository conventions

### Entry schema

Every Q&A entry uses the same heading so the picker, the daily-question workflow,
and the validator can drill into any file uniformly:

```markdown
### N. Question title

**Answer:** ...prose...

**Key points:**
- bullet
- bullet
```

- The number `N` is a guide, not a contract — renumber freely, but keep entries
  **contiguous** (1, 2, 3, ...) with no duplicates within a file.
- `knowledge/`, `behavioral/`, and `mock-interviews/` use the prose layout above.
- **Company files** (`interviews/companies/*.md`) additionally use structured
  metadata lines, including `**Tags:** #algorithm | #coding | #system-design`.
  Algorithm/coding entries should include complexity (a `**Complexity:**` line or
  an inline `O(...)` in the answer). The validator enforces this for company files.
- Algorithm questions ship with **Python, TypeScript, and Java** implementations.
  The reader renders consecutive language blocks as switchable tabs, so label them
  `**Python:**`, `**TypeScript:**`, `**Java:**` on their own line before each block.

### Bilingual mirrors

Localized content lives in a parallel `*.zh.md` file aligned to the English file
**by entry number**. If you add `### 7.` to `knowledge/backend.md`, add the matching
`### 7.` to `knowledge/backend.zh.md`. The validator warns on count mismatches.

### Mock interviews

Mock transcripts are meant to be read top-to-bottom. Each one includes:

- A **Setup** section (scenario + who's interviewing whom).
- The full **Transcript** with bolded `**INTERVIEWER:**` / `**CANDIDATE:**` labels
  and italicized stage directions.
- A debrief: **What went well**, **What could've been stronger**, **Key takeaways**.
- For system design rounds, a **Reference architecture** ASCII diagram.

Keep turns short (1-4 sentences typical), anonymize anyone real, and include at
least one moment where the candidate is pushed back on and has to adjust.

## Before you open a PR

1. Add or edit your `### N. Question` entry (and its `*.zh.md` mirror if applicable).
2. Refresh the search index:
   ```bash
   python tools/build_index.py
   ```
3. Run the validator and fix anything it reports:
   ```bash
   python tools/validate.py          # report problems
   python tools/validate.py --strict # treat warnings as errors (what CI-adjacent checks expect)
   ```
4. Commit **both** your Markdown change and the refreshed `docs/questions.json`.
   CI will block the PR if the index is stale.

The validator checks numbering, bilingual parity, company-file tags/complexity,
internal links, and index freshness. CI runs it automatically on every push and PR.

## Style notes

- Be concrete. Prefer a sharp trade-off or a small worked example over hand-waving.
- Keep answers honest about when an approach is wrong or a worse fit — the nuance
  is the value.
- No proprietary or confidential material. Only publicly known interview questions.
- US English in `*.md`, 简体中文 in `*.zh.md`.

## Code of conduct

Be respectful and constructive. Assume good faith, keep feedback about the content,
and help newcomers. Harassment or discrimination of any kind is not welcome.
