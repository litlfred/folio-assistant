---
# folio-assistant-kyrg
$schema: bean/1.0.0
title: 'HEALTH SWEEP cannot store its report: github-actions[bot] gets 403 on litlfred/cat-harness:cat/cat-harness/health'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-22T13:25:43Z
updated_at: 2026-10-22T16:20:00Z
parent: folio-assistant-1xhc
---

`health-check.yml` now finishes: run 38 (39781213346, 2026-10-22) took 4.5 min, with the health checks themselves taking 29 s. It still ends red at "Write the report through its state branch":

```
cat-harness.health  litlfred/cat-harness:cat/cat-harness/health  failed
remote: Permission to litlfred/cat-harness.git denied to github-actions[bot]. … 403
```

The other three health graphs (cat-harness-tools, folio-assistant-core, who-iris) were unchanged, so nothing was pushed to them. They would hit the same wall the first time they change. The workflow's `GITHUB_TOKEN` can write only this repository. Each separated layer's health graph is a branch on **that layer's** repository, so the daily sweep cannot store a report anywhere but here.

It never showed before 2026-10-22 because no run reached the step (bean 1dre).

## Options (owner's call, since each one is about a credential or where the record lives)

1. A token or GitHub App installation with `contents: write` on the layer repositories, passed to the state push step. It would be declared in `credentials/needs.json`, which the `credentials` check already reports as missing.
2. Keep the folio-assistant sweep's reports in a folio-assistant-owned state branch, and let each layer's own CI write its own health graph.
3. Push only the graphs this repository owns, and report the others as "not written: no credential" rather than failing.

## Done when

- [x] the owner has chosen
- [ ] a daily `health-check.yml` run is green end to end, with the report stored where the choice says

## Owner ruling 2026-10-22

"kyrg option 2" (session_01JkK6uP3iU2etyMbrw7v3cu): this sweep's reports stay in folio-assistant, and each layer's own CI writes its own health graph. Claimed by claude/funny-keller-n85iva.

_2026-10-22T16:20:00Z_ — Shape A (owner) is up as litlfred/folio-assistant#2623: a local instance `folio-assistant-state` with one `health` graph on `cat/folio-assistant-state/health` in this repository (branch seeded, mounts locally), and `health-check.yml` sweeping and pushing only that graph. Not named `folio-assistant`, because reference-direction would read the repository's own name as 533 wrong-direction hits. Still to do after merge: one green dispatch on main. Follow-up: cat-harness's own health graph needs its own CI writer.

## Owner, 2026-10-23: index-level state graphs, not a local instance

Asked how folio-assistant's own health report should be kept, after #2623
(shape A, the local instance `folio-assistant-state`) hit the two hard-coded
instance-list tests in cat-harness-tools that tools CI judges against the
index's main. The owner first asked why `-state` was needed at all and why
only for folio-assistant, then chose, of (keep the instance and let tools CI
take an index ref / artifact only / **index-level state graphs** / write to the
layers' branches): *"Index-level state graphs"* — `index.config.json` declares
state graphs of its own, so the index holds its health graph without being an
instance. Supersedes shape A; option 2 (each layer's CI writes its own) stands.
Session https://claude.ai/code/session_01JkK6uP3iU2etyMbrw7v3cu.
