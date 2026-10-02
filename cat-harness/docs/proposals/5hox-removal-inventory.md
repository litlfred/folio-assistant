---
title: "5hox: the QA files that leave main"
kind: proposal
issue: 1763
summary: >-
  Inventory for bean 5hox (arc 3fva, proposal item 3.7): exactly which tracked
  files are the derived QA results that leave main, with their count, size and
  age, what was excluded and why, and the hash check against qa-reports.
---

# 5hox: the QA files that leave `main`
{: .no_toc }

Bean `5hox`, arc `3fva`,
[proposal](qa-reports-branch-and-test-process-2026-10-01.md) §4 item 3.7.
Owner ruling D4 (b), 2026-10-01, "right away": the moved files are removed from
`main` as soon as every reader is migrated and the `qa-reports` branch holds a
hash-verified copy for `main`'s head. Attestations stay (ruling D2 (a)).

**This page reports. It deletes nothing.** The removal is its own commit, and it
is not pushed until the owner has seen these numbers and `main/<sha>` is
verified.

Measured 2026-10-02 on branch `qa-5hox`, from
`claude/quirky-davinci-ixuymr-phase3` at `51e40d7c4`.

## How the set is derived

The set is not a hand list. It is every file under every directory an instance
**declares** as a `qa` graph, resolved by `resolveQaLocation` in
`cat-harness/scripts/qa-store.ts`. That is the same function `qa:publish` uses
to pick its roots, so the set that leaves `main` is the set the branch receives.
`bun run qa:verify-moved --inventory` prints it.

Twelve instances declare a `qa` directory, all at `<instance>/test/results/`:

```
cat-harness  fhir-harness  folio-assistant-core  folio-assistant-sci
smart-base   smart-dak     smart-ig              smart-immunizations
smart-l1     smart-trust   who-iris              who-style-guide
```

The working tree under those twelve directories holds exactly the tracked
files: 1,186 on disk, 1,186 in `git ls-files`. Nothing untracked is mixed in.

## The numbers

| | |
|---|---|
| files | **1,186** |
| bytes | **8,520,910** (8.1 MiB) |
| oldest file, by last change | **6 days**: `cat-harness/test/results/block-qa/content/docs/agentic-harness/consolidated-skill-references.qa.json`, last changed 2026-09-26 (`2e8effe0f`) |
| oldest file, by first commit at its current path | **13 days**: `cat-harness/test/results/avatar-coverage.qa-results.json`, added 2026-09-19 (`c25761d2c`) |
| newest | 2026-10-02 (`51e40d7c4`) |

The ages come from `git log --diff-merges=first-parent --no-renames` over a
full (unshallowed) history. "First commit at its current path" is
13 days at most because `test/results/` itself dates from the 2026-09-19 move.
Some files have older history under earlier paths, and that history stays in
git.

When each file last changed, by day:

| last changed | files |
|---|---|
| 2026-09-26 | 223 |
| 2026-09-30 | 205 |
| 2026-10-01 | 596 |
| 2026-10-02 | 162 |

## Per directory

"Oldest change" is the earliest last-change date among the directory's files.

| directory | files | bytes | first added | oldest change |
|---|---|---|---|---|
| `cat-harness/test/results` (files directly in it) | 20 | 234,650 | 2026-09-19 | 2026-10-01 |
| `cat-harness/test/results/agent-skills/` | 2 | 5,865 | 2026-10-01 | 2026-10-02 |
| `cat-harness/test/results/block-qa/` | 122 | 3,604,913 | 2026-09-19 | 2026-09-26 |
| `cat-harness/test/results/bootstrap-tools/` | 7 | 15,178 | 2026-09-30 | 2026-10-01 |
| `cat-harness/test/results/bootstrap/` | 22 | 43,222 | 2026-09-29 | 2026-09-30 |
| `cat-harness/test/results/cat-harness-tools/` | 2 | 5,925 | 2026-10-01 | 2026-10-01 |
| `cat-harness/test/results/detangle/` | 61 | 18,566 | 2026-09-23 | 2026-09-30 |
| `cat-harness/test/results/kg-qa/` | 504 | 781,380 | 2026-09-19 | 2026-09-26 |
| `cat-harness/test/results/large-datasets/` | 2 | 5,586 | 2026-10-01 | 2026-10-02 |
| `cat-harness/test/results/library-qa/` | 63 | 61,134 | 2026-09-19 | 2026-10-02 |
| `cat-harness/test/results/lsi/` | 4 | 1,017,949 | 2026-09-29 | 2026-09-30 |
| `cat-harness/test/results/tool-runs/` | 4 | 839 | 2026-09-30 | 2026-09-30 |
| `cat-harness/test/results/translation-qa/` | 35 | 116,181 | 2026-09-21 | 2026-10-01 |
| `cat-harness/test/results/viewer-nav/` | 1 | 10,635 | 2026-09-23 | 2026-10-02 |
| `cat-harness/test/results/witnesses/` | 163 | 2,309,468 | 2026-09-19 | 2026-09-26 |
| `fhir-harness/test/results/` | 33 | 41,455 | 2026-09-27 | 2026-09-30 |
| `folio-assistant-core/test/results/` | 15 | 25,099 | 2026-09-27 | 2026-09-30 |
| `folio-assistant-sci/test/results/` | 81 | 127,267 | 2026-09-27 | 2026-10-01 |
| `smart-base/test/results/` | 20 | 34,174 | 2026-09-27 | 2026-09-30 |
| `smart-dak/test/results/` | 3 | 7,854 | 2026-09-27 | 2026-10-01 |
| `smart-ig/test/results/` | 3 | 7,845 | 2026-09-27 | 2026-10-01 |
| `smart-immunizations/test/results/` | 3 | 7,944 | 2026-09-27 | 2026-10-01 |
| `smart-l1/test/results/` | 3 | 7,845 | 2026-09-27 | 2026-10-01 |
| `smart-trust/test/results/` | 3 | 7,872 | 2026-09-27 | 2026-10-01 |
| `who-iris/test/results/` | 4 | 10,968 | 2026-09-27 | 2026-10-01 |
| `who-style-guide/test/results/` | 6 | 11,096 | 2026-09-27 | 2026-10-01 |
| **total** | **1,186** | **8,520,910** | | |

Each of the eleven instances other than cat-harness holds a `kg-qa/` tree, a
`kg-qa.manifest.json` and a generated `README.md`. The twelve `README.md` files
are the subgraph READMEs that `readme:subgraphs` generates from the declaration
and the directory's own files. They describe the working copy, so they leave
with it.

## Deliberately excluded

| what | files | why it stays on `main` |
|---|---|---|
| `cat-harness/test/attestations/` | 48 | The `attestations` kind: agent, human and baseline-pair judgements. Ruling D2 (a). It is not a `qa` directory, so the derivation never reaches it. |
| `cat-harness/test/health/results/` | 2 | The `health` kind. The proposal's §2.1 table says "move", but no declaration marks it moved and `qa:publish` does not carry it. A file the branch does not hold cannot be hash-verified, so it is not removed here. `check:harness-state` already reads it as a stored record (bean `0dav`). Moving it is a separate change: give it a publish path first. |
| block verdicts beside their blocks (`*.qa.json` outside `test/results/`) | 0 | None remain. All 123 `*.qa.json` files are under `cat-harness/test/results/` (122 in `block-qa/`, 1 in `viewer-nav/`). |
| QA fixtures (`cat-harness/test/support/`, `scripts/tests/fixtures`, and similar) | — | They are outside every `qa` directory, so they are not in the set. Tests build their own trees (bean `cxcn`). |
| the `bootstrap` and `bootstrap-tools` submodules | — | Separate repositories. Their hosted verdicts live in cat-harness's own `test/results/bootstrap*/`, which IS in the set. |
| criterion definitions and schemas (`schemas/kg-qa.ts` and similar) | — | Code, not results. |

## Readers

The callers report that every reader bean has landed on this branch: `2gst`,
`8wj1`, `cxcn`, `8iqt`, `c8uq`, `tfqf`, `oq1j`, `id4s` and `0dav`. Some of
those beans still read `todo` or `in-progress` in the bean store on this
branch. Their merges are in the history (for example `523456048`, "Merge
id4s+0dav"). Bean `7mwa` (retire `qa:resolve-conflicts` and the `test/results`
entries in the repository attributes file, and declare `storage`) is still
`todo`. Its `storage` half is done here.

## Hash verification: the dry run

`bun run qa:verify-moved --key <entry>` (`cat-harness/scripts/qa-verify-moved.ts`)
compares the blob id of every inventoried path in the working tree with the
same path in a `qa-reports` entry. The entry's ids are read from its trees, so
no blob is downloaded. It answers one of four states: `identical` (exit 0),
`differs` (1, which covers a path that differs and a path the entry lacks),
`unknown` (2) and usage (3). An entry it cannot read is `unknown`, never a pass.

**Dry run, 2026-10-02**, against the newest PR entry on `origin/qa-reports`:

```
$ bun run qa:verify-moved --key pr/1801/51e40d7c49e8b8d306dc9739e2de6f229ee58826
qa:verify-moved IDENTICAL: all 1186 file(s) identical in pr/1801/51e40d7c49e8b8d306dc9739e2de6f229ee58826
```

The entry's manifest records 1,186 files and 8,520,910 bytes, published by run
`37005618245` with gates `success`, from the PR's merge checkout
`c0d55751f`. That matches the inventory above exactly.

**This is not the verification D4 asks for.** D4 asks for `main/<head>`, and
the branch holds no `main/` entry yet. `qa-publish` writes `main/<sha>` on a
push to `main`, and that job reaches `main` only when the arc PR merges.
Against today's `main` head the tool answers UNKNOWN, as it must:

```
$ bun run qa:verify-moved --key main/85b9578b630e46d1b82eae3877d915cf05c4591d
qa:verify-moved UNKNOWN: entry main/85b9578b… is MISS: no entry main/85b9578b… — an unread entry verifies nothing — this is NOT a pass
```

The order this forces: merge the arc without the deletion, and let
`qa-publish` write `main/<merge-sha>`. Then run
`bun run qa:verify-moved --key main/<merge-sha>` on that commit, and push the
deletion only on IDENTICAL.

## The wiring, and the gates with the files absent

Done on `qa-5hox`, with the files still present. `bun run gates` is green,
apart from `translation:catalogue:check --base`, which runs only in CI.

- All twelve `qa` directories declare
  `storage: { branch: qa-reports, keyedBy: commit }`.
- The root ignore file lists the twelve working copies.
  `directory-storage.test.ts` keeps that list equal to the declarations, and
  checks that `test/attestations/` is not ignored.
- Five judge scripts split new findings from inherited ones:
  `audit:coverage:require-all`, `audit:coverage:strict`,
  `root-scan-census:check`, `readme:subgraphs:check` and `check:viewer-nav`.
  Each carries `--against main` in `package.json`. The flag is not in the
  workflow's run lines, because regen pairs a gate with its writer by script
  name. With no `main/` entry these gates print UNKNOWN and are not gated.

The removal is its own commit. **`bun run gates` with the files absent: 16 of
205 red**, in five groups.

| group | gates | why | what clears it |
|---|---|---|---|
| A. stale-compare gates not migrated | `kg:audit:check`, `kg:audit:all:check`, `translation:block-qa:check`, and `skill:register:check` (twice) through its chain | They still compare a fresh run with the committed sidecar. With nothing committed, all 505 kg-qa sidecars and every translation-qa file read "stale". | Bean `oqe3` (still `todo`): compute and judge, with `--against`. |
| B. UNKNOWN because no `main/` entry exists | `lsi:viz:check`, `uml:overview:check`, `check:qa-reviewer-permission`, `check:orphan-verdicts`, `check:kind-validators:require-all`, `check:declared-paths` | Each reads the corpus through qa-store or reports it absent. The branch has no `main/<sha>`, so each answers UNKNOWN, which is never a pass. | A `main/` entry from the arc merge, plus a `qa:fetch --ref main` step (or `--against main`) before these run in CI. |
| C. committed pages that embed QA | `docs:pages:check`, `check:ci-invocations` (it runs `gen-docs-pages --check`) | The committed docs pages carry QA badges. Without the corpus the generator would write "not available", so every page reads stale. | `gen-docs-pages` reads the corpus through qa-store, or the badges leave the committed pages. This reader is not migrated yet. |
| D. fixed in the removal | `readme:subgraphs:check` (`cat-harness/test/README.md` listed `results/`), `bun test` (`ingest-and-l1`) | | Done. |
| E. known noise | `translation:catalogue:check --base` | Runs only in CI. | — |

**The most important gap is not a gate.** `qa-publish` publishes "what the
checkout holds under every declared `qa` directory", in the words of its own
comment in `code-quality-gates.yml`. After the removal, a fresh CI checkout
holds almost nothing there, because the job writes only the bootstrap
kg-export sidecar. So every `main/<sha>` written after the removal would hold
one file, and every `--against main` baseline would shrink with it. The job's
comment already names two fixes: the gates job hands its working copy over as
an artifact, or the publish job runs the QA writers before it publishes.
Neither exists yet. **Do not push the removal until one of them does.**

One more finding: `subgraph-readmes` (in `bootstrap-tools`) lists a `results/`
directory when a working copy is present and leaves it out when there is none.
After the removal, a contributor who has run `qa:fetch` would get a different
`cat-harness/test/README.md` from the one CI gets. The generator should skip a
stored directory.

## Update, 2026-10-02: beans `3hk4` and `oqe3`

Measured on local branch `qa-3hk4-oqe3`. Not pushed.

**The publish gap is closed by `qa:refresh`.** The gates job cannot hand over
its working copy, because its gates are in judge mode and write nothing. So
`qa-publish` runs the declared QA writers (`QA_WRITERS` in
`scripts/qa-refresh.ts`) when nothing is tracked under the `qa` directories,
and `qa:publish --completeness` refuses an incomplete tree. While the files
are still tracked, nothing runs, and `main/<sha>` stays byte-identical to the
committed copy.

The run with the files absent: 1,288 files from 29 writers. 1,182 of them are
the inventory's paths. The other four inventory paths are not reproduced: they
are the `agent-skills/` and `large-datasets/` kg-qa trees of instances folded
away by `j7ql`, so they are orphans. The 106 new files are block verdicts and
witnesses for docs blocks no hand sweep had reached.

**`bun run gates` with the files absent: 11 of 206 red, down from 16.** Group
A is cleared: `kg:audit:check`, `kg:audit:all:check` and
`translation:block-qa:check` now compute and judge (bean `oqe3`). `readme:subgraphs:check`
and `bun test` are green too. `skill:register:check` (×2) is still red, but
only through the group B gates `lsi:viz:check` and `uml:overview:check`. The
rest is groups B, C and E as above.
