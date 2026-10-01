---
name: qa-reports
description: >
  Where a QA result lives now. Derived verdicts go to the orphan `qa-reports`
  branch, keyed by commit, written by the CI job `qa-publish`. Judgements stay
  on main in the `attestations` graph. Gates compute and judge against a stored
  baseline, and a missing one is unknown. Read before you regenerate, commit,
  resolve, cite or delete anything under `test/results/` or `test/attestations/`.
adapters: [document, paper, dak]
profiles: [document, paper]
graph-kinds:
  - qa
  - attestations
---

# QA reports — derived results on a branch, judgements on `main`

**A QA result is either reproducible or it is not, and that decides where it
lives.** A script verdict is a pure function of the tree: run the producer
again and you get it back. A reviewer's judgement is not, because no re-run can
reproduce what an agent or a person decided. Arc `3fva` (issue #1763) split the
two on that line, by the owner's rulings of 2026-10-01:

| | derived | judgement |
|---|---|---|
| what | every `reviewer.kind: script` entry: `kg-qa/**`, `*.qa-results.json`, witnesses, `lsi/`, `tool-runs/`, the health report | agent, human and **baseline-pair** attestations (the owner ruled a baseline is a judgement) |
| graph kind | `qa` (and `health`) | `attestations` |
| written to | `<instance>/test/results/**`, the **working copy** | `<instance>/test/attestations/<family>/<mirrored subject path>.attestations.json` |
| record | the orphan **`qa-reports`** branch, `main/<sha>/` or `pr/<n>/<sha>/` | **`main`** (ruling D2 (a)) |
| schema | the family's own | `qa-attestations/v1`, `schemas/qa-attestations.ts` |
| on a merge conflict | regenerate (`qa:resolve-conflicts`) | a person reads both sides |

**The derived files are still committed on `main` today.** Bean `5hox` removes
them once every reader is migrated and the branch holds a hash-verified copy
(ruling D4, "right away"). Until then they are a copy on its way out, not the
record. Do not regenerate one in order to commit it, and do not hand-resolve
one.

## The branch

```
qa-reports  (orphan; never merged; author folio-qa-bot)
├── index.json                   newest entry per ref
├── main/<commit-sha>/           one tree per main commit that published
│   ├── manifest.json            inputs, producers, the gates' result
│   └── <instance>/test/results/**   byte-identical to the checkout's layout
└── pr/<number>/<head-sha>/…     same shape (ruling D3), pruned 7 days after close
```

Everything goes through **`cat-harness/scripts/qa-store.ts`**, and nothing
else writes the branch. `check:workflows` fails a raw push
(`qa-reports-unretried`).

| command | does |
|---|---|
| `bun run qa:fetch [--ref main\|<sha>\|pr/<n>]` | read an entry |
| `bun run qa:publish --ref main/<sha>\|pr/<n>/<sha>` | write one. Fetch the tip, splice, `commit-tree -p`, push **without `-f`**, 3 attempts with backoff |
| `bun run qa:publish --github` | CI's form: derive the key, and skip a fork PR with a `::notice` |
| `bun run qa:prune [--apply]` | retention, as a dry run unless `--apply`. Daily in `qa-reports-prune.yml` |

**A read answers one of five states.** `hit` exits 0, `miss` 1, `usage` 2,
`corrupt` 3, `unknown` 4. **A miss is never read as "no findings".** A reader
that turns an absent entry into an empty, clean directory is the `dh4f`
defect, and the readers audit
(`docs/proposals/qa-readers-audit-2026-10-01.md`) is a catalogue of exactly
that.

**`qa-publish` is a job, not a gate.** It runs after `gates` whatever they
concluded (the evidence of a red commit is evidence too). It is the only job
holding `contents: write`, and `bun run gates` never runs it locally. Its red
means the record was not stored, never that the commit is bad
([`ci-health`](ci-health.md)). Diagram: `processes/qa-publish.bpmn`, called
from `Task_QaPublish` in `code-quality-gates.bpmn`.

## Gates compute and judge

A gate over the `qa` graph cannot compare a fresh run against a committed file
for long, because the committed file is leaving. So its `--check` form
**computes and judges, and writes nothing** (beans `bo44`, `id4s`, `0dav`):

- **A finding fails only if it is NEW against a baseline.** The baseline is
  the committed working copy for now, and `--against <ref>` reads it from
  `qa-reports` (for example `--against main`). Inherited findings are counted
  and reported, but they do not fail this change.
- **A missing baseline is UNKNOWN.** It is printed, it is never a pass, and it
  is never a fail, because an unwritten baseline is not this change's defect.
- **The four judge states** are `ok` (exit 0), `finding` (1), `unknown` (2)
  and `error` (2), from `JUDGEMENT_EXIT` in `scripts/qa-results.ts`. An
  `unknown` from a source that would not read outranks a finding, because a
  sweep that was blind on one part has not cleared the others.

Not every gate has moved yet. Each script's docblock says which form it is in,
so read that rather than this list.

## Attestations

- **A writer moves judgements as it saves.** If a writer finds judgements in a
  prior derived file and the store holds no entry for them, it moves them into
  the store as it saves (owner ruling 2, 2026-10-01). `bun run
  qa:attestations:migrate` does a whole instance at once, and `:check` exits 1
  while any judgement is still only in a derived file.
- **A corrupt store reads UNKNOWN and is refused.** No writer overwrites it,
  and `qa:resolve-conflicts` will not regenerate past it.
- **Two disagreeing judgements are a person's to reconcile.** The migration
  refuses that case, and so should you. Never take one side.
- **Commit the store file.** It is authored content on `main`, the same class
  as a review verdict.

## What to do, by situation

| you are about to | do instead |
|---|---|
| regenerate a `test/results` file and commit it | regenerate it so the gates see the tree; `qa-publish` stores the record |
| resolve a conflict in `test/results/` | `bun run qa:resolve-conflicts`, then `bun run regen` ([`prepare-merge`](prepare-merge.md)) |
| resolve a conflict in `test/attestations/` | read both sides. Keep both judgements unless they are the same one |
| cite a derived result | `qa-reports:main/<sha>/<path>` ([`decision-audit`](decision-audit.md)) |
| read a result in a test | build a fixture, or read it through `readQa` and assert the state ([`test-engineer`](test-engineer.md)) |
| delete a result to clear a sweep | don't ([`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md)) |

## Related

- [`directory-conventions`](../../kg/kg-core/directory-conventions.md)
  §"`storage`" covers the declaration field that will mark a directory as
  stored. No real declaration sets it yet.
- [`content-context-and-state-graphs`](../../kg/kg-core/content-context-and-state-graphs.md)
  explains why both halves are `state`, and why only one of them can be
  rebuilt.
- [`qa-witness`](qa-witness.md) covers the published projection of a verdict.
- The proposal is
  `docs/proposals/qa-reports-branch-and-test-process-2026-10-01.md`, with
  rulings D1 to D5.
