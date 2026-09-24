---
# folio-assistant-rn3o
title: 'Diagrams: download PNG, download SVG, copy to clipboard on every figure'
status: todo
type: feature
priority: normal
created_at: 2026-09-24T12:41:53Z
updated_at: 2026-09-24T12:45:29Z
parent: folio-assistant-2upx
---

Owner request 2026-09-24. Add three controls to mountFigure's toolbar in docs-ui.js so every diagram (BPMN, UML portrait/landscape, Mermaid) gets them: Download SVG (serialised or the committed file), Download PNG (canvas, scaled, theme colours), Copy (PNG via ClipboardItem, fall back to SVG text, say which). Keyboard-operable, named; e2e test per control. Queued after B5 (#1268) on the same branch.
