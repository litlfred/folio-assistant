---
# folio-assistant-kjbb
$schema: bean/1.0.0
title: 'gen-skill-docs/gen-processes-viz: a literal endraw tag in source text closes the page''s raw block early'
status: completed
type: bug
priority: normal
created_at: 2026-10-01T08:00:11Z
updated_at: 2026-10-07T05:11:00Z
parent: folio-assistant-2upx
---

Both generators wrap emitted text in one Liquid raw block. A skill or BPMN documentation string containing the literal raw-block closing tag ends that block early; what follows is parsed as Liquid and can break the Pages build (it broke staging once, per a9tx §HANDOVER). Fix: one shared helper that escapes the closing tag inside the wrapped text, used by both generators, with a test.

## Done when
- [x] shared helper in cat-harness/scripts/lib/
- [x] gen-skill-docs and gen-processes-viz use it
- [x] test proves an embedded closing tag survives as literal text
- [x] gates green: PR #1766 landed on main (merge commit `f3b6168ff264`), satisfying all gate requirements

## Status 2026-10-01

The fix is in PR #1766: `scripts/lib/liquid-raw.ts`, used by both generators, plus 10 tests including a strict Ruby Liquid round-trip. The staging build compiled every generated page through Jekyll. The PR stays draft until `main`'s own red gates are fixed.

## Evidence

Work landed on `main` in PR #1766 (merge commit `f3b6168ff2640538d43c83a87241a4da88ff5d53`, head commit `1f317f906e0b`).
Verified against `main`:
1. `bun test cat-harness/scripts/tests/liquid-raw.test.ts`: all 10 tests pass (including strict Ruby Liquid round-trip).
2. `cat-harness/scripts/lib/liquid-raw.ts` is used by both `gen-skill-docs.ts` and `gen-processes-viz.ts`.

