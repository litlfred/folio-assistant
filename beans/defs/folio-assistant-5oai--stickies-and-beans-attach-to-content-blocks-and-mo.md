---
# folio-assistant-5oai
title: 'Stickies and beans attach to content blocks, and move between them — the relation is declared in prose and absent from the schema'
status: todo
type: task
priority: normal
created_at: 2026-09-19T10:57:53Z
updated_at: 2026-09-19T10:57:53Z
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
