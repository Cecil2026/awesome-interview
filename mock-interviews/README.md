# Mock Interview Transcripts

This section contains full-length, realistic transcripts of mock interviews. Unlike question banks or "top 50 answers" cheat sheets, these are meant to be read top-to-bottom so you can *see* what a strong interview actually sounds like — the clarifying questions, the dead-ends, the recoveries, and the back-and-forth that turn a good candidate into a great one.

Each transcript includes:

- A **Setup** section explaining the scenario and who's interviewing whom.
- The full **Transcript** with bolded speaker labels and italicized stage directions.
- A debrief: **What went well**, **What could've been stronger**, and **Key takeaways**.
- For system design rounds, a **Reference architecture** diagram showing the final design.

The candidates in these transcripts are not perfect. They get pushed back on, they pivot, they sometimes guess wrong. That's deliberate — the recovery is often the most educational part.

## How to use these

1. **Read once for the story.** Get a feel for the arc.
2. **Read again for the structure.** Notice when the candidate asks clarifying questions, when they zoom out, when they commit to a trade-off.
3. **Practice out loud.** Try answering the interviewer's prompts before reading the candidate's reply. Compare notes.
4. **Pay attention to the interviewer's interjections.** They're modeled on real signals interviewers use to probe depth.

## Transcripts

### System Design

| File | Teaser | Difficulty |
| --- | --- | --- |
| [system-design-url-shortener.md](./system-design-url-shortener.md) | Design a TinyURL/bit.ly clone. Candidate pivots from MD5 hashing to base62 counter encoding after pushback. | L4 |
| [system-design-chat-app.md](./system-design-chat-app.md) | Design WhatsApp/Slack. Group chats, presence, read receipts, end-to-end delivery guarantees. | L5 |
| [system-design-rate-limiter.md](./system-design-rate-limiter.md) | Design a distributed rate limiter at the API gateway layer. Token bucket vs sliding window, Redis vs in-memory. | L4/L5 |
| [system-design-rag-qa.md](./system-design-rag-qa.md) | Design a RAG-based enterprise document Q&A assistant. Permission-filtered hybrid retrieval, grounding, freshness, and RAG evaluation. | L5 |

### Behavioral

| File | Teaser | Difficulty |
| --- | --- | --- |
| [behavioral-leadership-conflict.md](./behavioral-leadership-conflict.md) | Five STAR questions on leadership, conflict, disagreement, failure, and influence. Hiring manager loop for a Staff Engineer role. | L6 |

### Rubrics

| File | What it's for |
| --- | --- |
| [system-design-rubric.md](./system-design-rubric.md) | 8-dimension scorecard for grading system design rounds. Map total + per-dimension profile to L3–L6. Apply it after every mock. |

## Conventions

- `**INTERVIEWER:**` and `**CANDIDATE:**` are bolded.
- Stage directions in italics: `*draws on whiteboard*`, `*pauses*`, `*scribbles a note*`.
- Whiteboard sketches use fenced ASCII blocks.
- Turns are short. Real interviews are not monologues — they're tennis matches.

## Contributing

Have a mock transcript you'd like to add? Open a PR. Guidelines:

- Anonymize anyone real.
- Keep turns short (1-4 sentences typical).
- Include at least one moment where the candidate is pushed back on and has to adjust.
- Add a debrief — the analysis is half the value.
