---
# folio-assistant-loxz
title: 'regen reports audit:coverage:strict current while the artefact on disk differs from what its writer produces'
status: todo
type: bug
parent: folio-assistant-1xhc
priority: normal
created_at: 2026-10-04T12:18:57Z
updated_at: 2026-10-04T12:18:57Z
---
A verify/write pair whose CHECK is a judge-mode baseline rather than a byte comparison cannot detect a stale artefact, and `regen` counts it as `current`. So "0 unrepaired" is not evidence that every generated artefact matches its writer.

MEASURED on the #1898 branch, 2026-10-04, in one worktree, in this order:

1. `regen` run with `fsh-guts/` NOT mounted (main has cut it over, so it is absent from the checkout). It wrote `cat-harness/test/results/audit-coverage.qa-results.json` with `state: "undetermined"` for the fsh-guts row, dropped the `fsh-guts` entry, and `total: 78`.
2. `bun run state:mount` — `fsh-guts` mounted, 147 files.
3. `regen` again. Reported **`113 current, 0 regenerated, 0 unrepaired, 0 with a failing writer`**, settled in one pass. `audit:coverage:strict` among the "current".
4. `bun run audit:coverage` — the WRITER — on that same mounted tree. It rewrote the file: `state: "empty"`, the `fsh-guts` entry restored, `total: 79`. Byte-identical to what `main` carries.

So step 3 declared current an artefact that step 4 proves the writer disagrees with. The stale copy was the unmounted run output, and nothing in the pipeline noticed.

WHY. `audit:coverage:strict` is `audit-coverage.ts --check --strict --against main`: judge mode against a `qa-reports` baseline over three categories — `kinds-unaudited`, `kinds-typed-only`, `gates-undeclared`. It prints *"judge mode, wrote nothing: OK — no finding the gate fails on"* and exits 0. It never asks whether the committed sidecar equals the writer output, so a `state` or `total` that moved is invisible to it. The pair is declared, the check runs, it passes — and it was never the question.

This is the `1xhc` family: a step that did not fire must not look like one that passed. Here it is narrower and worse, because the step DID fire — it just answered a different question than the pairing implies, and `regen`\s summary line reports it in the same column as the pairs that do compare bytes.

Bean `0qjq` is the sibling for CI (a green PR page is not evidence gates RAN — count runs AND distinct names). This is the same defect inside `regen`.

## Done when
- [ ] `regen` distinguishes a pair whose check COMPARES THE ARTEFACT from one whose check is a judge/baseline verdict, and says which in its summary rather than counting both as `current`
- [ ] for the judge-mode pairs, either a byte comparison is added or the pair is declared as not-a-staleness-check (the same honesty `check:viewer-nav`/`check:harness-dirs` already get with "no writer, by declaration")
- [ ] a test writes a stale artefact for one judge-mode pair, runs `regen`, and asserts it is NOT reported as `current`
- [ ] the fsh-guts case specifically: an UNMOUNTED tree must not be able to leave a committed sidecar that a mounted `regen` then blesses
