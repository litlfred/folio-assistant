---
# folio-assistant-edx7
title: 'NAVBAR IS A COMMON FIXTURE: 0 of 47 generated viewer pages carry the LHS rail — hw9g fixed mounted instances, not these'
status: completed
type: feature
parent: folio-assistant-p5wm
created_at: 2026-09-23T13:30:28Z
updated_at: 2026-09-24T12:00:24Z
---


Owner, 2026-09-23, naming three pages and then the rule:

> navbar should be on sub pages like
> https://litlfred.github.io/folio-assistant/cat-harness/catalogue/who-iris/
>
> or https://litlfred.github.io/folio-assistant/cat-harness/docs-auto/index/docs/who-iris-docs/
> or library
>
> etc... **common fixture unless explicty removed in harness visualtion.**

The last line is the requirement, and it inverts today's default: the rail is
**present unless a visualisation explicitly removes it**, rather than absent
unless something adds it.

## Measured on `main`, 2026-09-23

```
0 of 47 generated index.html under cat-harness/docs/ carry LHS nav markup
```

Grepped for `side-bar|site-nav|fa-nav` over every generated `index.html`.
Not one. So this is **not a CSS defect** — the fixture is absent from the
whole family, which is the falsifier this investigation opened with.

The three pages the owner named are all in it:

| page | rail |
|---|---|
| `cat-harness/catalogue/who-iris/` | none |
| `cat-harness/docs-auto/index/docs/who-iris-docs/` | none |
| `cat-harness/docs-auto/index/` | none |

## This is NOT `hw9g` again — it is the family next door

`hw9g` (completed) fixed **mounted instances** — `/who-iris/`, `/smart-trust/`
— by calling `injectRail` at mount time, because `mount-instance-docs.ts`
copies finished HTML and deliberately bypasses Jekyll.

`injectRail` has exactly **one** non-test caller: `mount-instance-docs.ts`.
The generated VIEWER pages never reach it. Same defect, one directory over,
and `hw9g`'s fix does not generalise to them by itself.

## Why there is no one-line fix

The 47 pages come from about ten generators, each writing its own `<html>`
shell:

| family | pages |
|---|---|
| `docs-auto` | 16 |
| `library` | 7 |
| `voices` | 6 |
| `schemas` | 6 |
| `uploads` | 2 |
| singletons (`todos`, `qa`, `issue-marks`, `translation-status`, …) | 1 each |

`gen-docs-auto.ts` alone writes two separate inline `<html>` shells. So the
owner's rule — *one common fixture* — requires a shared page shell that does
not exist yet. **That is the work**, not a patch to one generator: patching
one would leave nine, and leave the next generator free to forget.

## Shape, proposed rather than settled

1. A shared shell every viewer generator writes through, applying
   `injectRail` by default.
2. An **explicit** opt-out, declared by the visualisation — not a default and
   not a guess, so that "this page deliberately has no rail" and "nobody wired
   it" stay distinguishable. `who-iris`'s mounted replica is the precedent
   for a legitimate removal: it is a replica of IRIS, and folio-assistant's
   chrome would be the opposite of what a replica is for.
3. A gate over the generated tree, so the count cannot silently return to 0.

## COLLISION RISK, recorded before any code

This is squarely `sjic`'s stated scope — *"we should have same navbar across
all folios though. presented same way"* — and `sjic` and `603s` are both
CLAIMED by other sessions, with several navbar commits landing on `main`
today. A shared page shell touches `lib/harness-rail.ts` and
`lib/navbar.ts`, which is exactly where that work lives.

So this bean carries the MEASUREMENT and the RULE, and stops there. Whoever
holds the navbar component should build the shell; this hands them the number
and the opt-out requirement rather than racing them to it.

## Done when

- [x] measured: 0 of 47, with the grep that produced it
- [x] distinguished from `hw9g` — `injectRail` has one non-test caller
- [x] counted the generators, so "one fix" is not assumed
- [x] the owner's opt-out rule written down verbatim
- [x] a shared viewer shell — done as a shared **`emit`** rather than a shell,
      and it does NOT race `sjic`: it composes a MODEL and hands it to
      `injectRail`, exactly as `mount-instance-docs.ts` does. Two callers, one
      component. When `sjic` changes `lib/navbar.ts` these pages change with it
      and nothing in `scripts/viewer-page.ts` moves.
- [x] an explicit per-visualisation opt-out — `<meta name="folio-navbar"
      content="none">`, read off the page rather than listed in a script.
      **No user in the committed tree**, stated rather than hidden: the owner
      named `catalogue/who-iris/` as a page that SHOULD carry the rail, and the
      IRIS replica is not a generated viewer page at all.
- [x] a gate so the count cannot return to 0 — `check:viewer-nav`, and it gates
      **regressions only**. The audit walks the whole docs tree, so staleness
      would redden on somebody else's merge — the `library:viz` ruling
      (2026-09-20). A rail LOST is the author of the diff, every time, and that
      is what "cannot return to 0" means. `viewer:nav:strict` carries staleness
      and the unwired pages.

## Measured after, 2026-09-23 — 45 railed, 0 declined, 1 missing of 46

The count was **46, not 47**: `main` moved between the morning measurement and
the work. A count carried across a tree is a claim.

The one missing is **not this bean's and not an agent's to delete**:
`cat-harness/docs/cat-harness/schemas/detangle/index.html`. `gen-schema-viz.ts`
prunes it as an orphan — its subject stopped being an instance when `detangle`
became a directory of this harness (`byql`) — and `schema:viz:check` was
already failing on clean `main` for it, ungated so nothing said so. Restored,
recorded in the sidecar with its reason, and **the owner's call**.

A defect the repository's own test caught: the first version marked the current
row and kept its link, so `/beans/` carried `href="../beans/"`.
`state-visualizer.test.ts` already holds the rule. The current row now loses its
href.

Issue #1196, PR #1197.

## Summary of Changes — closed 2026-09-24

Every box here has been checked since #1197 merged as `3f454c74`; the status
said `in-progress` for a day because nothing closed it, which is the state this
entry ends.

**What shipped.** `cat-harness/scripts/viewer-page.ts` — a shared `emit`, not a
helper. Five of the nine generators carried a byte-identical `emit` and none of
them reached `injectRail`, so a helper would have been a tenth thing to
remember to call. The fixture applies the nav BEFORE the staleness comparison,
so `--check` and the write ask about the same bytes.

**Proven in practice rather than argued.** The family later grew from 46 to 48
and the two new pages, generated by code that came from `main` and knew nothing
about this bean, arrived railed. That is the difference between a fixture and a
convention.

**The audit is a committed sidecar**, `viewer-nav-qa/v1`, gated on regressions
only — the `library:viz` ruling — with `--strict` adding staleness and every
`missing`. Last measured `46 railed, 0 declined, 0 missing of 46`.

**The one `missing` closed without anything here changing.** It was the
detangle orphan viewer, and the owner retired it to
`fsh-guts/retired/detangle-schema-viewer.html` in #1225. Recorded because "the
number went to zero" and "somebody decided" are different facts.

**What it did NOT cover, and what did.** Generated viewer pages only. The
mounted routes were `hw9g`; the standalone pages Jekyll copies through —
23 wireframes, 10 bootstrap, and TypeDoc's `api/` — were `oi1y`, issue #1231,
merged as `6c8db922` and `0cd72780`.

Issue #1196, PR #1197.
