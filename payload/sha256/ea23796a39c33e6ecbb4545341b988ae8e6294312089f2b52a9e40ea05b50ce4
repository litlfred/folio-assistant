---
# folio-assistant-rx8k
$schema: bean/1.0.0
title: 'smart-trust: Visual Studio state committed under .vs/'
status: todo
type: bug
priority: low
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T04:10:00Z
parent: folio-assistant-3o2w
---

**Category:** provenance (hygiene). **Rule:** `scz-secrets-never-in-text` (preventive). **Severity:** low.

**Evidence:** smart-trust `496290a` tracks `.vs/ProjectSettings.json`, `.vs/VSWorkspaceState.json`, `.vs/slnx.sqlite` and `.vs/smart-ig-starter-kit/v17/.suo`. These are per-user IDE state (opened files, local paths, a SQLite index) and can carry local paths or other machine data. No secret was found in them by the pattern grep, but they are binary and not reviewable.

**Fix:** `git rm -r --cached .vs` and add `.vs/` to `.gitignore`.
