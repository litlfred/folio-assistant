---
# folio-assistant-pmci
title: prepare-merge named a Lean CI workflow that no longer exists
status: completed
type: bug
created_at: 2026-08-10T03:55:00Z
updated_at: 2026-08-10T03:55:00Z
---

Branch `claude/prepare-merge-stale-lean-ci-2026-08-10`.

The `prepare-merge` gate told agents to dispatch qou's `lean_ci.yml`. That file
was deleted in qou's workflows migration ("Finalize GitHub workflows migration
and Phase 4 cleanup"), so the gate named a workflow that does not exist.

**Found by following it.** Running prepare-merge this session, I looked for
`lean_ci.yml`, found nothing by that name, guessed `build.yml`, and dispatched
that — it is a *publish* workflow, not a Lean build. Guessing a workflow name is
how this gate gets skipped while appearing to have run.

Two facts the gate should have carried and did not:

- **Every workflow in qou is `workflow_dispatch`-only**, by an owner directive
  of 2026-06-30 over Actions billing. Nothing runs on push or PR, so "CI is
  green" is never true by default — only ever true because someone dispatched
  it. The gate's own cautionary tale (Lean CI last ran 2026-04-25, 37 modules
  silently stopped compiling) is the *expected* state of a dispatch-only repo,
  not a freak occurrence.
- **Several workflows document a local equivalent in their own header** —
  `bun run content/pipeline/lean-orphan-audit.ts --diff <changed .lean>`,
  `python3 scripts/probe-float64-guard.py --diff <changed .py>`. An agent that
  cannot dispatch (403 without `actions: write`, which is what I hit) can still
  run the check.

Fixed in both `.claude/skills/local/prepare-merge.md` and
`.claude/commands/prepare-merge.md`: find the workflow by reading
`.github/workflows/`, never by name; the real names as of today; the
dispatch-only fact; and the local equivalents.

Names in a skill rot silently, and this one rotted into an instruction to guess.
