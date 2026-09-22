---
# folio-assistant-520m
title: 'MERGE FRICTION: committed generated QA sidecars conflict on every base merge — 3 of 3 in one session'
status: completed
type: task
priority: normal
created_at: 2026-09-21T20:08:34Z
updated_at: 2026-09-22T05:55:13Z
parent: folio-assistant-1xhc
---

Measured on PR #773, 2026-09-21, across one working session.

`main` moved three times while the branch was alive — 109, 38 and 20 commits —
and **every one of the three merges conflicted, and every conflict was in a
committed generated QA sidecar.** Not once in authored code.

| merge | main moved | conflicts | all generated? |
|---|---|---|---|
| 1 | 109 commits | `qa-sweep.ts`, `folio-assistant-sci.config.json` | no — 2 structural |
| 2 | 38 commits | 3 x `translation-qa` (agent-onboarding ar/fr/ru) | **yes** |
| 3 | 20 commits | the same 3, plus `kg-qa/.../voice-authoring-guidance.kg-qa.json` | **yes** |

Each was resolved the same way: take either side, re-run the generator
(`translation-block-qa.ts`, `kg:audit`). **Coverage and verdicts were
unchanged every time** — what conflicts is a hash both sides recomputed
against their own tree.

## Why this is not just noise

A conflict an agent resolves by running a generator is a conflict that carried
no information. It costs a merge, a regeneration, a full gate run and a push
— and it teaches whoever hits it that conflicts in `test/results/` are safe to
resolve without reading, which is exactly the habit that will wave through the
one that is not.

`agent-onboarding.{ar,fr,ru}` conflicted in BOTH sidecar merges, which
suggests a small set of files is doing most of the churn rather than the
corpus as a whole.

## NOT decided

Whether the answer is (a) a merge driver / `.gitattributes` union or
`ours`-plus-regenerate strategy for `test/results/**`, (b) narrowing what a
sidecar stores so the volatile part is derived rather than committed, (c)
leaving it — these sidecars are committed on purpose, because a printed
verdict is gone and this repository wants "unaudited since it was drawn"
distinguishable from "broken in the commit under review", or (d) something
else.

(c) is a real option and this bean should not assume otherwise. The cost
measured here is three merges in one session, not a broken invariant.

## Done when

- [ ] the owner has settled whether this friction is worth machinery
- [ ] if so: a strategy that cannot silently drop a REAL sidecar change,
      because "regenerate on conflict" applied blindly would
- [ ] whichever way it goes, the reason is written where the next agent
      resolving one of these will find it

## 2026-09-21 — MEASURED, and it corrects this bean's own premise

This bean said the conflicts "carried no information" — *"what conflicts is a
hash both sides recomputed against their own tree"*. That is **wrong**, and the
experiment is one command each:

```sh
bun run translation:block-qa && git status --porcelain   # empty
bun run kg:audit              && git status --porcelain   # empty
```

**Both generators are idempotent.** A no-op re-run over an unchanged tree
writes nothing, because `sameScriptVerdict` in `qa-utils.ts` keeps the existing
entry verbatim when a re-run reproduces it, and deliberately ignores
`reviewed_at`, `reviewed_sha` and `script_commit_sha` when deciding that.

So the three `agent-onboarding.{ar,fr,ru}` conflicts were **real**: both sides
genuinely changed those sidecars' inputs — this branch regenerated the POT for
the `lrbx` TOC fix, main edited the guide — and `source_hashes` differs because
the sources differed. The verdict being unchanged does not make the conflict
empty; it makes it trivially resolvable.

That kills option (b). The churn is not gratuitous restamping, so narrowing
what a sidecar stores would remove information without removing a conflict.

### And it quantifies the risk this bean flagged

*"a strategy that cannot silently drop a REAL sidecar change, because
regenerate-on-conflict applied blindly would"* — measured across all 630
committed sidecars:

| reviewer kind | entries |
|---|---|
| `script` | **5,883** |
| `agent` | **13** (11 `block-qa/v1`, 2 `translation-qa/v1`) |

Blind regeneration would be correct for 5,883 and would **destroy 13** — two of
them in `translation-qa`, the family that churns most. The guard is not a
judgement call, though: a non-script entry is self-identifying
(`reviewer.kind !== "script"`), so any strategy can refuse exactly the files
that carry one.

## Settled — owner, 2026-09-21: a resolve SCRIPT, not a merge driver

Asked as four options with the measurements above. The owner chose the script.
The argument that decided it: a git merge driver needs a `git config` step in
every clone and CI runner, and the people hitting these conflicts are mostly
agents in fresh containers — where a setup step nobody ran is a driver that is
not there, failing open and silently.

### Delivered

- `cat-harness/scripts/qa-resolve-conflicts.ts`, as `bun run qa:resolve-conflicts`
  (`--dry-run`, `--explain`).
- The guard, applied **twice**: refuse any file where either side carries a
  non-script `reviewer.kind`, and verify after regenerating that every such
  entry survived. A fast path that is the only protection becomes the
  protection the day its assumption breaks.
- Conflicts outside the declared `qa` graph are left untouched and unstaged.
- The generator to re-run is read from the sidecars' own `reviewer.id` and
  matched against `package.json`; a family whose writer cannot be identified is
  reported and left conflicted.
- `skills/folio-core/prepare-merge.md` §"Conflicts in `test/results/`" carries
  the reason where the next agent resolving one will find it — this bean's
  third Done-when.
- 11 tests, built on REAL git conflicts in throwaway repositories rather than
  hand-built objects, asserting both directions: an agent-carrying file is
  refused, the same file without it is resolved.

### Two constraints found by resolving a real conflict rather than imagining one

- **A conflicted file is not valid JSON.** The guard reads git's stages
  (`git show :2:<path>`), never the working tree. Reading the working tree
  would throw on every input, and a caught throw is indistinguishable from a
  clean scan — the false-clean this repository keeps paying for. There is a
  test for it.
- **Not every family has a `reviewer` at all.** `kg-qa/v1` records
  `criteria[id].result` with none; it is wholly derived. The guard passes those
  correctly, and `--explain` distinguishes "found none" from "the shape has
  none".

### The fourth data point

The merge that produced this session's fourth conflict —
`kg-qa/skills/folio-core/interaction-modality.kg-qa.json`, main moved 33
commits — was resolved by hand using exactly the procedure the script
implements, before the script existed. That is where both constraints above
came from.

## Done when

- [x] the owner has settled whether this friction is worth machinery
- [x] a strategy that cannot silently drop a REAL sidecar change
- [x] the reason is written where the next agent resolving one will find it
