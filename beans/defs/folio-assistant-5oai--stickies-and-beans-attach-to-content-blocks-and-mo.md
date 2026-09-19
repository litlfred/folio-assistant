---
# folio-assistant-5oai
title: 'Stickies and beans attach to content blocks, and move between them — the relation is declared in prose and absent from the schema'
status: todo
type: task
priority: normal
created_at: 2026-09-19T10:57:53Z
updated_at: 2026-09-19T11:29:23Z
---

## The ask, owner 2026-09-19 (verbatim)

> stickies can be moved between content blocks e.g. with in same page or
> dropped onto a new page (and be global at top of page). it can be duplicated
> to be dropped (never duplicated) onto another content block. todo (and beans)
> maintain their relations with content blocks. same behavioru applies to
> beans. add transfer, move, skills, etc. as part of maintianing or restarting
> behavioru when off track (beans can be used as an adut log of what happened
> with agent as they moved through )

## The blocker, measured 2026-09-19 on `main` at `ed3cf127`

**The relation this bean is about does not exist.**
`schemas/todo-graph.ts:90` declares, in prose, that *"a `feedback` todo is
raised against a specific block and carries the submitter's identity"*, and
`TODO_NODE_KINDS` distinguishes `todo-items` from `todo-feedback`. But
`schemas/todo.ts` carries **no block field at all** — `grep -n 'block'` over it
returns one hit, in an unrelated comment. `schemas/bean-graph.ts` has none
either.

So a feedback todo cannot say which block it is against, and **you cannot move
a sticky between blocks when nothing records which block it is on.** Everything
else here is downstream of fixing that.

Some drag machinery already exists — 23 `drag`/`drop` occurrences in
`docs/folio-assistant/assets/js/docs-ui.js` — so the panel is not starting from
nothing on the interaction side.

## One reading I want confirmed

**"it can be duplicated to be dropped (never duplicated) onto another content
block."** My reading: **a drop is a MOVE and never an implicit copy.**
Duplication is a separate, explicit action that mints a new sticky, which you
then drop. The parenthetical is guarding against drag-to-copy — the behaviour
where dragging silently leaves the original behind and you end up with two
stickies saying the same thing on two blocks, with no way to tell which is
live. Say if you meant something else.

## Scope, in two phases — splittable if you would rather

**Phase 1 — the relation and its operations.** A todo and a bean each carry an
optional anchor: which block, or **page-global** (the "global at top of page"
case, which is an absence of block rather than a special block). Operations:
**move** (re-anchor, one owner at all times), **transfer** across pages, and
**duplicate** as an explicit mint. The anchor survives the move — that is what
"maintain their relations" means, and it is the part a naive implementation
loses by re-creating rather than re-anchoring.

**Phase 2 — process recovery and audit.** Skills for transfer/move, wired into
[`process-state`](../../skills/folio-core/process-state.md), whose five
detectors for "you are out of process" and whose recovery already stop at
*"say what you concluded, and confirm it with the user before resuming"*. The
owner's point is that **a bean is the audit log of that movement** — where the
agent went, what it re-anchored, what it concluded on the way back. That makes
the recovery reconstructible by the next session instead of narrated once in a
chat that is gone.

## Done when

- [ ] the duplicate-vs-move reading is confirmed or corrected
- [ ] `Todo` and the bean schema carry a block anchor, with **page-global as a
      real third state** rather than a sentinel block id
- [ ] `todo-graph.ts`'s prose claim is either true or removed — it has been
      asserting an unimplemented relation
- [ ] move / transfer / duplicate exist, with a test proving a move **re-anchors
      rather than re-creates** (the id survives)
- [ ] a drop never implicitly duplicates, proved by a test that would fail if it
      did
- [ ] `process-state` names the transfer/move skills in its recovery path
- [ ] a worked example of a bean read back as an audit trail of one off-track
      recovery

## Relation to `iurf`

[`iurf`](folio-assistant-iurf--themedtodo-a-themed-sticky-content-type-in-cat-har.md)
is the **presentation** half — themes, CSS tokens, the three layouts. This is
the **semantics** half — what a sticky is attached to and what moving it means.
They share the sticky panel and nothing else, which is why they are two beans;
say the word and they merge.

_2026-09-19T11:25:16Z_ — READING CONFIRMED by the owner 2026-09-19: a drop is always a MOVE, never an implicit copy. Duplication is a separate, explicit action that mints a new sticky, which you then drop. The 'Done when' item asking for this confirmation is settled; the item requiring a test that a drop never implicitly duplicates stands as written.

_2026-09-19T11:27:55Z_ — FIRST REAL CONSUMER, owner 2026-09-19: 'i want that the current landing page is a themetodo attached to node.' That is this bean's PAGE-GLOBAL case with a concrete instance rather than a hypothetical one, which is worth a lot — it means the anchor design gets built against something real. Reading to confirm before building: the landing page carries a ThemedTodo anchored page-globally (the 'global at top of page' state from the original ask), attached to the landing page's own node rather than to a block within it. Note this makes page-global a REAL requirement rather than an edge case, and it settles a design question the bean had left open: page-global cannot be a sentinel block id, because the landing page has no block to point at. It is an absence of block, as the bean already proposed. Depends on iurf (ThemedTodo exists, PR #405) and on this bean's Phase 1 anchor field.

_2026-09-19T11:28:46Z_ — LANDING COMPOSITION, owner 2026-09-19: 'the cat-harness defintiion should be a sticky note. the markdown display can be the text without the grumpy cat. grumpy cat is a note on that.' This INVERTS what ships today, and the inversion is the point. Today harness.json's landing images draw the description INSIDE the cat's thought-cloud — each of landing-laptop/mobile/card carries its own textRegion because the crop differs, and the text is composited into the artwork. The ask separates them: the DEFINITION is the sticky (markdown, text alone), and the GRUMPY CAT becomes a note attached TO that sticky rather than the frame it sits in. The definition text is a derivation chain, not a sentence: 'computable adjudication and agentic test harness' then caaat-harness, ca&at-harness, .c&at-harness, c@t-harness. Rendering it as markdown in a sticky means it stays selectable, translatable and readable by a screen reader, none of which is true of text baked into a webp. That is a real accessibility gain and probably the strongest argument for the change. Note the theme named grumpy-cat already exists from iurf — worth checking whether the cat note should default to it. Open question for the owner: does the cat note carry the IMAGE, or is it a text note about the mark with the image staying page chrome?

_2026-09-19T11:29:23Z_ — CORRECTION to my note above, measured rather than assumed. I claimed rendering the definition as markdown would be an accessibility GAIN over 'text baked into a webp'. That is WRONG — docs/folio-assistant/_includes/landing.html already renders it as real markdown ('{{ h.description | markdownify }}'), and the artwork is already alt="" aria-hidden="true" with a comment stating why: 'every word it carries is in the overlay below, as real text.' The text is composited OVER the image by CSS using each layout's textRegion, not INTO it. So it is already selectable, translatable and screen-readable, and there is already a folio-landing--plain branch that renders the description with NO image at all — which is close to what 'the markdown display can be the text without the grumpy cat' asks for. What is actually missing is narrower and cheaper than I said: the description is not a ThemedTodo, and the cat is not a NOTE ATTACHED TO IT — it is page chrome selected by media query. The work is to make the definition a sticky anchored page-globally and re-express the artwork as an attached note, not to rescue text from an image. I am leaving the wrong note above rather than deleting it, so the next reader can see the claim and the correction together.
