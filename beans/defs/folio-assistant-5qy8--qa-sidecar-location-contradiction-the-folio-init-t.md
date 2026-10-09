---
# folio-assistant-5qy8
title: 'QA SIDECAR LOCATION CONTRADICTION: the folio_init template commits *.qa.json while AGENTS.md puts QA on the qa-reports branch'
status: completed
type: bug
priority: normal
created_at: 2026-10-04T15:10:09Z
updated_at: 2026-10-09T15:40:00Z
parent: folio-assistant-3fva
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. The owner ruled 2026-10-04 for qou: use the cat-harness qa-reports branch. The folio_init template (cat-harness/templates/) still writes a layout that commits sidecars on main. Reconcile the template with skills/sdlc/sdlc-core/qa-reports.md.

## Closed 2026-10-09

Reconciled `folio_init` templates and generated guidance with `skills/sdlc/sdlc-core/qa-reports.md` (derived QA verdicts stored on orphan `qa-reports` branch, authored judgements on `main` in `test/attestations/`, working copy in `test/results/` machine-written and not committed to `main`).

- **Worktree branch**: `claude/5qy8-qa-sidecar-location`
- **Commit**: `97272f89a45ecfa39f93ea2cc2622cbf19ad3278`
- **Changes**:
  - `templates/document/github/workflows/qa-sweep.yml`:
    - Updated docblock and comments to clarify that QA sidecars produced in working copy under `test/results/` during sweep are checked for schema sanity for the `qa-reports` branch and not committed to `main`.
  - `scripts/init-folio.ts`:
    - Updated generated README/AGENTS layout: `test/results/block-qa/` documented as machine-written working copy published to `qa-reports`, and added `test/attestations/` for reviewer judgements and baseline attestations committed on `main`.
    - Removed outdated instruction "Commit those files with the edit they are about"; reconciled with `qa-reports.md` policy.
  - `scripts/tests/init-folio-qa.test.ts` & `scripts/tests/init-folio.test.ts`:
    - Verified against updated text and layout.
- **Verification Evidence**:
  - `bun test scripts/tests/init-folio-qa.test.ts`: 2 pass, 0 fail (2.45s).
  - `bun test scripts/tests/init-folio.test.ts`: 44 pass, 0 fail (5.00s).
  - Combined suite: 46 pass, 0 fail (7.00s).
  - `bun run typecheck`: 0 errors (clean).
