---
# folio-assistant-sb6z
title: 'NOTHING RUNS kg-detangle: the arrow-direction model is correct and unexercised'
status: completed
type: task
priority: normal
created_at: 2026-09-21T09:00:01Z
updated_at: 2026-09-21T16:20:36Z
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

## RULED, owner, 2026-09-21 — and implemented

> "sb6z - pin size, cohesion, authority counts. not verdict"

Exactly the set this bean called safe. What is pinned, and what is not:

| field | pinned | why |
|---|---|---|
| `size` | yes | a derived fact about the node set |
| `internal`, `inbound`, `outbound` | yes | see below |
| `cohesion` | yes | a derived fact |
| `enforcedBoundary`, `recordedBoundary`, `proseMentions` | yes | the authority counts |
| `role` | no | derived from the counts above; pinning it duplicates them |
| `verdict`, `clauses` | **no** | the ruling's explicit exclusion |

**`verdict` is excluded for the reason this bean gave**: it is a threshold
comparison, so a group sitting near a boundary flips on a change that moved
nothing about that group. A sidecar that churns is one people stop reading,
and then the staleness check is noise rather than signal.

**The raw counts ride with `cohesion` because this package says they must.**
`detangle.ts` on `oneWayness`: *"Reported with the raw counts, never instead of
them."* `cohesion` is `internal / (internal + inbound + outbound)`, so pinning
the ratio alone would let a change preserving it — three edges becoming thirty
— pass unrecorded. Not a widening of the ruling; it is what pinning `cohesion`
MEANS under this package's own rule.

## What shipped

- `detangle/schemas/detangle-sidecar.ts` — the pinned shape, with `$schema:
  "folio-detangle-sidecar/v1"` so the file DECLARES what it is rather than
  being identified by shape, and `PINNED_FIELDS` as one list so the writer and
  the comparer cannot drift. `sidecarFor` PICKS from `DetangleMetrics` rather
  than being handed a subset, so a field added later is excluded by default
  instead of silently pinned by an object spread.
- `kg-detangle.ts` writes 23 sidecars under `detangle/results/`, mirroring each
  group's path. `--check` compares.
- `kg:detangle:check`, wired into `code-quality-gates.yml`.
- `detangle/results/` DECLARED in `detangle.json` as a `qa` graph, `dependents:
  "skip"` — these measure THIS repository's graph, and reproducing them into a
  dependent would hand it this one's answers.

## The two things it refuses, and why each was paid for elsewhere

**It fails on STALE, never on a number being wrong.** `detangle.ts`'s own
closing line is *"Nothing here decides anything… the carve is an
adjudication"*, and this bean argued a gate over an analysis that decides
nothing either always passes or churns. Same shape as `kg:audit:check`.

**Orphans are REPORTED, never deleted** — bean `3jj9`, paid for one package
over: a sidecar whose subject was renamed sat in the tree reporting a verdict
about a path nobody had, while the live subject had no sidecar, and `--check`
exited 0 across both. The write loop only looks group → file; `sweepOrphans`
looks the other way. Not deleted, because an orphan can mean a declaration gap
rather than a dead group (`deletion-requires-confirmation`).

## Falsified rather than asserted

    untouched re-run          23 current, exit 0   ← the churn test this bean
                                                      required before shipping
    cohesion 0.87 -> 0.11     STALE, exit 1        ← names the FIELD, not just
                                                      "stale"
    orphan sidecar added      ORPHAN, exit 1
    restored                  exit 0

The exit codes were checked separately from the output, because a check that
prints a failure and exits 0 is the defect this whole line of work is about.

93 gates (one more than before — the new check actually runs), 249 browser
tests, 5217 unit tests.

## Still not done, and deliberately

The `verdict` remains unrecorded. If a reviewer later wants "did this group's
verdict change", that is a NEW question and a new bean, not a widening of this
one — and it needs an answer to the churn problem first.

