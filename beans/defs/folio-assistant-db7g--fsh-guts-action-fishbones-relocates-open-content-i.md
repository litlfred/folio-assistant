---
# folio-assistant-db7g
title: 'FSH-GUTS ACTION: [fishbones] relocates open content into fsh-guts, behind a confirm that names the scope'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T21:46:57Z
updated_at: 2026-09-21T12:48:42Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R11. Unit 7 of 10.

The owner: *"confrim arctions [fishbones] on open content puts in fsh guts"*, and
**CRDM Q5, answered: relocate the content itself — delete becomes move.**

This is `t0i3`'s founding rule reaching the board: *"do not delete unless explicit
confirm. goes to fsh-guts."* `fsh-guts` is already the declared non-rendered
graph — addressable, exported, greppable, off the site — and `7vhe` already has the
dead-fish icon with a node counter.

**There is a precedent to follow rather than a mechanism to invent.** `d1r6`
(completed) already discards a STICKY to fsh-guts behind a crumpled-sticky icon.
This generalises that to any open content, and the two should share one path rather
than growing a second answer.

**The confirmation is the requirement, not the polish.** The action is durable and
folio-wide: the content leaves the render pipeline everywhere, not just on this
board. The dialog must SAY that — `deletion-requires-confirmation` asks for what
would go, and a dialog that says "remove?" when it means "unpublish everywhere" is
the failure that rule exists to stop.

## Done when

- [~] `[fishbones]` on an open window relocates the content — SEE BELOW. The reader-facing
      half is built; the durable repo move is not a published page's to make.
- [x] a confirm dialog that names the scope — and names what it does NOT do, which is the
      half this surface could otherwise lie about
- [x] one relocation path shared with `d1r6`'s sticky discard, not a second one
- [x] the fsh-guts counter (`7vhe`) reflects it
- [x] nothing is ever removed without the confirm — asserted, not assumed

## Summary of Changes

`relocate` is a declared control in `schemas/panel-chrome.ts`, offered by `todo`,
rendered with the owner's fishbone glyph and a worded accessible name. Confirming
takes `d1r6`'s existing path: the same function, the same `localStorage` key, the
same `fa:todos-discarded` event the trashcan counter already listens to. One path,
not a second answer — two stores would have been two counts of one thing.

**The confirm is the requirement, and the failure cuts both ways.**
`deletion-requires-confirmation` names one: a dialog that says *"remove?"* when it
means *"unpublish everywhere"*. The same lie pointed the other way is just as bad,
and it is the one THIS surface could tell. So the dialog says two things and both
are asserted: what the action does (takes the card off this browser's board,
reversibly, from the trashcan tile) and what it does NOT (move the content out of
the folio).

Escape cancels and never confirms — a dialog whose dismissal performs the action is
a dialog that did not ask. Focus lands on the safe choice, so a reader who hits
Enter without reading has left the content where it is.

## The first Done-when line could not be met, and here is why

**A published static page cannot move a file in the repository.** `d1r6`'s discard
has always been browser-local `localStorage`, and the existing UI says so in as many
words — *"Discarded in this browser only — saved here, not sent anywhere, and not
discarded for anyone else."* The fsh-guts tile already lists the repo's real
`fsh-guts/` nodes SEPARATELY, with a comment explaining that listing them together
unlabelled *"would tell a reader they had cleared something for the team"*.

So the durable half — *"off the site, everywhere"* — needs an agent or a tool acting
against the repository, which is what `board-relocate.bpmn` already draws: its
`A_MoveContent` is in the renderer/platform lane, not the reader's. The reader-facing
half is built and the gap is NAMED IN THE DIALOG rather than papered over. Put to the
owner as a question rather than decided here.

## The drift guard earned its keep

Adding `relocate` to the model and forgetting the client mirror failed eleven of
twelve fishbone specs at once — the control simply never appeared. That is exactly
the drift `panel-chrome.e2e.ts` was written to catch between `schemas/panel-chrome.ts`
and `docs-ui.js`, which cannot import it, and it caught it on the first change after
it was written.

`bun run gates --all` — 88/88, 266 e2e.
