---
# folio-assistant-cnlf
title: code-quality-gates.yml never runs — and 3 of its 4 jobs scan trees this repo does not have
status: completed
type: bug
priority: normal
created_at: 2026-08-08T08:34:47Z
updated_at: 2026-08-08T08:39:38Z
---

The workflow whose header says *"Without this job none of that is enforced:
the ratchet only works if something runs it"* is `on: workflow_dispatch:`
only. It has never run automatically. Every ratchet landed since PR #68 —
`bun test` 428/0, `eslint .` with all rules at `error`, `tsc --noEmit` over
all five trees — is enforced by nothing.

Measured on `b740d31`: of 33 workflows, exactly two auto-trigger
(`atomic-mass-gen-check.yml`, `docs-site.yml`) and neither runs any TS check.

Worse, flipping the trigger alone would produce a green CI that checks
almost nothing. Three of the four jobs scan trees that do not exist here:

| job | scans | present in this repo |
|---|---|---|
| `lean-bare-import` (hard) | `content/**/*.lean` | **0 files** — `content/` holds only `pipeline/` |
| `python-imports` (warn) | `folio-assistant/computations`, `tools` | **neither dir exists**; the first path is folio-relative |
| `rust-wildcard` (warn) | `tools/**/*.rs` | **0 `.rs` files anywhere** |
| `typescript` (hard) | `bun test` / lint / tsc | real |

The Lean gate prints `OK — no bare 'import Mathlib' in content/**/*.lean`
having looked at nothing. "None found" and "nothing to look at" are
different facts and the log conflates them — the same defect class as the
rest of this session.

Note the workflow was added by THIS session (`b886cdf`, "ci: give the
ratchet something to run in") with a commit message that correctly diagnoses
"no folio-assistant workflow triggers on `pull_request`" — and was then
written dispatch-only. The fix for "nothing runs the ratchet" was itself
something that never runs.

Also: `tsconfig.json`'s comments promise "a green `bun run typecheck`", and
`package.json` has no `typecheck` script.


---

## Summary of Changes

**The gate now runs.** `on:` gains `pull_request` and `push: [main]`, with no
`paths:` filter — a filter is how a whole-repo gate stops covering the file
that broke it, and how a filtered-out required check blocks a branch forever.

**Two jobs that scanned nothing now say so.** `lean-bare-import` and
`rust-wildcard` print `SKIP — … Nothing scanned.` and exit 0 when their tree
is absent, instead of `OK — no bare 'import Mathlib'` / `OK — no non-test
wildcard imports`. "None found" and "nothing to look at" are different facts.
Both are FOLIO trees, so in this repo they always skip; they stay for folios
that vendor the workflow. Note this deliberately differs from the
`lean-build.yml` precedent (hard-fail preflight): that workflow is entirely
folio, this one is mixed, and hard-failing here would redden every platform PR.

**The Python job was worse than vacuous and is now a hard gate.** It scanned
`folio-assistant/computations tools`; neither exists here, and the first is a
FOLIO-RELATIVE path (inside a folio the platform is the `folio-assistant/`
symlink). ruff *warned* about the missing paths and **exited 0** — so
`continue-on-error` was not even load-bearing; the step reported a clean
baseline it had never computed. Repointed at the six trees holding the 44 real
`.py` files, which surfaced **24 live F401s** across 18 files. All 24 drained
(`ruff --fix`, every touched file re-checked with `py_compile`), none in an
`__init__.py` and none with `__all__`, so the rule is promoted to `error` per
the same discipline as eslint.

**Also:** `package.json` had no `typecheck` script, though `tsconfig.json` and
three beans all promise "a green `bun run typecheck`". Added. And
`__pycache__/` was not gitignored, so the `py_compile` verification above
staged bytecode dirs.

### Guards

`scripts/tests/workflow-yaml.test.ts` gains three: the gate triggers on
`pull_request`, carries no `paths:` filter, and its TypeScript job runs all
three of `bun test` / `bun run lint` / `tsc --noEmit`. Each verified to bite by
reverting the change it protects. The four shell jobs were also run locally:
both SKIP paths print and exit 0, and the Python gate exits 1 on a planted
unused import.
