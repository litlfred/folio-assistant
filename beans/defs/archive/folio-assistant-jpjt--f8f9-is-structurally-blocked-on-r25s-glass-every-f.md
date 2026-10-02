---
# folio-assistant-jpjt
title: 'F8/F9 is structurally blocked on R25''s glass: every folio surface today needs just-the-docs furniture'
status: completed
type: feature
priority: normal
created_at: 2026-09-21T23:20:00Z
updated_at: 2026-09-22T08:54:18Z
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

- [x] R25's glass exists — `funp`, and `mountGlass()` is hoisted out of
      `mountTodoBoard` so it needs none of a board's page furniture
- [x] `cat-harness` exports the folio mount fragment and its marker —
      `scripts/folio-mount.ts`
- [x] `gen-iris-pages.ts` calls it rather than writing the tags itself
- [x] a gate fails the build for a generated page with no folio mount —
      `check:folio-mount`, falsified three ways
- [x] `ur84` is not reproduced — the comment scan was EXTRACTED to
      `html-comments.ts` and `bodyInsertionPoint` now uses it, so there is one
      scanner rather than the second copy this item was written to prevent
- [x] a witness test reads a real generated who-iris page, not a fixture —
      `test/folio-mount.e2e.ts`, 9 specs

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

## Summary of changes

**The blocker was measured gone before anything was built.** This bean's own
table said F8/F9 waited on three surfaces that all need just-the-docs
furniture. `funp` hoisted `mountGlass()` out of `mountTodoBoard` and calls it
from `init()` unconditionally, and `glass.e2e.ts` proves it against a fixture
with no `<main>`, no `.main-content`, no sidebar header and a todo index that
404s — every condition a replica page meets. So the ordering recorded here
("rides after the glass") had become wrong, and the correction is the reason
this was picked up rather than glass stage 2: the library view is a
standalone generated page too, so **stage 2 sits behind this, not in front**.

`scripts/folio-mount.ts` — `MARKER`, `siteRootOf`, `fragment`, `hasMount`.
`who-iris/who-iris.json` declares `folioMount.roots` and one exemption;
`gen-iris-pages.ts` emits `${FOLIO_MOUNT}` and 11 of 11 generated pages carry
it. `check:folio-mount` is registered in `package.json` and
`code-quality-gates.yml`.

**The root is derived in the browser**, because these pages are served from
two mount routes AND under a baseurl AND under `/STAGING/<branch>/`: an
absolute URL is correct on exactly one of four, and a relative one on at most
two. The pattern lives in who-iris, because a route is a fact about that
instance.

**The scope is declared, not inferred.** Measured first: 67 HTML files, 60
standalone, over `cat-harness/docs` (38), who-iris (12), `cat-harness/ui` (4),
`_kg` fixtures (5), the viewer (1). A gate over all of them would fail honest
pages and accumulate exemptions until it asserted nothing. An instance with no
`folioMount` block is reported by name as NOT CONFIGURED — a third state, not
a pass.

## Falsified

**The gate, three ways, each exiting 1:** a page whose marker is removed; a
page whose marker is present but COMMENTED OUT (the `ur84` shape, which a
"does the string appear" check passes); an exemption naming a path that holds
no pages.

**The fidelity test was VACUOUS and said so only under falsification.**
`docs-ui.css` is 587 selectors and exactly one is globally scoped in a way a
replica can feel (`:focus-visible`). The e2e compares every element's computed
box and colour with and against the mount — and it passed a deliberately
injected `body { font-size: 22px }`. The control was wrong: it renamed the
marker ATTRIBUTE, which is what the gate reads, not what makes an inline
script run, so both sides of the comparison loaded the stylesheet. Fixed to
strip the whole `<script>` element; the same injection now fails it. The
reason is kept in the file, because a control that does not remove the thing
under test fails silently in the passing direction.

With the control correct, **no element of the replica moves, resizes or
changes colour.**

## A correction to the commit message on the partition fix

`check:partition` went red on #879 — three new top-level scripts
`unassigned`, because `scripts/` is in no prefix rule. The fix is right and
was reproduced before and verified after.

**Its commit message says "CI caught what a branch run could not". That is
false and is corrected here rather than rewritten.** The branch-local
`bun run gates` caught the identical failure and exited 1. What actually
happened is that the run was still going and the push did not wait for it —
which is a different failure with a different fix, and describing it as the
first one would have taught the next reader the wrong lesson about what the
branch gates can see.

The real rule it illustrates is the one already in `AGENTS.md`: *a subset of
the gate set is not the gate set* — and a gate set still running is not a
gate set that passed.
