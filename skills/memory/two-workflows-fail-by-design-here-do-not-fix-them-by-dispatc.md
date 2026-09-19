---
$schema: folio-memory/v1
id: two-workflows-fail-by-design-here-do-not-fix-them-by-dispatc
label: trap
summary: "two workflows fail BY DESIGN here; do not \"fix\" them by dispatching"
createdAt: 2026-09-19
agents:
  - ci-health-watcher
---
`witness-refresh.yml` and `qa-sweep.yml` failed to **parse** on 2026-08-07 —
which is why GitHub ran them on `push` despite both being
`workflow_dispatch`-only, and why their runs are named by path rather than by
`name:`. They were fixed the next day. They only run on dispatch and the
report only reads the default branch, so nothing will ever run them here
again. Bean `lq7e`.

Both would fail if you *did* dispatch them, because the platform carries no
folio: `qa-sweep` preflights on `content/package.json` and `witness-refresh`
needs `folio-assistant/computations/`.

Without rule 3 these two would be red forever. That is what rule 3 is for.
