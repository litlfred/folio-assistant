---
# folio-assistant-w8jq
title: 'MERGE GATE (a): adversarial agentic code review is a required check on any agent-touched PR, with a committed verdict'
status: todo
type: task
priority: normal
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-03T08:11:58Z
parent: folio-assistant-nok9
---

Child (a) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §5.1–5.3.

The gate: any PR whose commits carry agent provenance (a `Co-Authored-By: Claude …` or `Claude-Session:` trailer, a `claude/` head branch, or a bot author) gets a **full adversarial code review by an agent that did not author it**. That review writes a committed verdict, and a required status check reads the verdict.

It replaces the dispatch-only, post-merge `.github/workflows/agent-review.yml`. That workflow truncates the diff at 50,000 characters, and its prompt still points at the QOU PDF.

## Done when
- [ ] provenance detection is specified and tested, including the negative case: a human-only PR must not be required to carry a review
- [ ] the reviewer is independent of the author, recorded by session id and model, and the review runs on the PR **head SHA**; a new push invalidates it
- [ ] the review covers the whole diff, with no silent truncation; a diff too large to review is `unknown` and is REPORTED as `unknown` — never `pass`, and (since 2026-10-03) never blocking either
- [ ] the verdict is a sidecar (schema extends `kg-qa` / `qa-review`, see child (c)), and a required check reads it
- [ ] it composes with merge trains: the review is per-PR on the head; the train re-checks only the compile gates on the combined result
- [ ] `code-change-review.bpmn` Task_Review names the adversarial review skill, and `prepare-merge` checks the verdict

## Superseded 2026-10-03 — the agentic review WARNS, it does not block

The ask recorded above is kept verbatim as what was asked. The owner ruled
differently later on 2026-10-02:

> dont want hard gate (at least not for now, lots of backlog on content nodes)
> but do want warn.

and confirmed on 2026-10-03, with both dates put to them: *"warn only.
proposal predates ruling, update it."* So this is a stale record corrected,
not two live positions.

**The reason is specific.** A hard gate over a backlog of unreviewed content
nodes fires on the corpus's existing state rather than on what a PR changed,
so the first PR after it landed would inherit every unresolved finding in the
paths it touches. The per-block backfill (`lvlv`) has to come first; a
blocking gate inverts that order.

**What this does to child (a) specifically.** The title still says "required
check", and that is now wrong in one word: the verdict is still **required to
exist and to be bound to the head SHA**, but its findings do not hold the
merge. Concretely:

| | |
|---|---|
| the verdict must exist, cover the whole diff, and bind to the head SHA | **unchanged** |
| a `blocking`-weight finding holds the merge | **no** — posted as "would have blocked" |
| a missing, stale or partial verdict holds the merge | **no** — reported as `unknown` |
| `unknown` may render as a pass | **never**, and this is the part the ruling does not touch |

So the check becomes a *reporter* that is still deterministic and still
SHA-bound. The title is left alone deliberately: the bean's filename slug
derives from it, and renaming would move a path that commits and sibling beans
reference.

**A warn is not a weaker block — it is the only instrument that can produce
the number a later promotion needs.** No paper in the 2026-10-02 reading sweep
reports a false-positive rate for any LLM judge (checked across arXiv
2402.02172v5, 2404.04834v4, 2507.23348v1, 2601.04544v1, 2607.00053v1), and
CodeAgent's own annotation leaves 49% of GPT-4's flags unconfirmed. So a
`blocking`-weight finding is posted as **"would have blocked"** rather than
discarded: that record is what a warn-to-block decision reads. The test set
should be this repository's own recorded defects (`plj1`, `dh4f`, `w4tq`,
`7u3g`), which cannot have leaked into a model's training data.

**The pattern to copy is `dependency-advisories` in
`.github/workflows/code-quality-gates.yml`**: exit 0 in every state, with
*found-nothing*, *found-something* and *could-not-determine* kept distinct in
the output. **Not `continue-on-error`** — that file records it as already
reversed once. A warn-only gate that collapses could-not-determine into
found-nothing is the defect this repo keeps paying for (beans `0qjq`, `zjm1`,
`gtx4`, all measured 2026-10-02).

Design: `merge-gate-2026-10-02.md` §1.1 and §5.1 (rows G3/G4). Tracking bean:
`5ge1`.

