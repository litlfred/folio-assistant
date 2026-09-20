---
# folio-assistant-5rfy
title: 29 of 32 workflows never fire on their own; qa-sweep-nightly has no schedule
status: completed
type: bug
priority: normal
created_at: 2026-08-08T16:57:25Z
updated_at: 2026-08-08T17:03:44Z
---

Follow-on from the code-quality-gates find (bean cnlf), one level up. Only code-quality-gates.yml, docs-site.yml and atomic-mass-gen-check.yml have a non-dispatch trigger; there is no schedule: or cron: anywhere in .github/workflows.

Sharpest instance: qa-sweep-nightly.yml documents in its own header 'schedule - daily at 04:30 UTC' and has no schedule: block. It exists because a session found 60-70% of open watcher-sidecar fails were STALE for want of a re-sweep - a problem it was built to solve and has never run to solve.

Two readings and they need separating per workflow: (a) the trigger was dropped or never added, or (b) it is deliberately manual in the PLATFORM repo because the job needs a folio checked out and would otherwise sweep zero blocks - passing by finding nothing.

Deliverable: classify all 32 into correctly-manual / belongs-to-the-folio / should-fire-and-does-not, with the evidence for each, before changing any trigger.


## Summary of Changes

### It is one migration decision, not 29 oversights

`git log --diff-filter=A` on every workflow: **all 34 arrived in a single commit**
— `109a4ff`, 2026-06-29, the repo split — and every one of them was
`workflow_dispatch`-only at birth, including `code-quality-gates.yml`. Since
then exactly three acquired a real trigger: `atomic-mass-gen-check`,
`docs-site`, and `code-quality-gates` (fixed today, bean `cnlf`).

The only `cron:` this repo has ever contained belonged to a workflow `bc8937a`
deliberately DELETED — a folio's paper-builder image that did not belong in the
platform. So the schedules the headers describe were never here to lose.

The neutering was **right**. The platform has no `content/<paper>/` (0 paper
dirs), no `chapters/`, no `tools/`, no `human-agent-discussions/`. A content
sweep here would sweep nothing and report clean — this bean's own defect class.
What was wrong is that no file said so, leaving every reader to infer
automation that does not exist.

### Fixed

Fourteen workflows carry a `TRIGGERS, ACTUAL:` note naming the real trigger and
what the platform lacks. Plus `scripts/tests/workflow-triggers.test.ts` (5
tests) as the forcing function: a header may not advertise a trigger the `on:`
block lacks unless it carries that note. Verified by stripping the note from
`qa-sweep-nightly.yml` and watching the suite go red.

Two tests guard the other direction, which matters more than the first: the
three live workflows must STAY wired (otherwise the suite is satisfiable by
neutering them and annotating), and no workflow may reference
`github.event.pull_request` while unable to receive a PR event — dead PR
context is the signature of a trigger removed without the body revisited.
`wrapper-tests.yml` had exactly that, keying `concurrency.group` off
`github.event.pull_request.head.ref`.

### One real gap, left for the owner

`build-lean-mcp.yml` is not a split artefact. It builds
`adapters/mcp-server/Dockerfile` — platform code, present here — and its header
promises push-to-main plus twice-weekly rebuilds. It has neither, so the
UNIFIED image that `publish.yml`, `lean-build.yml`, `blueprint.yml` and the
local render hooks all depend on is never rebuilt unless a human dispatches it.

NOT wired here on purpose: it pushes to GHCR and its own header says "the
self-updater on the folio server polls for new image digests and auto-deploys".
Turning it on publishes images and triggers live deploys. Owner's call.

### Two guesses I checked instead of writing down

`deploy-folio.yml` looked like a schedule mismatch; its prose actually says a
cron self-updater is NOT needed. And `release-please` / `discussions-maintain`
looked like outward-facing platform gaps needing a decision — both target
directories (`tools/`, `human-agent-discussions/`) the platform does not carry,
so they are ordinary split artefacts. My first scan also missed
`wrapper-tests.yml` entirely, because the pattern looked for "on every PR" and
the header says "Triggered on PRs that…" — an incomplete scan reporting as
complete, so the scan was widened to over-report and each hit read by hand.
