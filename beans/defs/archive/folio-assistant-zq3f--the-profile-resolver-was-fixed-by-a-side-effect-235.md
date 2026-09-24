---
# folio-assistant-zq3f
title: The profile resolver was fixed by a side effect — and 235 sidecars still carry the old verdicts
status: completed
type: task
priority: normal
created_at: 2026-09-21T19:20:00Z
updated_at: 2026-09-21T20:15:00Z
parent: folio-assistant-vke6
---

Found 2026-09-21 while clearing `vzur`'s retired-filename backlog, and **not
fixed there**: it is a question about QA verdicts, not about prose.

[`domain-fencing`](../../../cat-harness/skills/graph-management/domain-fencing.md)
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

- [x] Re-run the QA sweep and establish whether `detangler-archimedean-wall`
      still fires on `content/docs/publication-workflow/*`. **It does not** —
      and the sweep could not have answered it here anyway, because
      `qa:sweep` preflights on a `content/package.json` this repo has no
      business carrying. The registry probe answered it directly.
- [x] If it does not: the 235 sidecars are stale output, and refreshing them
      is the fix — **not** deleting them
      ([`deletion-requires-confirmation`](../../../cat-harness/skills/folio-core/deletion-requires-confirmation.md)).
      **They are not stale output in the sense meant**: every verdict is
      `n/a`, so there is nothing false recorded, and they refresh in a folio
      repo rather than here.
- [x] If it does: the gating is a second defect, and the profile lookup was
      never the whole cause. **The second half is true without the first** —
      the profile lookup was never the cause at all; the `archimedean-wall`
      opt-in fence is.
- [x] Either way, correct `domain-fencing`'s §"Two things the fencing turned
      up" to state what is true after the re-run.

*Recorded by session_017MEZnJxx7WeekiNCabx4hx, which found it and did not
pivot to it.*

---

## Closed 2026-09-21 — measured, and the premise was wrong in BOTH halves

This bean asked whether a fresh run still emits `detangler-archimedean-wall`
on prose. It does not, and neither of the reasons this bean gave is why.

### The cause is the FENCE, not the resolver

Probed against this repository:

```
{ "axes": [], "inRegistry": false, "inBucket": false }
```

Neither `folio-assistant.config.json` nor `cat-harness.config.json` declares
`qaAxes`, so the criterion is **not registered here at all**. The thing that
stops it firing is the `archimedean-wall` opt-in fence that `domain-fencing`
itself introduced — not #727's side effect on `readDeclaredFolioProfile()`.

The resolver measurement stands: `findContentRepoRoot()` returns
`cat-harness/` and the profile resolves to `document` from both roots. It is
simply **not the mechanism**, and this bean attributed a fix to the wrong
change. `folio-optional-axes.test.ts` already pins the fence in both states,
which is the evidence that should have been read first.

### There were never any bad verdicts — 235 was also the wrong number

| | |
|---|---|
| this bean said | 235 sidecars carrying verdicts from the old behaviour |
| **measured** | 122 `block-qa` sidecars + 113 `witnesses`, and **every one is `"result": "n/a"`** |

122 of 122 `n/a`. Not one `critical`, not one finding of any kind.

**The 235 was a grep artefact**, and of exactly the class this repository has
a rule about: `grep -rl` counts files CONTAINING a string, so it swept the
witness files in with the block-qa sidecars and counted a substring rather
than a verdict. The same error shape as `cat-harness.json` containing
`harness.json`, one directory over.

So the harm `domain-fencing` describes — *"a `profiles: ["paper"]` criterion,
scored against prose"*, with the config comment's *"LaTeX-shaped axes fire
`critical` on prose that never reaches pdflatex"* — **did not occur for this
criterion**. What the sidecars record is that it was evaluated and found not
applicable, which is the correct outcome and is informative rather than noise.

### What remains, and it is not work

The 235 files carry an `n/a` entry for a criterion no longer in the registry.
Refreshing them would drop the key. That cannot be done here: `qa:sweep`
preflights on `content/package.json`, which this platform repo does not have
**by design** — it carries no folio. They refresh in a folio repo or via the
dispatch workflow.

No deletion, and none was ever warranted
([`deletion-requires-confirmation`](../../../cat-harness/skills/folio-core/deletion-requires-confirmation.md)).

### Done when

- [x] Establish whether `detangler-archimedean-wall` still fires — **it does
      not, and the fence is why.**
- [x] Determine whether the sidecars are stale output — they carry `n/a`
      only, so there is nothing false to correct.
- [x] Correct `domain-fencing`'s re-measurement box, which named the wrong
      mechanism and quoted a count that was a grep artefact.

*Opened and closed by session_017MEZnJxx7WeekiNCabx4hx. **The lesson is the
bean, not the outcome**: the re-measurement that opened it was right about the
resolver and wrong about what the resolver controlled, and a count taken with
`grep -rl` was carried into a skill and a PR body before anything parsed it.*
