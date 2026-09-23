---
# folio-assistant-idl1
title: 'ADJUDICATION IS DRAWN INLINE: review-narrative and voice-review each redraw it instead of calling Process_Adjudication'
status: scrapped
type: task
priority: normal
created_at: 2026-09-23T08:35:04Z
updated_at: 2026-09-23T09:18:59Z
parent: folio-assistant-ahvw
---

The shared adjudication process exists and is now expressed against the typed contract, but the two processes that PRODUCE disagreements draw their own adjudicate steps rather than calling it. Owner's prompt 2026-09-23: 'make sure the provide feedback process is defined which would create things to adjudicate.'

## The question the owner asked, and the answer

> also make sure the "provide feedback" process is defined which would create
> things to adjudicate. see existing content/beans

**It is defined — in several places, which is the finding.** Measured
2026-09-23:

- `skills/content-lifecycle/content-feedback.md` is the skill, and **four**
  processes reference it: `content-lifecycle`, `draft-to-publication`,
  `review-narrative`, and `adjudication` itself (at `A_StateFinding`).
- `review-narrative.bpmn` has `Task_RecordFindings` — "Record findings as
  advice" — which is the producing step.
- Nine processes mention adjudication at all.

So there is **no missing `provide-feedback.bpmn`**, and there should not be:
feedback is produced in several contexts and a single diagram for it would
assert a uniformity that is not there. `adjudication.bpmn`'s own entry
condition says as much — it starts from *a criterion's reviewer entries
disagreeing*, which several processes can produce.

## What IS wrong

`review-narrative.bpmn` mentions `AdjudicateVoice` **six times** and carries
its own adjudicate step. `voice-review.bpmn` likewise. **Neither calls
`Process_Adjudication`** — there is no `callActivity` to it anywhere, while
eight other processes do use `callActivity` for shared sub-processes
(`Process_OptionsAnalysis`, `Process_CodeChangeReview`, `Process_Review` …).

So the shared adjudication process is drawn once and **re-drawn twice**. Three
statements of one procedure, free to drift — and two of them now cannot be
checked against the typed contract, because the contract binds to
`<folio:adjudication>` and only `adjudication.bpmn` declares it.

`adjudication.bpmn`'s own documentation already notices the overlap without
acting on it: *"The three outcomes are the ones `review-narrative` and
`voice-review` already use."* Three diagrams agreeing today is not three
diagrams that agree.

## Why this was not done in the same change

It edits two diagrams that nobody has reviewed against a contract that landed
hours earlier (#1020), and a `callActivity` changes what those processes
EXECUTE rather than only what they declare. That is a behavioural change to
somebody else's review flow, and it wants its own review.

## Done when

- [ ] Decided, and recorded: does each reviewer's adjudicate step become a
      `callActivity` to `Process_Adjudication`, or do the three legitimately
      differ? **Check before converting** — if the voice case restricts what
      the adjudicator sees differently, the difference is the point and
      flattening it would lose `adjudicator_sees`'s whole purpose.
- [ ] Where they are one procedure, `review-narrative` and `voice-review` call
      it rather than redraw it.
- [ ] Where they are not, each says in its documentation what it does
      differently and why, so the next reader does not re-open this.
- [ ] `bun run gates` green.

---

# SCRAPPED 2026-09-23 — THE PREMISE IS FALSE

**This bean's central claim was wrong, and it is scrapped rather than deleted
so nobody re-derives it.** `bean-coordination`: a scrapped bean stops the next
agent re-entering a dead end; a deleted one leaves a sibling unable to tell
abandonment from accident.

## What it claimed, and what is actually true

> "No `callActivity` to it exists anywhere."

**False.** Five processes call `Process_Adjudication`:

| process | call activity |
|---|---|
| `voice-review` | `Task_Adjudicate` |
| `review-narrative` | `Task_AdjudicateVoice` |
| `refresh-materialized` | `Task_Adjudicate` |
| `translation-workflow` | `Task_Adjudicate` |
| `ingest-l1-completeness-gate` | `Task_FlagDrift` |

So `review-narrative` and `voice-review` do **not** redraw adjudication. They
call it, as the bean said they should. The shared process was already shared.

## How the error was made — worth more than the finding was

`grep -rn "calledElement" cat-harness/processes/*.bpmn | head -8`, and a
conclusion drawn from the eight lines that came back. The matches are ordered
by filename, and all five adjudication callers sort after the eight shown. The
data never contradicted the claim; **it was never asked.**

That is the failure this repository names everywhere and it was committed by
the agent quoting it: a sweep that passes by not looking. `head` on a grep
whose output decides a claim is the same defect as a gate that reports clean
over a corpus it never scanned. The rule it broke is the repo's own — **never
quote a count from prose, and never draw one from a truncated list.**

The claim reached bean `idl1`, PR #1026's body, and merged commit `38e0442f`'s
message. The PR carries a correcting comment; the commit message cannot be
rewritten and is wrong in the permanent record. Noted here because that is
where an agent will look.

## What replaced it

The check that should have been done first found something real instead — one
shared process with ONE outcome gateway serving five materially different
questions. See the successor bean.
