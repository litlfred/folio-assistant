---
# folio-assistant-dh4f
title: Triage 30 pipeline scripts still rooted at their own location or naming a folio paper
status: completed
type: task
priority: normal
created_at: 2026-08-08T09:38:30Z
updated_at: 2026-08-08T09:55:18Z
---

Systemic follow-up to bean `pzdv`, which fixed the two hard gates
(`qa-section-title-audit`, `trivial-skeleton-audit`) that reported success over
a corpus they had never read.

The root cause is the recurring split-repo defect: a path computed from the
script's own location (correct before the repo split, wrong after), and/or a
specific folio paper named in platform code. **30 more files carry one or both
and have not been triaged.**

## Why this needs triage, not a sweep

Being self-rooted is CORRECT for some of these. `scripts/gen-schema-docs.ts`
and `gen-skill-docs.ts` generate PLATFORM docs from PLATFORM schemas, so
resolving against `import.meta.dir` is right. The defect is only a defect when
the target is folio content. Each file needs the question asked once:
*does this read or write content, or platform?*

Hardcoding `quantum-observable-universe` is a defect in every case — that is
folio subject matter in platform code, which AGENTS.md rules out flatly.

## The list

| file | self-rooted | names qou |
|---|---|---|
| `content/pipeline/audit-status-sections.ts` | — | 2 |
| `content/pipeline/audit-tex-source.ts` | yes | — |
| `content/pipeline/audit-wiring.ts` | — | 3 |
| `content/pipeline/conditional-class-banner-audit.ts` | yes | 1 |
| `content/pipeline/conjectural-propagation-audit.ts` | yes | 3 |
| `content/pipeline/conjectural-propagation-sweep.ts` | — | 1 |
| `content/pipeline/extract-status-sections.ts` | — | 1 |
| `content/pipeline/find-dangling-remarks.ts` | yes | 2 |
| `content/pipeline/generate-index.ts` | yes | 1 |
| `content/pipeline/generate-main-tex.ts` | — | 2 |
| `content/pipeline/migrate-bib-verifier.ts` | yes | — |
| `content/pipeline/migrate-cites.ts` | yes | — |
| `content/pipeline/proof-axis-dashboard.ts` | — | 1 |
| `content/pipeline/prune-transitive-deps.ts` | yes | 1 |
| `content/pipeline/qa-checkers-q-usage.ts` | — | 1 |
| `content/pipeline/qa-merge-findings.ts` | — | 2 |
| `content/pipeline/qa-staleness.ts` | — | 3 |
| `content/pipeline/render-latex.ts` | — | 1 |
| `content/pipeline/validate-references.ts` | yes | 1 |
| `content/pipeline/validate-tex.ts` | — | 1 |
| `content/pipeline/wall-violations-sweep.ts` | — | 1 |
| `scripts/audit-wiring-migrate.ts` | yes | — |
| `scripts/audit-wiring.ts` | yes | — |
| `scripts/gen-schema-docs.ts` | yes | — |
| `scripts/gen-skill-docs.ts` | yes | — |
| `scripts/lean-audit.ts` | yes | 2 |
| `scripts/lean-coverage.ts` | yes | 1 |
| `scripts/lean-witness.ts` | yes | — |
| `scripts/section-story-audit.ts` | yes | 1 |
| `scripts/witness-audit.ts` | yes | — |

**30 files.**

## How to tell, per file

1. Does it resolve paths against `import.meta.dir` / `SCRIPT_DIR`, and are
   those paths under `content/`? → should be `findContentRepoRoot()`.
2. Does it name a paper? → should be `findPapers()`, or an explicit argument.
3. Does it WRITE (witness JSON, worklist, sidecar)? → the write path has the
   same bug and is easier to miss; both audits in `pzdv` wrote their empty
   results into the platform repo.
4. Is its exit code a CI gate? → then an empty corpus must exit non-zero, per
   `validateObjects` (bean `vald`).

## Worked examples to copy

- `content/pipeline/trivial-skeleton-audit.ts` — self-rooted + hardcoded paper
  + gate + witness write. All four, in one file.
- `content/pipeline/qa-section-title-audit.ts` — `process.chdir()` to the
  platform at module load, which defeated every cwd-relative path in the file.
- `content/pipeline/build.ts` — both CLI defaults (out-dir and paper).
- `scripts/tests/helpers.ts` — `CHAPTERS_DIR`.

## Guard

`scripts/tests/audit-empty-corpus.test.ts` and `scripts/tests/chapters-dir.test.ts`
show the pattern for pinning these: spawn the script from a synthetic folio
(temp dir with `content/<paper>/<paper>.ts` and a `folio-assistant/` symlink)
and assert it reads what is there. Module-level path resolution needs a
subprocess, not an import.


---

## Summary of Changes

**31 files triaged, 23 fixed, 8 accounted for.** Every one was inspected; none
was swept.

### Fixed — 23 files

**Root pointed at the platform while every target was folio content** (17).
`REPO_ROOT`/`CONTENT_ROOT`/`PAPER_DIR` computed from `import.meta.dir` or
`SCRIPT_DIR`, now `findContentRepoRoot()`:
`audit-tex-source`, `conditional-class-banner-audit`,
`conjectural-propagation-audit`, `generate-index`, `prune-transitive-deps`,
`validate-references`, `validate-tex`, `migrate-bib-verifier`, `migrate-cites`,
`migrate-lean-refs`, `audit-wiring` (both copies), `scripts/audit-wiring-migrate`,
`lean-audit`, `lean-coverage`, `lean-witness`, `section-story-audit`,
`witness-audit`, `headless-render-qc`.

`headless-render-qc` was the sharpest: `VIEWER_DIR = join(REPO_ROOT,
"folio-assistant", "ui")` is a FOLIO-relative path — inside a folio the platform
IS `folio-assistant/` — so a platform-rooted `REPO_ROOT` made it
`<platform>/folio-assistant/ui`, which exists in no checkout.

**A specific folio paper named in platform code** (13 sites). Now
`requirePaper()` (added to `repo-root.ts`, beside the existing
`soleFolioPaper`): an explicit `--paper` wins, else the folio's sole paper,
else it throws naming what it found. `audit-status-sections`,
`extract-status-sections`, `find-dangling-remarks`, `proof-axis-dashboard`,
`qa-agent-drain-queue`, `lean-coverage`, `section-story-audit`, `lean-audit`,
`conditional-class-banner-audit`, `conjectural-propagation-audit` and `-sweep`,
`generate-index`, `generate-main-tex`, `prune-transitive-deps`,
`validate-references`, `wall-violations-sweep`, `audit-wiring`.

**Three more that passed over nothing**, exposed by the re-rooting:

- `validate-tex.ts` printed `Snippets valid: 0 / Snippets invalid: 0 / No
  errors found.` and exited 0. It now says "Nothing scanned" and exits 1.
- `conditional-class-banner-audit.ts` — **a CI gate**
  (`witness-pipeline.yml` runs it `--strict`). Over an empty corpus it found 0
  labels beyond the baseline and exited 0, the same free pass as
  `trivial-skeleton-audit` in bean `pzdv`.
- `audit-tex-source.ts` printed "✓ No TeX-source hazards detected." over zero
  files.

### Verified correct, unchanged — 3 files

`gen-schema-docs.ts`, `gen-skill-docs.ts`, `generate-schema-manifest.ts` are
self-rooted and should be: their targets are `docs/`, `schemas/`, `skills/`,
`src/`, `build/` — all platform. This is why the bean asked for triage rather
than a sweep.

`integration-audit.ts` resolves a sibling script by its own location, which is
also correct.

### Not this bean — 4 sites, spun off as `folio-assistant-sklb`

Folio *vocabulary* rather than paths: chapter names as map keys, a Lean
namespace→chapter table, criterion prose. Same AGENTS.md violation, but the fix
is a third DI registry (after `value-registry-di` and
`references-registry-di`), not a rename.

### Evidence

Measured from a synthetic folio, before → after:

| script | before | after |
|---|---|---|
| `validate-tex` | 0 files, 0 snippets, "No errors found", exit 0 | **1 file, 2 snippets, both valid** |
| `section-story-audit` | paper: `quantum-observable-universe` (absent) | paper: **`demo-paper`** |
| `conditional-class-banner-audit` | ✓ over 0 blocks, exit 0 | refuses, **exit 1** |

And from the platform, the re-rooted scripts now refuse with a message naming
the problem instead of scanning a directory that is not there.

Gate at close: `tsc` 0 errors, 436 tests / 0 fail, `eslint` exit 0 — with
`no-explicit-any` and `no-unused-vars` both at `error`, which caught eight
imports left dangling by the re-rooting, including two in my own earlier
`trivial-skeleton-audit` fix.
