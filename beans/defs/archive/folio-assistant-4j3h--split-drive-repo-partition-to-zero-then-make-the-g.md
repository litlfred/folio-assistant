---
# folio-assistant-4j3h
title: 'SPLIT: drive repo-partition to zero, then make the gate able to fail'
status: completed
type: task
priority: normal
created_at: 2026-09-20T06:34:25Z
updated_at: 2026-09-20T06:40:58Z
parent: folio-assistant-vke6
---


## Measured before any change (2026-09-20, at `5b8277ea9b`)

`bun run check:partition` — 586 modules, 1258 internal import edges:

```
  unassigned             19  (rule 0, triage 0, keyword 0, unclaimed 19)
  Wrong-direction edges:  8
  Edges touching an unassigned module: 70
```

The tool refuses to call the third number clean, in its own words: *"These
are not cross-edges — they are edges this tool declined to judge. Classify
the endpoints, then re-run; do not read them as clean."*

## Why the 8 survived a green 43/43

`check:partition` **is** a registered gate (`code-quality-gates.yml:456`),
and it ran. It reports the edge count and exits 0 anyway:
`process.exit(1)` is guarded by `strict`, and the gate invokes the script
bare. So a gate that CANNOT fail is indistinguishable, from a green board,
from one that passed — bean `xom7`, one level up from the workflow it was
written about.

That is not a reason to flip `--strict` today. Repo precedent, from the ruff
comment in the same workflow file: **a check is an error only once its count
is zero.** Drive the count down first; flipping a red gate on just teaches
the next agent to pass `|| true`.

## Three of the eight are mine, from PR #468

```
src/workflow/instance.ts      [harness] -> schemas/convention.ts [core]
src/workflow/process-model.ts [harness] -> schemas/convention.ts [core]
scripts/kg-audit.ts           [harness] -> schemas/convention.ts [core]
```

`schemas/` is claimed wholesale by a core prefix rule, and `repo-partition`
already carries an explicit exception list for the harness's own schemas in
that directory — `tool.ts`, `tool-types.ts`, `kg-node.ts`,
`harness-config.ts`, `skill-package.ts`, `tool-invocation.ts`. Its comment
records the bill for omitting such a file: **nine** wrong-direction edges.

`convention.ts` describes agent process rules, not folio content. It belongs
on that list and I left it off when I merged #468 minutes ago.

## Done when

- [ ] `schemas/convention.ts` classified harness; the 3 edges above are gone
- [ ] the 19 unassigned (17 `scripts/*`, 2 `src/logging/*`) are classified
- [ ] unassigned reaches 0 **without** the wrong-direction count rising
- [ ] if the edge count reaches 0, the gate is made strict so it cannot regress;
      if it does not, that is reported with the residue named, not flipped anyway

## Falsifier

If classifying the 19 RAISES the cross-edge count, the classification is
wrong rather than the tool. `repo-partition.ts:494-497` already records that
discipline for a previous batch — seven modules weighed as *"4 edges and 0
unassigned, against a baseline of 5 edges, 7 unassigned"*. Both numbers get
quoted here too, not only the one that improves.

## Measured after (2026-09-20)

| axis | before | after |
|---|---:|---:|
| unassigned modules | 19 | **0** |
| wrong-direction edges | 8 | **1** |
| edges the tool declined to judge | 70 | **0** |

Better on every axis, quoted in full rather than only the one that improved.

## The falsifier fired, and the order of operations changed because of it

Classifying the 19 scripts ALONE took wrong-direction edges from 5 to **12**.
Per this bean's own test that means the classification was wrong, not the
tool — so the seven new edges were read rather than argued away. Every one
reached a shared schema target that the `schemas/` prefix had claimed for
core while being harness vocabulary: `python-deps.ts`, `avatars.ts`,
`kind-validator.ts`, `actor-reach.ts`. Moving those FIRST and the scripts
after gives 5. Exactly the sequence `repo-partition.ts:494-497` already
records for a previous batch, which is why that note was worth reading
before starting rather than after failing.

Draining the rest surfaced four more, including one worth naming: **`schemas/
fsh-guts.ts` was `smart-base` because the keyword rule
`/(dak|fhir|fsh|ocl|l2|l3|smart|who|ig)/` matched `fsh` in the name of the
TRASHCAN.** A keyword rule cannot tell a homograph from a hit. It was the
single `folio-assist-core -> smart-base` edge in the whole repository.

## The residue, named rather than hidden

One edge remains: `src/types.ts [harness] -> schemas/types.ts [core]`.

It is NOT a misclassification, and a previous pass already established that
and deferred it to this task by name:

| The harness's plug-in interface being written in the vocabulary of what it
| plugs into is the real question, and it is task 10's. Recorded here rather
| than acted on: a partition-tuning pass is the wrong place to redesign an
| adapter contract.

Re-checked here, and the earlier judgement holds: every `ContentAdapter`
method returns `FolioItem`, `ContentOutline`, `ChapterDetail`,
`ResolvedSection` or `ResolvedDocument`, so splitting the file MOVES the edge
rather than removing it. Classifying `src/types.ts` as core was tried and
measured — the edge is unchanged. It wants an adapter-contract decision from
the owner, which is not a partition pass's to make.

## Why the gate is now strict on ONE axis and not the other

`check:partition` ran in CI without `--strict`, so its only failing path was
one nothing invoked. It reported 8 edges and exited 0.

Repo precedent (the ruff comment in `code-quality-gates.yml`): **a check is
an error only once its count is zero.** Unassigned IS zero now, so that axis
is enforced — and it is the one failure a contributor adding a file causes by
accident. Wrong-direction edges stay reported, because that count is 1.

The enforcement was watched failing before being trusted: removing one
classification gives `1 module(s) fell through every rule: scripts/gates.ts`
and exit 1.
