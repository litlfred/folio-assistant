---
# folio-assistant-a58y
title: 'ENFORCE: qa-reporting gains its first consumer — a QA verdict whose reviewer cannot emit one is refused'
status: in-progress
type: task
priority: high
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

The declared permission `qa-reporting` — *"Emit QA reports"* — has **zero
non-test consumers**. Measured 2026-09-21: one comment in `role-graph.ts`, one
test asserting more than one role holds it, and nothing anywhere that consults
it when a verdict is written.

Five actors hold it (`ci-health-watcher`, `ci-pipeline`,
`ig-publisher-service`, `platform-boundary-guard`, `qc-reviewer`); **none** also
holds `content-authoring`. **The separation the owner asked for is already true
in the declaration.** What is missing is anything that would notice if it
stopped being true.

That is the `dh4f` shape: a consumer scanning something that is not there, and
a clean run over it. Here it is worse than the usual case, because the
declaration reads as a control.

## Done when

- [x] A QA verdict names its reviewer, and the reviewer resolves to a declared
      actor — `QaReviewer.actor`, new, with absence as the third state.
      **The bean assumed `id` would resolve. It does not, and that is the
      finding** (below)
- [x] A verdict whose reviewer is an actor without `qa-reporting` is refused —
      `check:qa-reviewer-permission`, registered in `package.json` and
      `code-quality-gates.yml`
- [x] Falsified in both directions, against the REAL corpus rather than only a
      fixture: a verdict planted with `actor: "author"` turns the gate red and
      names it; restoring turns it green. The 5,896 existing entries do not
      fire it
- [x] The third state is distinct: `unresolved` is counted apart from
      `permitted` and `forbidden`, baselined, and the baseline may only shrink

## What the measurement found — the bean's premise was wrong

**0 of 5,896 reviewer entries resolve to a declared actor.** Not one, and not
because any were denied.

`QaReviewer.id` is a script path (`content/pipeline/qa-checkers-voice.ts`) or
an ad-hoc agent name (`roundtrip-adjudicator (subagent)`). An actor id is a
persona (`ci-pipeline`, `qc-reviewer`). **The two sides never shared a
vocabulary**, so `qa-reporting` was not unmet — it was *unevaluable*, for every
verdict in the repository, while reading from the permission graph as a
control.

That reshapes the gate. Failing on `unresolved` would fail on everything;
ignoring it would do nothing. So:

| outcome | gate |
|---|---|
| **permitted** — actor resolves and holds it | pass |
| **forbidden** — actor resolves and does NOT | **FAIL, never baselined** |
| **unresolved** — no actor, or one naming nothing declared | baseline, fails on a NEW one |

An actor id that names nothing declared reads as `unresolved` rather than
`forbidden` **on purpose**: the other way round reports a discipline breach
where there is a spelling mistake.

## Not done here, because it is a declaration decision

Attributing the nine existing reviewer ids to actors. `qa-checkers-*.ts` is
plausibly `ci-pipeline`, but it also runs locally, and attributing a local
sweep to the CI pipeline would be a false provenance of exactly the kind this
epic exists to stop. The agent ids (`voice-editorial-review`, the roundtrip
pair) have no actor at all, and **inventing one is not a coder's call**.

The hook exists and the backlog is measured; the attribution is the owner's.

## The one exception, structurally identified

A **could-not-dispatch** record may be written by anyone, including the
producer — the owner's ruling. Recognised by `metrics.dispatch: "unavailable"`,
never by reviewer name, so the exemption cannot be claimed by asserting it. A
test plants a plain `n/a` whose notes *say* "Could not dispatch" and confirms
it is still reported.
