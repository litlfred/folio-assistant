---
# folio-assistant-zq3f
title: The profile resolver was fixed by a side effect — and 235 sidecars still carry the old verdicts
status: todo
type: task
priority: normal
created_at: 2026-09-21T19:20:00Z
updated_at: 2026-09-21T19:20:00Z
parent: folio-assistant-vke6
---

Found 2026-09-21 while clearing `vzur`'s retired-filename backlog, and **not
fixed there**: it is a question about QA verdicts, not about prose.

[`domain-fencing`](../../cat-harness/skills/graph-management/domain-fencing.md)
records a defect under §"Two things the fencing turned up". Re-measuring it to
fix the filename in the quoted output showed the measurement itself had moved.

## What changed, measured rather than inferred

| | as recorded | measured 2026-09-21 |
|---|---|---|
| `findContentRepoRoot()` | stops at `cat-harness/folio/` | returns `cat-harness/` |
| `readDeclaredFolioProfile()` at the resolved root | `"undetermined (no <name>.config.json)"` | `document`, declared by `cat-harness.config.json` |
| ...at the repository root | `document` | `document`, declared by `folio-assistant.config.json` |

Nobody set out to fix this. The declaration/config split (#727) gave
`cat-harness` a config of its own, and the walk that previously found nothing
now finds one. **A defect closed by a side effect is still closed, but nothing
recorded that it had been** — which is why the skill said, until this bean,
that the mechanism could not be verified ON from inside this repository.

## The part that is NOT established, and is the actual work

The skill's consequence still stands in the tree: **235 sidecars under
`cat-harness/test/results/` carry `detangler-archimedean-wall` verdicts**, a
`profiles: ["paper"]` criterion scored against prose. Those were written under
the old behaviour.

What was measured is the **profile lookup**. Whether a fresh run still emits
those verdicts depends on the criterion gating in `folioOptionalAxes()` and
the watcher bucket, which was not re-measured. **A fixed resolver is not a
fixed verdict**, and treating it as one is how a stale sidecar gets read as a
current finding.

## Done when

- [ ] Re-run the QA sweep and establish whether `detangler-archimedean-wall`
      still fires on `content/docs/publication-workflow/*`.
- [ ] If it does not: the 235 sidecars are stale output, and refreshing them
      is the fix — **not** deleting them
      ([`deletion-requires-confirmation`](../../cat-harness/skills/folio-core/deletion-requires-confirmation.md)).
- [ ] If it does: the gating is a second defect, and the profile lookup was
      never the whole cause.
- [ ] Either way, correct `domain-fencing`'s §"Two things the fencing turned
      up" to state what is true after the re-run. The re-measurement box is
      recorded there now; the consequence paragraph below it is not yet
      settled.

*Recorded by session_017MEZnJxx7WeekiNCabx4hx, which found it and did not
pivot to it.*
