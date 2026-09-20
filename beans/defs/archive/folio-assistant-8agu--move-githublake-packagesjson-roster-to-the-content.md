---
# folio-assistant-8agu
title: Move .github/lake-packages.json roster to the content repo
status: completed
type: task
priority: normal
created_at: 2026-08-07T10:44:09Z
updated_at: 2026-08-07T11:31:32Z
---

The roster lives in folio-assistant but its lake-root paths (content/<paper>/lean) only resolve in the content repo, which has no roster at all. Same leak class as n1wp/tqoe. lake-cache.sh works around it by inferring the package from the branch family, but lake-cache-refresh.yml still reads the platform copy.

## Summary of Changes

Roster + both Lean workflows moved to the content repo via litlfred/qou#4678.

Evidence they were misplaced: **zero** `lake-cache/*` branches exist in
folio-assistant; all seven are in qou. `lake-cache-refresh.yml` pushes
exactly those branches and needs `content/<paper>/lean/` to build, so
running it from the platform could only no-op or fail.

folio-assistant side (this repo):
- `lake-cache-restore` action resolves `lake-cache.sh` from either layout
  (repo root, or embedded at `folio-assistant/`).
- `lake-cache-refresh.yml` + `lake-packages.json` annotated as the
  maintained source / a SAMPLE roster respectively.
- No behavioural dependency: `scripts/lake-cache.sh` infers the package
  from the branch family when no roster is present, so restore works with
  zero config either way.
