---
# folio-assistant-n1wp
title: 'build-lean-mcp.yml: resolve Dockerfile build-context mismatch'
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:44:49Z
updated_at: 2026-08-07T11:31:32Z
---


## Problem

`.github/workflows/build-lean-mcp.yml` builds the paper-assistant image —
the active image build — and it cannot succeed as written.

The `file:` path was stale (`scripts/mcp-server/Dockerfile`, renamed to
`adapters/mcp-server/` in the folio migration); that part is fixed. The
remaining problem is the build **context**:

- The workflow uses `context: .` from **folio-assistant**.
- `adapters/mcp-server/Dockerfile` COPYs from the context root:
  `lean-toolchain`, `lakefile.toml`,
  `content/quantum-observable-universe/lean/lakefile.toml`,
  `content/unital-groebner-bases/lean/lakefile.toml`,
  `content/fred2005-formal-groups/lean/lakefile.toml`,
  `tools/hecke-engine/`, `content/package.json`. Every one of those is a
  **content-repo** path — they exist in qou, not in folio-assistant.
- Line ~159 of that Dockerfile still COPYs
  `scripts/mcp-server/package.json scripts/mcp-server/` — the old path,
  from inside the Dockerfile itself.

So the Dockerfile is written to build from the *content* repo root while
the workflow lives in and builds from *folio-assistant*. Neither repo
alone satisfies it.

## Needs an owner decision

Not guessed at in the FIXME. The options:

1. Move the workflow to the content repo (qou), where the COPY paths
   resolve — but then folio-assistant no longer builds its own image.
2. Restructure the Dockerfile to build from folio-assistant, taking the
   content-repo files as build args / a mounted context.
3. Multi-context build (`docker/build-push-action` supports named
   additional contexts) with folio-assistant and the content repo both
   supplied.

Also fix the internal `scripts/mcp-server/package.json` COPY whichever
way this goes.

Blocks: any image rebuild, including picking up the Lean v4.16 -> v4.24
bump on this branch.

## Summary of Changes

Resolved by option 1 (move the workflow to the content repo) — litlfred/qou#4678.

`build-lean-mcp.yml` now lives in qou, where its Dockerfile's COPY paths
(`lean-toolchain`, `lakefile.toml`, `content/<paper>/lean/lakefile.toml`,
`tools/hecke-engine/`) actually resolve, with `file:` pointing at the
embedded `folio-assistant/adapters/mcp-server/Dockerfile`.

Two separate defects were compounding: the stale `scripts/mcp-server/`
path (fixed earlier) AND the build-context mismatch. Either alone broke
the build.
