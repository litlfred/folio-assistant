---
# folio-assistant-5ge1
title: 'MERGE GATE IS SPECIFIED AS BLOCKING, OWNER RULED WARN-ONLY: reconcile merge-gate-2026-10-02.md and nok9 with the 2026-10-02 ruling'
status: todo
type: bug
created_at: 2026-10-02T23:32:19Z
updated_at: 2026-10-02T23:32:19Z
parent: folio-assistant-0ipy
---

## The conflict, both sides measured 2026-10-02

**The owner ruled WARN:** asked how to handle agentic code review before merge,
the owner answered — *"do ingesion and analsysi. then propose. dont want hard
gate (at least not for now, lots of backlog on content nodes) but do want
warn."* Two reasons given, and the second is the binding one: a hard gate over
a content backlog blocks work that was already queued.

**The repository specifies BLOCKING.**
`cat-harness/docs/proposals/merge-gate-2026-10-02.md` (28,547 bytes, written
2026-10-02) states the opposite in at least three places:

| where | what it says |
|---|---|
| the ready-to-merge definition | "no blocking RED FLAGS from any agentic review" |
| §"`unknown` blocks" | "A review that could not cover the diff, a toolchain …" |
| §5.1 | a table headed *"Which gates block"* |

Epic `nok9` ("MERGE GATE: agentic adversarial review") and bean `w8jq` carry
the same blocking G3/G4 shape.

**Which came first is not established.** Both are dated 2026-10-02. The
proposal is research-and-design by its own header, so it may predate the
ruling by hours. Do not assume the ruling supersedes it without checking —
ask the owner, because a proposal written after a ruling is a disagreement and
one written before it is just stale.

## What a warn-only form looks like, from the evidence

From the CodeAgent analysis (arXiv 2402.02172v5), and the pattern is already
in this repository rather than invented:

- **Follow `dependency-advisories` in `code-quality-gates.yml`** — exit 0 in
  every state, and keep *found-nothing*, *found-something* and *could not
  determine* distinct in the output. **Do NOT use `continue-on-error`**: that
  file records it as already reversed once.
- **Render a blocking-weight finding as "would have blocked"** rather than
  blocking. That is what makes a later promotion decidable: it collects the
  data a hard gate would need, which the current blocking spec cannot do
  because nothing runs yet.
- `qa-review.ts` already separates a FINDING (severity) from a DECISION
  (weight: blocking / suggestion / praise). The warn form needs no new
  vocabulary — only a rule that weight never reaches the exit code.

## Why the paper does not justify blocking anyway

Independent of the owner's ruling, CodeAgent cannot carry a blocking gate:
its vulnerability ground truth is CIRCULAR (labels were built by running
CodeAgent over the 3,545 samples and manually verifying what IT flagged), its
headline 92.96% vs 51.42% is precision over a SMALLER flag set (483 flags,
fewer than every baseline), and its consistency/format F1 scores sit at or
below what an always-positive classifier scores on its own class imbalance
(82.1% and 87.4% positive; always-positive gives ~90.1 / ~93.3 F1 against
CodeAgent's 93.16 / 94.07).

The one thing it DOES weakly support is the repo's own rule that a blocking
finding must carry evidence: under the paper's own annotation, **49% of
GPT-4's flags went unconfirmed**.

## Done when
- [ ] owner says whether the proposal post-dates the ruling (a disagreement)
      or pre-dates it (stale)
- [ ] `merge-gate-2026-10-02.md` §5.1 and the ready-to-merge definition carry
      the warn-only form, or record the owner's reversal with its date
- [ ] `nok9` and `w8jq` reconciled with whichever stands
- [ ] the warn form names `dependency-advisories` as its pattern and states
      the three distinct output states
