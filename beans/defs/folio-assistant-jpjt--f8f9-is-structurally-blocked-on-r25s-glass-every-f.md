---
# folio-assistant-jpjt
title: "F8/F9 is structurally blocked on R25's glass: every folio surface today needs just-the-docs furniture"
status: todo
type: feature
priority: normal
created_at: 2026-09-21T23:20:00Z
updated_at: 2026-09-21T23:20:00Z
parent: folio-assistant-6lb8
---

F8/F9: *"the folio visualisation … should by convention be available on any
harness for consistent feel. who-iris, smart-\*, etc are content libraries a
user is browsing and their 'folio' from the cat-harness is consistent across
them."*

## The mechanism is decided. The owner chose it 2026-09-21

Three ways to reach a downstream harness were tabled; the owner chose
**an exported mount fragment plus a gate** — `cat-harness` exports the mount
the way `staging-banner.ts` already exports `FRAGMENT`, a generator calls it,
and a check fails the build for a page that lacks it. Reusing
`bodyInsertionPoint()` rather than writing a second body-finder, because
`ur84` is exactly what a second one would reproduce.

**That decision stands and is not what this bean blocks on.**

## What blocks it, measured rather than assumed

`who-iris` pages are complete standalone HTML from `gen-iris-pages.ts` — their
own `<!DOCTYPE>`, their own `<style>` built from the captured IRIS theme
(*"the stack the captured stylesheet declares, verbatim"*), no Jekyll, no
layout, no `head_custom.html`. That is deliberate: the page is a **faithful
replica**, and the *"ingested copy — not WHO, not live"* banner is its
requirement 1.

Loading `docs-ui.js` there is SAFE — all seven mounts guard themselves and
return without their markers, and `mountFigures` iterates an empty list. The
problem is the opposite one: **nothing mounts.**

| surface | what it requires | on a replica page |
|---|---|---|
| launcher (`mountActionTiles`) | a **sidebar header** — `console.warn` + return without one | absent |
| board (`mountTodoBoard`) | `#main-content` / `.main-content` / `<main>`, inserted **at the top** | absent, and the top is where the IRIS content goes |
| language bar | `.main-content` | absent |

**Every visible folio surface today is bound to just-the-docs page furniture.**
Giving a library page that furniture means making it look like
folio-assistant, which is the one thing who-iris exists not to do.

## Why R25 is the unblock, not a scheduling coincidence

R25 — *"the user in visualization should be able to pull down their folio"* —
is the only folio surface that does **not** require the host page to look like
folio-assistant. A glass comes down OVER whatever is being browsed. So F8/F9
is not waiting on effort, it is waiting on the surface that makes it possible
at all.

## Not done, and why building the mechanism early would be worse

Shipping the exported fragment and its gate now would create **a gate for a
thing with no consumer** — a declared property whose check cannot answer its
own claim, which R17 recorded and which `harness-tiles` re-states one round
later. The fragment ships WITH the glass.

## Done when

- [ ] R25's glass exists (see the warning on R30 before building it)
- [ ] `cat-harness` exports the folio mount fragment and its marker
- [ ] `gen-iris-pages.ts` calls it rather than writing the tags itself
- [ ] a gate fails the build for a generated page with no folio mount
- [ ] the gate reuses `bodyInsertionPoint()` — `ur84` is not reproduced
- [ ] a witness test reads a real generated who-iris page, not a fixture

## Waits on `folio-assistant-j2if` — and this is a DEPENDENCY, not a block

**Two rules of `bean-blocking` were broken in the first draft of this bean and
are corrected here, because getting them wrong is the failure the skill exists
to prevent.**

**`status: blocked` is not a status.** The CLI produces `draft`, `todo`,
`in-progress`, `completed`, `scrapped`, and `bean-store-hygiene` fails the
build on anything else — which it did. A block was never meant to live in the
status field: *"it makes the actual dependency legible instead of hiding it
inside a status"*.

**And the first draft said "no expiry needed and none given."** The skill says
the opposite in as many words — *"Never leave a block without an expiry. If
you cannot say when it goes stale, you have not established that it is a
block."* Writing an exception to a rule stated as **never**, inside the bean
that rule governs, is worse than simply omitting it.

So this is not filed as a block at all. It is `todo`, pickup-able, and what it
waits on is stated here where a sibling can read it: **R25's glass, in
`j2if`**. Nothing goes stale, because nothing is being waited *on* — the work
is simply not yet possible, and the measurement above says why. An agent who
finds this bean should pick up `j2if`, not wonder whether to take this over.

**`bean-blocking` also says prefer a sub-bean**, and this would be one of
`j2if` if the epic allowed a third level; `check:bean-parents` requires every
open bean to sit directly under an epic or milestone, so it sits under `6lb8`
beside `j2if` with the dependency written in the body instead.
