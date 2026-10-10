---
# folio-assistant-pzdv
$schema: bean/1.0.0
title: Two hard CI gates pass over an empty corpus — 0 findings and 0 scanned are the same to them
status: completed
type: bug
priority: normal
created_at: 2026-08-08T09:30:54Z
updated_at: 2026-08-08T09:39:24Z
---

Continuing the `code-quality-gates` sweep into the scripts those workflows
call, where the exit code IS the gate.

## `qa-section-title-audit.ts` — three green ticks over zero titles

`section-title-audit.yml` calls it and documents it as a **HARD GATE**: "a new
split-artifact / trailing-colon / empty title (or a depth>3 nesting) now fails
CI." Run with no folio attached:

    section-title audit: 0 titles across 0 chapters (max-len 72)
      ✓ no HARD defect(s)
      ✓ no conciseness/duplicate warning(s)
      ✓ no structure findings (depth / band / balance)
    exit 0

It prints `0 titles across 0 chapters` and then claims a clean bill of health
on the next line.

## `trivial-skeleton-audit.ts` — a budget gate that 0 always satisfies

`witness-pipeline.yml` runs it as "baseline-strict": per-pattern budgets pinned
at the current counts (108 flagged total), and the `|| true` mask was
deliberately dropped so it really gates. The check is `observed > budget`. Over
an empty corpus every `observed` is 0, so no budget is ever exceeded:

    Files with tautological-skeleton patterns: 0
    Total flagged lines: 0
    ✓ All strict-gate budgets respected.
    exit 0

It also WRITES a witness JSON recording the empty result as the audit outcome.

## Precedent

`validateObjects` already settled this in bean `vald`: validating nothing is a
FAILURE, not a pass. Same reasoning — in the folio where these gate, an empty
corpus means something broke (wrong cwd, unbuilt tree, moved path), which is
exactly the condition that must not read as success.

## Scope note

Swept all 33 workflows first for the two shapes that produced the last bug:
gate-named steps whose failure is swallowed (9 candidates — all 9 correct by
design, masks on reporting sub-commands, `Detect compute changes` fails closed)
and scans that report OK over an absent tree (only the two already fixed in
`code-quality-gates.yml`). The workflows are clean; the defect is in the
scripts.


---

## Summary of Changes

Both gates now refuse an empty corpus, and both can now actually read a folio —
they could not before, in either repo.

**`qa-section-title-audit.ts`** began with
`process.chdir(resolve(import.meta.dir, "..", ".."))` — the platform — and every
path in the file is cwd-relative (`resolve("content", paper, …)`). One line
pointed the whole audit at `<platform>/content`, which holds only `pipeline/`;
run from a folio it chdir'd back OUT through the `folio-assistant/` symlink.
Now `process.chdir(findContentRepoRoot())`, evaluated before the chdir so it
reads the real cwd. Measured from a synthetic folio:

| | before | after |
|---|---|---|
| | 0 titles, 3 tick lines, exit 0 | 3 titles, catches the planted `split-artifact`, **exit 1** |

**`trivial-skeleton-audit.ts`** globbed `["*/*.lean", "lean/QOU/**/*.lean"]`
under `ROOT = join(REPO_ROOT, "content/quantum-observable-universe")` with
`REPO_ROOT` self-rooted — a path present in no checkout. It now discovers every
paper via `findPapers()` and globs across all of them. From the same fixture it
reads 1 file, flags the planted `one_def`, and the strict gate fires
(`one_def: 1 (budget 0)`, exit 1) where before `0 > 108` was false for every
pattern and it printed "All strict-gate budgets respected".

Both also WROTE their empty results — `docs/audits/*.json` and
`todos/section-title-audit.json` — into the platform repo. The guards now exit
before either write; verified by running both and confirming neither directory
reappears.

**Incidental:** `qa-section-title-audit.ts` contained 4 raw NUL bytes (a
deliberate field separator in a staleness-hash input). They made the file
`data` rather than text, so `grep -n` reported "binary file matches" and showed
nothing — the file silently dropped out of every search over
`content/pipeline`. Replaced with the `\u0000` escape, which produces the
identical string, so no committed sidecar hash changes (verified).

Pinned by `scripts/tests/audit-empty-corpus.test.ts` — 6 tests; removing either
guard fails 4 of them.

## Follow-up

Spun off `folio-assistant-dh4f`: 30 more pipeline scripts carry the same root
pattern. That one needs per-file triage rather than a sweep — self-rooting is
CORRECT for the platform-doc generators — so it is filed with the full list and
the four questions to ask per file.
