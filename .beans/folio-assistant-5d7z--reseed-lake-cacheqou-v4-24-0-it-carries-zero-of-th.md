---
# folio-assistant-5d7z
title: Reseed lake-cache/qou-v4-24-0 — it carries ZERO of the paper's own oleans
status: todo
type: bug
priority: high
created_at: 2026-08-07T12:10:50Z
updated_at: 2026-08-07T12:10:50Z
---

The production cache branch has 7268 oleans, all dependencies, none QOU.*. Every restore still rebuilds the paper, and sibling .lean files cannot elaborate standalone. lake-cache.sh status now detects and reports this.
