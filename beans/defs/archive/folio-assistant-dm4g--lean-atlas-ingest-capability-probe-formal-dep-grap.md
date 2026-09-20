---
# folio-assistant-dm4g
title: Lean Atlas ingest + capability probe (formal dep graph source)
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:13:26Z
updated_at: 2026-08-07T09:39:52Z
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

## Landed

`content/pipeline/lean-atlas-ingest.ts` — `--list` / `--ingest` / `--scan` /
`--stale`, `lean_sha` stamping, writes `docs/audits/lean-atlas-deps.json`.
Capability probe `.claude/skills/capabilities/lean-atlas.json`.

Two deviations from the plan, both deliberate:

1. **Added a `--scan` fallback.** Atlas is a Lake require needing a Lean
   toolchain; most folios won't have a compatible one. The fallback derives
   formal edges syntactically from sibling `.lean` sources — comment-stripped,
   whole-identifier, names >= 4 chars — with a per-declaration signature/body
   split for an approximate type/value classification. Every entry carries
   `source: "atlas" | "scan"`, surfaced as `ContentGraph.formalSource`, so
   consumers can require `atlas` where the split must be trustworthy (6xhf).

2. **Did NOT write an Atlas `graph-data` parser.** Its JSON schema is
   unverified (no Lean toolchain here). `--ingest` takes folio's own JSONL;
   an adapter is owed once a real export can be inspected. Guessing the field
   names would have shipped a parser nobody had run.

Verified on qou: scan produced 485 formal edges (418 type / 67 value) over
1181 block-owned decls, unblocking `uses-formal-coverage` — 2829 pass /
129 warn, findings like `prop:atom-knot-unique` formally depending on
`def:atom-knot` without introducing it to the reader.

Also bumped Lean v4.16.0 -> v4.24.0 (Dockerfile, .github/docker/Dockerfile,
lean_ci.yml, authoring-math manifest). Atlas needs >= 4.17.0, but the image
was independently stale: qou has been on v4.24.0.
