---
# folio-assistant-kjbb
title: 'gen-skill-docs/gen-processes-viz: a literal endraw tag in source text closes the page''s raw block early'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-01T08:00:11Z
updated_at: 2026-10-01T08:11:49Z
parent: folio-assistant-2upx
---

Both generators wrap emitted text in one Liquid raw block. A skill or BPMN documentation string containing the literal raw-block closing tag ends that block early; what follows is parsed as Liquid and can break the Pages build (it broke staging once, per a9tx §HANDOVER). Fix: one shared helper that escapes the closing tag inside the wrapped text, used by both generators, with a test.

## Done when
- [x] shared helper in cat-harness/scripts/lib/
- [x] gen-skill-docs and gen-processes-viz use it
- [x] test proves an embedded closing tag survives as literal text
- [ ] gates green: blocked by `main`, not by this change. On 2026-10-01, 24 of 201 gates failed locally, and each of those gates fails on a clean worktree of `main` `cdb0a018` too (#1760's skill moves). Tick this once `main` is green.


## Status 2026-10-01

The fix is in PR #1766: `scripts/lib/liquid-raw.ts`, used by both generators, plus 10 tests including a strict Ruby Liquid round-trip. The staging build compiled every generated page through Jekyll. The PR stays draft until `main`'s own red gates are fixed.
