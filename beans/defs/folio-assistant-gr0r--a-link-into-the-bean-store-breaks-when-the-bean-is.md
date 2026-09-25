---
# folio-assistant-gr0r
title: A link into the bean store breaks when the bean is ARCHIVED — the path moves, nothing re-points it
status: todo
type: task
created_at: 2026-09-25T16:21:47Z
updated_at: 2026-09-25T16:22:33Z
---

Found 2026-09-25 while closing `mi97`'s bean-store box.

`docs/translation-support.md` links four beans. Three are in `beans/defs/`;
`folio-assistant-p2en` is `completed` and lives in `beans/defs/archive/`, so
the link written when it was open now points at nothing.

**This is not a typo, it is a shape.** Completing a bean MOVES its file, and
every reference to that file — from a document, an issue, a commit message, a
sibling bean — silently rots at the moment the work finishes. The references
that matter most are the ones written when a bean was live, which is exactly
when the move has not happened yet.

The repository already forbids deleting a bean, for the neighbouring reason:
a deleted bean leaves a sibling unable to tell abandonment from accident. An
archived one leaves a reader unable to tell "finished" from "gone".

## Done when

- [ ] A bean is addressable by ID, not by path — one URL shape that resolves
      whether the bean is open, completed or archived. The site already
      publishes `assets/beans/index.json`; a redirect page per id, or a
      resolver over that projection, is the smallest thing that works.
- [ ] The four links in `docs/translation-support.md` use it. They are GitHub
      blob URLs today, which is honest (the file really is there) and still
      breaks on the next archive.
- [ ] A check catches the next one. `check:subgraphs` cannot: the bean store
      is not a renderable graph and a blob URL is not a link it resolves.

## Not urgent, and say why

One broken link, on a page nobody has complained about. What makes it worth
filing is that the breakage is CAUSED BY COMPLETING WORK, so it accumulates
exactly in proportion to how much gets done.
