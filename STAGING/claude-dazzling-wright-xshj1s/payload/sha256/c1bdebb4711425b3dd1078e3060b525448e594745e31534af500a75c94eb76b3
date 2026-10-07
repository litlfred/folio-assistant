---
# folio-assistant-ey1c
title: 'MERGE PIPELINE ASYMMETRY: merge-main regenerates a PR branch, but nothing regenerates main after a PR merges into it'
status: todo
type: bug
created_at: 2026-10-03T01:05:37Z
updated_at: 2026-10-03T01:05:37Z
parent: folio-assistant-d33q
---

`.github/workflows/merge-main.yml` runs `bun run merge:main` on an opted-in **PR branch**
when `main` moves, and that command resolves declared conflicts and regenerates. There is
no counterpart in the other direction: **after a PR merges into `main`, nothing regenerates
`main`.**

So any merge that changes a counted or enumerated directory can leave `main` red, and the
only reason it usually does not is an accident: the PR's own branch was regenerated against
a base that had not moved yet, so its regenerated artefact happens to be correct for the
post-merge tree too. When that accident does not hold, `main` goes red and stays red until
somebody notices.

## Measured, 2026-10-03, on `main`'s own runs

Every failure is the same step — **step 65, "Every declared directory's README is current"**
(`readme:subgraphs:check`). Found from each job's `steps[]` array, not from logs:

    5187a4df361  after #1936                               green
    8688288494a  after #1938 (arXiv licences → uploads/)   RED
    268c0911a06                                            RED
    ea1d8b10593  after #1940                               green
    70882785607  "Add files via upload" (web UI)           RED

Reproduced on a clean detached `main` checkout: *"✗ uploads/README.md is stale — 109
directory README(s); 1 stale."* Six PDFs had been added under `uploads/` and the generated
table never grew their rows. Fixed by PR #1946 — one file, six lines.

**It broke twice, from two different causes, and was repaired in between by accident.**
#1938's merge left it stale; #1940's branch happened to carry a regenerated README, which
repaired `main` incidentally; then a direct web-UI upload broke it again with no generator
run at all.

## Why this is worse than one red gate

**While `main` is red on a hard gate, every open PR inherits that red**, so no PR can show
green, so nothing can be merged on green CI. Measured the same night: #1942 and #1944 were
both red solely on step 65, and both of their sessions started debugging their own diffs. A
single stale generated file on `main` halted the whole board and cost two agents a cycle
each.

**And it makes `main`'s gate history untrustworthy as a record.** A green that an unrelated
PR's regenerate produced is indistinguishable from a green that was never broken — bean
`1xhc` one level above a single gate. The accidental-repair pattern fired **three times in
two hours** on 2026-10-03, the third time on the Merge Manager's own PR while the first two
were being written up.

## Why a direct push has no accident available to it

A web upload, a bot commit, a push to `main` by anybody: there is no PR branch and no
regenerate, so the staleness is certain rather than probable. `uploads/` is the likeliest
victim because it is where files arrive from outside the tooling by design.

## What this is NOT

Not bean `8rff` (generated families with no declared pattern) and not `qnob` (the
merge-main bot's own crashes). Those are about resolving a conflict. This is about a merge
that produces **no conflict at all** and still leaves a generated artefact wrong — the
`lxpq` shape, one layer out: `lxpq` is a single file merging into a state no generator would
produce, this is the whole base doing so.

## Done when
- [ ] `main` going stale on a derived artefact is detected and ACTED on, not only reported
      red — the current state is that CI says so and nobody is assigned
- [ ] the repair is a PR rather than a push to `main`, so it is reviewable and cannot
      itself bypass a gate
- [ ] a decision recorded on whether the merge steward's procedure should include a
      post-merge regen check, or whether the automation makes that unnecessary
- [ ] the three-times-in-two-hours accidental-repair pattern is named somewhere a reader
      finds it — a green on a derived gate must not be read as "was never broken"
- [ ] NEGATIVE control: a merge that changes nothing counted does not trigger a repair PR,
      so the mechanism cannot become a source of churn (bean `do70`)
