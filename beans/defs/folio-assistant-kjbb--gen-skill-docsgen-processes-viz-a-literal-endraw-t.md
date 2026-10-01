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
- [ ] shared helper in cat-harness/scripts/lib/
- [ ] gen-skill-docs and gen-processes-viz use it
- [ ] test proves an embedded closing tag survives as literal text
- [ ] gates green
