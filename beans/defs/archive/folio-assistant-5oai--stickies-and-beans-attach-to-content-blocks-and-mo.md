---
# folio-assistant-5oai
title: Stickies and beans attach to content blocks, and move between them — the relation is declared in prose and absent from the schema
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:57:53Z
updated_at: 2026-09-19T13:01:27Z
parent: folio-assistant-8jt6
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
[`process-state`](../../../cat-harness/skills/workflow/process-state.md), whose five
detectors for "you are out of process" and whose recovery already stop at
*"say what you concluded, and confirm it with the user before resuming"*. The
owner's point is that **a bean is the audit log of that movement** — where the
agent went, what it re-anchored, what it concluded on the way back. That makes
the recovery reconstructible by the next session instead of narrated once in a
chat that is gone.

## Done when

- [x] the duplicate-vs-move reading is confirmed — owner, 2026-09-19: a drop
      is always a MOVE; duplication is a separate explicit action
- [x] `Todo` carries a block anchor, with **page-global as a real third state**
      rather than a sentinel block id — `schemas/note-anchor.ts`, reached by
      `TodoNodeSchema` through `CarriedNoteSchema`
- [x] **beans carry NO anchor** — owner's rule, 2026-09-19. A bean records that
      a move happened (a note, which `bean-link.ts` already writes); it is not
      itself pinned to a block. Done when the rule is written where somebody
      about to "finish the job" will read it, and guarded.
- [x] `todo-graph.ts`'s prose claim is corrected — neither "true" nor
      "removed" but ACCURATE: the items/feedback split is a filing convention,
      not a schema distinction, and the comment now says so
- [x] move / transfer / duplicate exist, with a test proving a move **re-anchors
      rather than re-creates** (the id survives). **`transfer` is not a third
      function**: dropping a sticky onto a new page IS `moveNote` to a `page`
      anchor, and a second name calling the first would be two spellings of one
      concept — the drift this repo keeps paying for. If transfer later means
      something move does not (crossing documents, say), it earns its own name
      then.
- [x] a drop never implicitly duplicates, proved by a test that would fail if
      it did — `duplicateNote` cannot be called without naming the copy
- [x] `process-state` covers artefact movement in its recovery path — as a
      new section rather than a mention, because the gap was bigger than the
      item assumed: recovery reconstructed WHERE you were and never WHAT you
      re-anchored
- [x] a worked example of a bean read back as an audit trail — this bean's
      own 2026-09-19 premise-correction, in `process-state.md`

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

_2026-09-19T11:33:03Z_ — CORRECTION TO THIS BEAN'S OPENING PREMISE — it is wrong, and materially. I wrote that 'schemas/todo.ts carries no block field at all'. It does, by inheritance: TodoNodeSchema extends CarriedNoteSchema, and carried-note.ts:234 declares 'targetLabel: z.string().optional()' with the comment 'Block label this is attached to, when it is attached to one.' I grepped the file and not the base it extends. Worse, the field is LIVE, not merely declared: test/sticky-todos.e2e.ts exercises it with sec:page-one, sec:page-two and an ORPHAN case sec:nowhere, so block attachment already works end to end. Second time this session I have asserted an absence without checking composition — the first was claiming the landing page bakes text into an image when it renders markdown over it. The pattern is mine to watch: grep the file, miss the base. WHAT IS ACTUALLY MISSING, re-measured 2026-09-19: (1) targetLabel is a LABEL, not a node id, and its absence conflates 'unattached' with 'page-global', so page-global still needs a real third state rather than undefined; (2) BEANS have no anchor at all — bean-graph.ts declares the graph, not the node, and beans do not extend CarriedNote, so 'same behaviour applies to beans' is genuine new work; (3) there are no move / transfer / duplicate operations. The bean is smaller on (1) and unchanged on (2) and (3).

_2026-09-19T11:33:03Z_ — OWNER ANSWER 2026-09-19 to the open image question: 'a note can hold the image as part of its theme. and can be associate to other content nodes whch jave their own avatars (see sibling?).' So the image belongs to the THEME, not the note body — which fits iurf cleanly, since a Theme is already the thing that carries presentation and a note already references a theme by id. Theme gains an avatar/image; the note gains nothing. And notes associate to other content nodes that have THEIR OWN avatars, so an avatar is a property of a node generally rather than of stickies. Measured: NO avatar concept exists anywhere — no hit for 'avatar' in schemas/, src/, skills/ or harness.json. harness.json's images[] carries a free 'role' (mark, browser-icon, landing), which is the nearest existing shape and a plausible home. Open: '(see sibling?)' is unresolved — I could not find a sibling PR or bean introducing avatars. If it names one, point me at it rather than letting me invent a second vocabulary for the same thing.

_2026-09-19T11:35:35Z_ — '(see sibling?)' RESOLVED as far as this checkout can. No open PR in folio-assistant introduces avatars — checked all 7 open PRs (#407, #403, #391, #386, #231, #229, #210), none mentions them. So it is not a sibling PR. The reading that does hold up: harness.json ALREADY gives this instance an avatar — 'icon: "mark"' resolving to an images[] entry with role 'mark' (the c@t mark), alongside role 'browser-icon' and three 'landing'. A SIBLING INSTANCE — another folio built on this platform — declares its own the same way. So 'other content nodes which have their own avatars (see sibling?)' reads as: a node's avatar works like an instance's mark, see how a sibling has one. CONSEQUENCE FOR THE BUILD, and it is the useful part: reuse images[].role rather than invent an avatar vocabulary. The shape exists at INSTANCE level and the ask extends it to CONTENT NODE level; a new parallel field would be two spellings of one concept, which is the drift this repo keeps paying for. Flagging rather than asserting: if 'sibling' meant something else, say so before the avatar work starts.


_2026-09-19_ — OWNER RULE, verbatim: "beans no anchor. no change bean schema. RULE." This OVERRIDES my own re-measurement two notes up, which listed "BEANS have no anchor at all ... so 'same behaviour applies to beans' is genuine new work" as item (2) of what is missing. It is not work; it is a boundary. The reading that holds: a bean says WHAT IS BEING WORKED ON, a sticky says WHERE A NOTE SITS ON A PAGE. The original ask's "same behaviour applies to beans" is answered by its own next sentence — "beans can be used as an audit log of what happened with agent as they moved through". A bean RECORDS that a move happened; it is not itself a thing pinned to a block. So a move is written to a bean as a NOTE, which workflow/bean-link.ts already does with its `note` op and which needs no new field. Two practical reinforcements for the next agent tempted to "finish the job": giving a bean an anchor would put a rendering position into the work plan, the same conflation schemas/theme.ts already refuses for themed todos; and a bean's front matter is written by a THIRD-PARTY CLI this repo does not own, so a field added here is one nothing guarantees survives a round-trip. Recorded in schemas/note-anchor.ts module docs under "Beans get NO anchor" and guarded by a test, because a rule that lives only in a bean note is a rule the next agent does not find. No bean schema was touched — the rule arrived before I had built that half, so there is nothing to undo.


_2026-09-19_ — "todo-graph.ts's prose claim" RESOLVED, and the answer is a third option this bean did not offer. The Done-when said "either true or removed". It is now ACCURATE instead, which is better than both. What I found: BOTH halves of the claim are available — the block anchor (targetLabel, plus the new NoteAnchorSchema) and identities[] are declared on CarriedNoteSchema, which TodoNodeSchema extends. So the claim is not describing something unimplemented. But there is exactly ONE TodoNodeSchema, and the kind is a property of the DIRECTORY a note lives in, not of the note. Nothing requires a `feedback` todo to name a block or a submitter, and nothing stops an `items` todo from doing both. So the sentence described a FILING CONVENTION in the voice of a CONSTRAINT. That is why it misled twice in opposite directions: first as evidence the relation was enforced, then as evidence it did not exist at all (this bean's opening premise, already corrected above — I grepped schemas/todo.ts and not the base it extends). The comment now states the convention as a convention, names where the two fields actually live, and says that keying a refinement on kind is what enforcement WOULD look like and does not exist today. Verified: eslint clean, tsc clean, schemas/todo-graph.test.ts 11 pass 0 fail. No behaviour changed — this is a comment that stops lying.


_2026-09-19_ — FINAL TWO ITEMS DONE, and the load-bearing finding is one neither item anticipated: **A MOVE IS NOT SELF-DOCUMENTING.** moveNote returns the note with its new anchor and nothing about the old one, so a sticky re-anchored during an off-process detour leaves NO TRACE IN THE ARTEFACT — no field to read back, no diff separating "moved deliberately" from "moved by an agent that had lost the thread", and, because a move keeps the id, nothing that even looks unusual. The only possible record is what was written to a bean at the time. That is what makes the owner's beans-no-anchor rule load-bearing rather than merely tidy: a bean is not a thing pinned to a block, it is the record that a pinning CHANGED. I checked my own falsification condition from the opening brief and it half-fired: the recovery path IS about process position only (branch name, claimed bean, opening brief, all pinning WHERE you were), so I nearly reported "wrong home". It is the right home — step 2 is explicitly "reconstruct from context", and a move log is that context — but the gap was a SECTION rather than the mention the Done-when item asked for. Three recovery instructions added: name every note you re-anchored with its anchor before and after, read off the bean trail rather than the notes which no longer know; if the trail is silent and you moved things, SAY SO, because a gap is a finding while "everything is fine" is unrecoverable; and do not move anything back on your own judgement, since re-anchoring to undo is another unlogged move made to cover one. CONSIDERED AND REJECTED, recorded in the skill: a `movedFrom` field on the note would make a move self-documenting and remove the need for all of this. Not taken — the history would then live in the artefact being moved, so a note deleted or handled by a tool that does not maintain the field takes its own audit trail with it. A bean is a SEPARATE record, which is what an audit trail has to be. WORKED EXAMPLE: this bean's own premise correction, chosen because what makes it usable is that the WRONG CLAIM WAS LEFT IN PLACE with the correction beside it — read back, it shows premise, disproof and re-scoped work in order, so a resuming agent sees the framing was abandoned and why. A bean tidied to show only the correct conclusion would read as though the work had always been aimed there, which is the failure bean-coordination names when it says unwanted work is scrapped WITH ITS REASONS. Verified: kg:audit sidecar regenerated, process-state passes all three criteria (skill-is-brief, skill-not-a-document, skill-no-repeated-heading) at 178 lines; kg:audit:check rc=0; check:agents-xref rc=0; check:voices clean; skill-instruction docs mirror regenerated; full suite 2502 pass 0 fail.


_2026-09-19_ — MERGED in PR #408 (0d18db3a), all eight Done-when items ticked. Closing. What shipped: the three-state anchor (schemas/note-anchor.ts) reached by TodoNodeSchema through CarriedNoteSchema; page-global as a real state carrying its page, and an ABSENCE of block rather than a sentinel; moveNote re-anchoring while keeping the id; duplicateNote requiring the caller to name the copy so a drop and a duplication cannot be confused at a call site; beans carrying NO anchor per the owner's rule, guarded by a test that was checked red against a deliberate violation; todo-graph.ts's prose claim corrected to ACCURATE rather than "true or removed" (the items/feedback split is a filing convention, not a schema distinction); and process-state.md's recovery section for artefacts moved off-process, whose load-bearing fact is that A MOVE IS NOT SELF-DOCUMENTING — moveNote returns the note with its new anchor and nothing about the old one, so a bean note is the only possible record. That is what makes the beans-no-anchor rule load-bearing rather than tidy. NOT in this bean and still open elsewhere: the landing page as a page-global ThemedTodo, and avatars on content nodes reusing images[].role — both were queued on this bean's notes but are composition work that depends on the anchor rather than being part of it. They need their own bean if they are to be done.
