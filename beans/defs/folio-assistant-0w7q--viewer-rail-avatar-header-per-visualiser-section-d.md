---
# folio-assistant-0w7q
title: 'VIEWER RAIL: avatar header, per-visualiser section, drop redundant ☰/[x], QA flags (#1757)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T07:25:35Z
updated_at: 2026-10-04T19:55:09Z
parent: folio-assistant-p5wm
---

Owner report 2026-10-01, issue #1757 (session_01Cw8JgZEDT5VqQ5ergjdMjB).

## Done when
- [x] rail header is the instance avatar or initial, clickable pin toggle; ☰ and [x] removed (rail + Jekyll footer)
- [x] NavbarModel carries a per-visualiser section, open by default; Graphs collapsed when present
- [ ] /todos/ visualiser section: todos grouped by attached KG node
- [x] viewer-nav QA flags: header, clickable-mark, visualiser-nav, single-open
- [x] findings from those flags fixed across generated pages


## 2026-10-04 — four of five boxes ticked on evidence; item 3 is the owner's

Re-derived on `main` (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi): `check:viewer-nav` exits 0 over 93 railed pages with 0 flagged. Its `header`, `clickable-mark`, `no-redundant-toggle`, `visualiser-nav` and `single-open` flags all exist (`check-viewer-nav.ts`) and pass, via #1762 and later. Items 1, 2, 4 and 5 are ticked.

**Item 3 (/todos/: todos grouped by attached KG node) is NOT met, by the owner's own ruling.** It was built and then removed (`state-visualizer.ts:824-829`, owner 2026-10-02: *"are not functional for more info or anything"*), because everything it showed is on each sticky and in the floor. Whether to strike the item or rewrite it is the owner's call, so this bean stays `in-progress`. Issue #1757 is still open; closing it is the owner's.
