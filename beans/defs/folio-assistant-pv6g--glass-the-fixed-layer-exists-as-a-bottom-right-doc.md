---
# folio-assistant-pv6g
title: 'GLASS: the fixed layer exists as a bottom-right dock, not a surface a note is placed on'
status: todo
type: bug
priority: high
created_at: 2026-09-21T17:28:39Z
updated_at: 2026-09-21T17:31:42Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-21: "stickies can detach from the panel and placed on the 'display window/glass' and dont scroll when the folio/document/page scrolls. when closed tehy returned to their home display panel."

CORPUS CHECK. The layer EXISTS and is already fixed — docs-ui.css:2263, '.fa-sticky-layer { position: fixed; inset: auto 1rem 1rem auto; width: min(22rem, calc(100vw - 2rem)) }'. So 'does not scroll' is already true. What is missing is that it is a DOCK, not a GLASS: every pinned sticky lands in one bottom-right column at no position of its own, which is exactly the second half of ivfw (#558) — 'you cant move around dispaly'.

Also missing and NOT anywhere in the corpus: a sticky's HOME PANEL. Nothing records where a detached sticky came from, so 'when closed they returned to their home display panel' has no field to return to. Note this is a THIRD sense of the words 'sticky panel' — see 6lb8 section 6, where the sticky panel is the per-content-node list of every sticky attached to that node. Those are different objects and the owner flagged the conflation: 'there are some different context being conflated maybe'.
