---
# folio-assistant-a58y
title: 'ENFORCE: qa-reporting gains its first consumer — a QA verdict whose reviewer cannot emit one is refused'
status: completed
type: task
priority: high
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-22T07:22:05Z
parent: folio-assistant-3x2n
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

## Attribution, ruled by the owner 2026-09-22 — two actors, by WHERE it ran

> *"Two actors: ci-pipeline + local-sweep."*

`QaReviewer.actor` is now stamped by `sweepActor()` in `qa-utils.ts`:
`ci-pipeline` when `CI` or `GITHUB_ACTIONS` is set, `local-sweep` otherwise.
Both hold `qa-reporting`; **neither holds `content-authoring`**.

**Why two and not one, and it is not bookkeeping.** A CI verdict is
reproducible from the `reviewed_sha` it records. A local one may rest on an
**uncommitted edit**, so the same sha addresses a tree that produced something
else. Recording which one ruled is what keeps `reviewed_sha` an address rather
than a decoration.

**No third state here, deliberately.** Every other resolver in that file
reports "could not determine" rather than guessing. The environment is always
readable and the partition is total — `CI` is set by every CI system and absent
locally — so an `unknown-sweep` actor would manufacture a state that cannot
occur, and a state that cannot occur is one nobody maintains.

### Measured, not asserted

| | before | after |
|---|---|---|
| entries naming no actor | 5,896 | **5,869** |
| unresolved reviewer ids | 9 | **8** |
| actors holding `qa-reporting` | 5 | 6 |

The gate reported its own baseline entry **stale** when the translation ids
resolved — the shrink-only mechanism working, unprompted.

### Two properties verified rather than assumed

**The stamp is provenance, not churn.** Re-running a sweep does NOT re-stamp a
fresh entry; the actor is written when the verdict is produced. Confirmed by
staling a field hash and re-sweeping under `CI=true` (→ `ci-pipeline`) and then
locally (→ unchanged, because nothing was stale).

**The `--check` gate is freshness-based**, so a field whose value depends on
the environment does not turn it red. Confirmed by running
`translation:block-qa:check` under `CI=true` against locally-stamped sidecars.

A simulation left one sidecar claiming `ci-pipeline` for a verdict produced in
this container. **Restored** — that is exactly the false provenance this bean
declined to write by hand, and leaving it would have been worse than never
attributing at all.

### Why only the translation ids moved

All six script reviewers are wired. Only `translation-block-qa` can be re-run
here: `qa-sweep` fails by design in this repository (it preflights on
`content/package.json`, and the platform carries no folio). The five
`qa-checkers-*.ts` ids resolve on the next sweep wherever one can run — the
hook is **not retroactive**, and a test pins that.

### Still the owner's — the three agent ids

`voice-editorial-review`, `roundtrip-adjudicator (subagent)` and
`roundtrip-back-translator (subagent)` have no actor, and none of the thirty
declared actors obviously IS them. Inventing one is the same call this bean
already declined once.

## Summary of Changes

`qa-reporting` has its first live consumer. `QaReviewer.actor` is the hook;
`check:qa-reviewer-permission` is the gate, with three outcomes kept apart —
permitted, forbidden (never baselined), unresolved (baselined, shrink-only).

Both owner rulings implemented: script sweeps stamp `ci-pipeline` or
`local-sweep` by where they ran; agent parties stamp `untainted-adjudicator`
(holds the permission) or `untainted-checker` (**deliberately holds nothing**,
which is what makes "a checker must not rule" structurally refusable).

Measured across the work: unresolved reviewer ids **9 → 5**, entries naming no
actor **5,896 → 5,856**. The five remaining are `qa-checkers-*.ts`, wired and
waiting for a sweep that can run here — none undecided.

Verified on `main` at `2ce66fc`. Merged in #829 and #848.
