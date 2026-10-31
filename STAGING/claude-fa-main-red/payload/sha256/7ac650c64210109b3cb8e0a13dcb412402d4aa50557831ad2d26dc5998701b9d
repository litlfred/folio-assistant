---
name: folio-board-windows
description: >-
  The content-folio half of the harness's board-windows skill: binds
  processes/ui/board-open-close.bpmn, folio-glass pinning (todo/<id> and
  landing/<slot>), and content-type card chrome ([x], [linksrc], [edit]).
adapters: [document, paper, dak]
profiles: [document, paper]
---

# Folio board windows and glass pinning

The harness skill [`board-windows`](../../../../cat-harness/skills/ui/ui-core/board-windows.md)
defines the separation between semantic zoom and opening a card into a window,
the compact icon row under every sticky, and the confirmed `Send to fsh-guts`
discard flow. For a content folio (`document`, `paper`, or `dak`), apply these
folio-glass and process rules alongside it.

Process: [`processes/ui/board-open-close.bpmn`](../../../processes/ui/board-open-close.bpmn).

## 1. Pinning onto the folio glass

Pinning a sticky toggles it onto the **folio glass** rather than a separate
floating layer:

- **Pin makes the sticky a folio asset** — `todo/<id>` (matching the key the
  glass's Todos panel uses) or `landing/<slot>` — with `shown: true`, drawn by
  the glass's card path and positioned by `placeOnGlass`.
- **Unpin is `shelveFromGlass`** — the entry remains in the folio store so
  re-pinning restores its prior position on the glass.
- **Pressed state comes from the store** (`folioStateOf(key) === "glass"`),
  never from button-local state.

## 2. Content-type window chrome

Each content type controls its own avatar and rendered body, while every open
panel on the folio glass shares the fixed window bar controls (`[x]` to close
back to the avatar, plus `[linksrc]`, `[edit]`, and pin where the underlying
folio block or sticky supports them; omit any control the item cannot serve).
