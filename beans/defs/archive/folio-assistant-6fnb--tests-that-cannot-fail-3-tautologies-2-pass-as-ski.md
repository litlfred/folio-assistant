---
# folio-assistant-6fnb
title: 'Tests that cannot fail: 3 tautologies, 2 pass-as-skip, and a chapters/ path in the wrong repo'
status: completed
type: bug
priority: normal
created_at: 2026-08-08T08:52:22Z
updated_at: 2026-08-08T08:58:20Z
---

Now that `code-quality-gates.yml` actually runs (bean `cnlf`), the 431-pass
count is load-bearing. Some of those passes cannot fail.

## Tautologies — `expect(true).toBe(true)`

- `latex-lean-coverage.test.ts:115` "coverage statistics logged" — a
  `console.log` wearing a test's clothes.
- `latex-lean-coverage.test.ts:162` "label prefixes match environment types"
  — computes `mismatches`, logs them, then asserts nothing. The NAME claims a
  property the body never checks, so CI prints
  `✓ label prefixes match environment types` regardless.
- `lean-projects.test.ts:159` — same shape, for the `sorry` counter.

## Passing while skipping

`latex-lean-coverage.test.ts:54-60` and `:84-90` do
`console.log("ℹ Skipped: …"); return;` — the test PASSES. The rest of the
suite uses `describe.skipIf(!folio)` / `test.skipIf`, which reports as `skip`.
These two report as `pass`.

## The generated-test loop is silently empty

`for (const decl of uniqueDecls)` produces ZERO tests when no chapters are
found, so "every `\lean{}` resolves to a declaration" contributes nothing and
nothing says so.

## …and the whole file is dead anyway

`helpers.ts:66` — `CHAPTERS_DIR = join(REPO_ROOT, "chapters")` where
`REPO_ROOT = resolve(import.meta.dir, "../..")`, i.e. the PLATFORM. But
`chapters/*.tex` is `content_build` output and lives in the FOLIO; every CI
invocation writes `--out-dir ../chapters/` from inside the folio. So
`findChapterFiles()` returns [] even WITH a folio attached, and this file has
never run its real assertions in either repo.

That is the recurring split-repo defect again (8th instance): a path computed
from the file's own location, correct before the split. `QOU_LEAN_DIR` two
lines above already does the right thing (`FOLIO_ROOT ?? REPO_ROOT`), and the
`FOLIO_ROOT` comment directly below warns about this exact symlink trap.

Same defect in `content/pipeline/build.ts:291`: the DEFAULT `--out-dir` is
`join(import.meta.dir, "../../chapters")` → the platform. CI always passes
`--out-dir` explicitly, but `adapters/mcp-server/server.ts` invokes `build.ts`
twice without it.


---

## Summary of Changes

**`CHAPTERS_DIR` now resolves against the folio.** Proven with a synthetic
folio (paper manifest + `chapters/ch01.tex` + the `folio-assistant/` symlink),
running `latex-lean-coverage.test.ts` from inside it:

| | before | after |
|---|---|---|
| from a real folio | **0 pass / 6 skip** | **6 pass / 1 fail** |

The failure is correct — the fixture has no Lean source, so
`QOU.Demo.thmDemo exists in Lean source` rightly fails. Coverage reported
`1/1 formalizable (100.0%)`, and the label-prefix report caught the deliberate
`BADPREFIX-oops`. Before the fix the file could not run in EITHER repo.

Pinned by `scripts/tests/chapters-dir.test.ts`, which spawns a probe from a
temp folio (module-level resolution needs a subprocess). Restoring the old path
fails 2 of its 4 tests.

**Three tautologies gone.** `expect(true).toBe(true)` × 3 — including one named
`label prefixes match environment types` that computed the mismatches, logged
them, and passed regardless. Each is now either a real assertion or a test
renamed `(report)` that asserts the one thing which can break unnoticed: that
it read a non-empty corpus.

**Two pass-as-skip gone.** `console.log("ℹ Skipped: …"); return;` → `skipIf`,
matching the convention the rest of the suite already used.

**The silently-empty loop has a guard.** `for (const decl of uniqueDecls)`
registers zero tests over an empty array, so the per-declaration checks vanished
from the run with nothing reporting it. One test now notices.

**`build.ts` had two defaults pointing at the platform.** `--out-dir` defaulted
to `join(import.meta.dir, "../../chapters")`; measured from a folio it wrote to
`/home/user/folio-assistant/chapters` and now writes to `<folio>/chapters`. And
the default paper was `../quantum-observable-universe/quantum-observable-universe.ts`
— a specific folio paper named in platform code, resolved to a path that exists
in no checkout. It discovers papers via `findPapers()` now, as `validate.ts`
already did: one paper is unambiguous, several or none exit 1 with a message
naming the problem. All three branches exercised.

Net: 431 pass → 430 pass, 29 skip → 35 skip, 0 fail. Five tests moved from
"pass" to "skip" because they were never checking anything, and two were added.
