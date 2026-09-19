---
$schema: folio-memory/v1
id: tmpdir-fixtures-cannot-exercise-repo-root-resolution
label: stable
summary: "a mkdtemp fixture is outside every instance root, so it cannot test anything using findContentRepoRoot"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
A check that has stopped working still passes such a test, because the test
never reaches the path that broke. Measured 2026-09-19: every pre-existing
`no-orphan-sidecar` fixture was `mkdtemp`, so none noticed that check becoming a
no-op returning a clean bill of health.

Build a miniature folio and `process.chdir` into it, restoring in `finally`.
Stubbing the root is worse than nothing — the test then agrees with the code by
construction.
