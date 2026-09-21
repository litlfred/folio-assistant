---
# folio-assistant-q2wm
title: 'RENDER SAFETY: declared XSS hints on tools and skills, lazy loading, and dynamic render from the graph'
status: todo
type: task
priority: high
created_at: 2026-09-20T21:47:28Z
updated_at: 2026-09-20T21:47:28Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R17. Unit 10 of 10.

The owner, 2026-09-20: *"skill tool hints for XSSrsiction., usse laxy load XSS,
assume assets in KG accessible, dynamic render where can"*.

Four instructions, and the first is the one with teeth: **a skill or tool that
renders anything declares what it may render.** Today nothing in a Tool node says
whether its output is trusted markup, escaped text, or a sandboxed embed — so every
consumer decides, and the one that decides wrong is a cross-site scripting hole in a
static site that otherwise has no server to blame.

| | |
|---|---|
| **XSS hints** | a declared restriction ON THE TOOL/SKILL: what it may emit, and what a renderer must escape or sandbox |
| **lazy load** | a board of avatars must not fetch every content body up front; a window fetches when it opens |
| **KG assets** | assume assets reachable from the knowledge graph are ADDRESSABLE — no copying into the page, no second store |
| **dynamic render** | render from the declared graph at view time wherever it can be, rather than baking HTML at build time |

**The hint is DECLARED, not documented.** A rule a renderer has to know from prose
is the consumer-burden failure this issue already found twice — in `targetLabel`
and in `folio-todo-index/v1`. A restriction nothing can read is not a restriction.

## Done when

- [ ] a declared XSS/render restriction on Tool and skill nodes, with a default that is the SAFE one
- [ ] a renderer that ignores the hint fails a test rather than shipping
- [ ] window content is fetched lazily, on open
- [ ] KG assets are referenced where they live
