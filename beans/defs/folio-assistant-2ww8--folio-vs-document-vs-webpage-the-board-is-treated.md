---
# folio-assistant-2ww8
title: 'FOLIO vs DOCUMENT vs WEBPAGE: the board is treated as a rendering mode, but they are different objects with different sticky chrome'
status: in-progress
type: feature
priority: high
created_at: 2026-09-21T17:28:40Z
updated_at: 2026-09-21T17:37:30Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-21: "let's start with a folio (like miro board, whiteboard, large deskspace) where we represent content. has avataars. start closed ... now... when we get to webpage or document, this is not folio/whiboard, it is a diffent object. there we are adding a sticky tile (minimized/slid awawy to start). if not placed on a document somewhere, they in slide down panel at top with [stikcy] icon to open or so"

CORPUS CHECK. The corpus does NOT make this distinction. mountTodoBoard (docs-ui.js:2775) branches on whether '.fa-landing-board' is present and calls the two cases 'inline' and 'overlay' — a RENDERING MODE of one object, not two objects. board-windows and jtj say the same thing the same way: 'the listing is the ARTEFACT and the board is the overlay'.

The owner is asking for something stronger: folio and document are different KINDS, and the sticky chrome differs by kind — a folio has an edge tile rack, a document has a slide-down panel at the top behind a [sticky] icon. Content-type dispatch already exists for this shape (PaperContentAdapter extends DocumentContentAdapter, adapterForKind must stay total), so the question to settle first is whether folio is an ADAPTER or a PROFILE — see skills/folio-core/content-profiles.md, which carries exactly that question.



## The spec — https://github.com/litlfred/folio-assistant/issues/764

Written 2026-09-21 on the owner's "do spec first". On the ISSUE rather than
in the graph, following 4kq7 / PR #731.

**The question this bean was filed with was mis-posed, and the owner corrected
it rather than answering it:**

> folio is the only visualizer provided by cat-harness, document is its own
> object. they have semantic different meanings=> different
> visaluzation/operations/etc. do spec first.

So folio is neither an adapter nor a profile. It is a THIRD axis — the
VISUALISER — and the adapter/profile pair stays exactly as it is.

**What the corpus already gets right and must not be reopened:** the owner's
"documents are static content, have subclass papers intended for printing so
have more layout resirections" IS the shipped model, in the same direction.
CONTENT_PROFILES = [document, paper], profiles nest, and paper is the narrower
one. No schema change for document/paper.

**Still open, and blocking the document/webpage half:** whether `webpage` is a
fourth axis (static vs interactive, cross-cutting) or a profile that WIDENS
rather than restricts — profiles as defined today only narrow, so "a document
plus interfaces" is not expressible as one. Recorded as O1 on the issue. The
owner's "not a 'pure' distinction. judgement" is normative: the classifier must
be able to answer "could not determine" rather than defaulting.
