---
# folio-assistant-edx7
title: 'NAVBAR IS A COMMON FIXTURE: 0 of 47 generated viewer pages carry the LHS rail — hw9g fixed mounted instances, not these'
status: in-progress
type: feature
parent: folio-assistant-p5wm
created_at: 2026-09-23T13:30:28Z
updated_at: 2026-09-23T13:30:28Z
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
- [ ] a shared viewer shell — **NOT started**: `sjic` is claimed, and racing it
      would produce two answers to one question
- [ ] an explicit per-visualisation opt-out
- [ ] a gate so the count cannot return to 0
