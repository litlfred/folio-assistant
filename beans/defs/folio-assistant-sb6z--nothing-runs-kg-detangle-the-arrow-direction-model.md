---
# folio-assistant-sb6z
title: 'NOTHING RUNS kg-detangle: the arrow-direction model is correct and unexercised'
status: todo
type: task
priority: normal
created_at: 2026-09-21T09:00:01Z
updated_at: 2026-09-21T09:00:01Z
parent: folio-assistant-1xhc
---

FOUND 2026-09-21 while re-measuring `kvsx`.

`detangle/scripts/kg-detangle.ts` computes the arrow-direction model `kvsx`
specifies — `enforced` / `recorded` / `prose` authority per extractor, `role`
read off enforced boundary edges alone, `undetermined` as a real verdict. The
model is correct and, as of today, **nothing executes it**: no npm script
before this change, no entry in `gates.ts`, no workflow step.

The `detangler` hits in `qa-sweep.yml`, `qa-sweep-nightly.yml` and
`witness-pipeline.yml` are a DIFFERENT THING with the same word — the content
QA axis a folio runs over its prose. Worth stating because a grep for
"detangle" finds nine of them and none is this.

`kg:detangle` was added with `kvsx` so the tool is runnable by name. That is
discoverability, not coverage.

## Why this is the `xom7` shape one level out

`xom7` was a workflow that failed 30 times in two months with nothing in the
repository saying so. Here the tool does not fail at all, because it never
runs. A regression in the authority map, the boundary arithmetic or the role
computation would be invisible until somebody happened to run it by hand and
happened to remember what the numbers were last time.

That last clause is the real gap: **the verdicts are not written down
anywhere**, so even a hand run cannot tell a change from a memory.

## Deliberately NOT gated, and why that is the open question

Adding it to `gates` would be wrong as it stands. Its own closing line is:

  Nothing here decides anything. A failing clause is a reason to LOOK.
  The carve is an adjudication.

A gate over an analysis that decides nothing either always passes — the thing
this repository keeps paying for (`xom7`, `6tkl`, `a6kl`, `pzdv`) — or fails on
a number moving for a legitimate reason, which trains people to ignore it.

## Done when

The detangle verdicts are DURABLE, so a change to them is visible in a diff
rather than in somebody's memory.

`kg:audit` is the precedent worth copying, not `gates`: it writes committed QA
sidecars under `test/results/kg-qa/` mirroring each subject's path, and
`kg:audit:check` fails on a STALE sidecar rather than on a bad number. The same
shape here would make a shifted verdict show up as a diff on a committed file —
which is a question a reviewer can answer — while leaving the adjudication with
the person, where `detangle.ts` says it belongs ("taste is a declared step").

Open, and needs deciding before implementation: WHICH numbers are pinned. Size,
cohesion and the authority counts are derived facts and safe to pin. `role` and
the clause list are derived from them and would be redundant. `verdict`
(`CANDIDATE` / `N clause(s) fail`) is the one a reviewer most wants pinned and
is also the one most likely to churn on unrelated edits.

Not blocked. Needs the decision above, not more measurement.
