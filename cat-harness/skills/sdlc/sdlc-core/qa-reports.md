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
graph-typologies:
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
| graph typology | `qa` (and `health`) | `attestations` |
| written to | `<instance>/test/results/**`, the **working copy** | `<instance>/test/attestations/<family>/<mirrored subject path>.attestations.json` |
| record | the orphan **`qa-reports`** branch, `main/<sha>/` or `pr/<n>/<sha>/` | **`main`** (ruling D2 (a)) |
| schema | the family's own | `qa-attestations/v1`, `schemas/qa-attestations.ts` |
| on a merge conflict | regenerate (`qa:resolve-conflicts`) | a person reads both sides |

**The derived files are still committed on `main` today.** Bean `5hox` removes
them once every reader is migrated and the branch holds a hash-verified copy
(ruling D4, "right away"). Until then they are a copy on its way out, not the
record. Do not regenerate one in order to commit it, and do not hand-resolve
one. Every `qa` directory already declares `storage` and is ignored by version
control, so a new file there is not committed. Before the removal is pushed,
`bun run qa:verify-moved --key main/<head>` must answer IDENTICAL. It compares
every moved path's blob id with the entry, and an entry it cannot read is
UNKNOWN (exit 2), never a pass. The inventory is
`docs/proposals/5hox-removal-inventory.md`.

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
| `bun run qa:refresh` | produce the working copy a publish stores, and say whether it is complete (below) |
| `bun run qa:publish --github --completeness <report>` | CI's form: derive the key, skip a fork PR with a `::notice`, and refuse an incomplete refresh |
| `bun run qa:prune [--apply]` | retention, as a dry run unless `--apply`. Daily in `qa-reports-prune.yml` |

**A read answers one of five states.** `hit` exits 0, `miss` 1, `usage` 2,
`corrupt` 3, `unknown` 4. **A miss is never read as "no findings".** A reader
that turns an absent entry into an empty, clean directory is the `dh4f`
defect, and the readers audit
(`docs/proposals/qa-readers-audit-2026-10-01.md`) is a catalogue of exactly
that.

**What `qa-publish` stores is produced in that job, not handed over by the
gates** (bean `3hk4`). The gates are in judge mode and write nothing, so their
checkout holds only what is committed, which after `5hox` is one file. So
`qa:refresh` runs first. While the checkout still tracks `test/results/`, it
runs nothing, because the commit's own copy is the record and `5hox` needs
`main/<sha>` byte-identical to it. Once nothing is tracked there, it runs every
writer declared in `QA_WRITERS` (`scripts/qa-refresh.ts`) into the empty tree.
Then it checks three things. A file no writer claims, a writer that produced
nothing, or a writer that exited outside its declared exits makes the run
INCOMPLETE: the job fails, and `qa:publish --completeness` refuses to store
it. A partial entry is never published as the commit's record. Adding a QA
writer means adding it to `QA_WRITERS`, or the first CI run after its first
file lands goes red naming the unclaimed path.

**`qa-publish` is a job, not a gate.** It runs after `gates` whatever they
concluded (the evidence of a red commit is evidence too). It is the only job
holding `contents: write`, and `bun run gates` never runs it locally. Its red
means the record was not stored, never that the commit is bad
([`ci-health`](ci-health.md)). Diagram: `processes/sdlc/qa-publish.bpmn`, called
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
  §"`storage`" covers the declaration field that marks a directory as
  stored. Every `qa` directory sets it since bean `5hox`, and each working
  copy is ignored by version control.
- [`content-context-and-state-graphs`](../../kg/kg-core/content-context-and-state-graphs.md)
  explains why both halves are `state`, and why only one of them can be
  rebuilt.
- [`qa-witness`](qa-witness.md) covers the published projection of a verdict.
- The proposal is
  `docs/proposals/qa-reports-branch-and-test-process-2026-10-01.md`, with
  rulings D1 to D5.
