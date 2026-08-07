---
# folio-assistant-dm4g
title: Lean Atlas ingest + capability probe (formal dep graph source)
status: todo
type: task
created_at: 2026-08-07T09:13:26Z
updated_at: 2026-08-07T09:13:26Z
---


## Ask

Source the **formal** dependency graph so 36f8 can attach Lean structure to
content blocks. Lean Atlas (arXiv 2604.16347, github.com/NyxFoundation/lean-atlas)
is a Lake-integrated CLI that extracts constants + deps and classifies each
edge as a **type dependency** (statement-level) or a **value dependency**
(proof-level), exporting JSON.

## Plan

- `.claude/skills/capabilities/lean-atlas.json` — probe, `requires: ["lean-toolchain"]`.
- `content/pipeline/lean-atlas-ingest.ts` — mirror `lean-compile-audit.ts`:
  `--list` / `--ingest <jsonl>` / `--stale`, `lean_sha` staleness stamping,
  output `docs/audits/lean-atlas-deps.json`.
- Returns `n/a` when no cache exists (same posture as `proof-lean-compiles`).

Verify licensing before vendoring anything.
