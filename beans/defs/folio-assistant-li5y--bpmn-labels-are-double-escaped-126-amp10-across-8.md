---
# folio-assistant-li5y
title: 'BPMN labels are DOUBLE-escaped: 126 `&amp;#10;` across 8 diagrams render as literal text in 7 published SVGs'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T11:40:56Z
updated_at: 2026-09-26T11:40:56Z
---

Found 2026-09-26 by LOOKING at a rendered SVG, not by any gate. `render:bpmn:check`
was green throughout: it grades whether the committed SVG matches what the
renderer produces, and the renderer faithfully produced the wrong thing. That is
the currency-vs-validity split `check:artefact-verification` exists for, arriving
in the diagrams.

## What renders

A BPMN `name` attribute written `&amp;#10;` is DOUBLE-escaped. XML resolves it to
the five characters `&#10;`, so the renderer draws them:

| element | rendered label |
|---|---|
| `Task_Rust` | `Rust wildcard` / `imports&#10;(WARN-ONLY)` |
| `Task_Advisories` | `Dependency` / `advisories&#10;(WARN-ONLY)` |
| `Task_TypeScript` | `TypeScript: tests, lint,` / `types,&#10;and ~30` / `repository gates (HARD)` |

Single-escaped `&#10;` is correct, and that is MEASURED rather than reasoned:
changing one label and re-rendering produced `['Skill-registration chain',
'(UNMASKED)']` — two tspans, no literal — while its untouched neighbour kept
`imports&amp;#10;(WARN-ONLY)`.

## Scope, and why it is not "a convention I broke from"

**126 occurrences across 8 `.bpmn` files**, all CI/infrastructure diagrams:

```
  24  processes/graph-detanglement.bpmn      19  processes/pr-checks-present.bpmn
  20  processes/repository-health-watch.bpmn 19  processes/code-quality-gates.bpmn
  18  processes/ci-health-watch.bpmn         10  processes/jsonld-drift-check.bpmn
   8  processes/atomic-mass-drift-check.bpmn  8  processes/docs-site-publish.bpmn
```

**The correct single-escaped form is ALREADY in use elsewhere** —
`voice-review.bpmn`, `swot-analysis.bpmn`, `crdm-data-model.bpmn`,
`content-change-review.bpmn` among others. So the corpus holds both forms and
this is an inconsistency rather than a house style, which is what makes it safe
to fix rather than a decision to put to anybody. The clustering in eight
CI diagrams suggests one authoring session.

**7 published SVGs** under `docs/assets/img/workflows/` carry the literal text
today.

## The documentation half, which is NOT the same fix

`<bpmn:documentation>` bodies use `&amp;#10;` as paragraph separators, and
`processes:viz` emits the documentation onto ONE markdown line, so the published
process page shows `&#10;` between paragraphs instead of breaking them. Same
escaping error, different consequence and different remedy: a label wants a line
break inside a box, a documentation body wants paragraphs on a page, and the
generator's emission is the thing to change for the second. Counted but not
fixed, deliberately — and it is prose, so a bulk rewrite over it is the kind of
edit that should be reviewed rather than swept.

## What #1399 already fixed, and the line it drew

That PR added `Task_SkillChain` to `code-quality-gates.bpmn` and fixed **all 9
`name` attributes in that one file** — the diagram it renders, where shipping
eight knowingly-broken labels beside one correct new one was not defensible. It
did NOT touch that file's documentation prose, and did not touch the other 7
files.

It also fixed five FALSE CLAIMS the new job created in that diagram's own
documentation: "SIX INDEPENDENT JOBS" (seven now), "all six start together",
"five `needs:` keys", "Four jobs are HARD" (five), "six equal boxes". Worth
noting for this bean because nothing caught those either — `check:process-documentation`
passes over a documentation body whose counts contradict the diagram beside it.

## Done when

- [ ] the remaining 7 files' `name` attributes are single-escaped and the SVGs
      re-rendered. MEASURED AFTER: zero elements in any workflow SVG carry a
      literal `&#10;` in a label — the check that found this, and it is one grep
- [ ] a GATE for it, because `render:bpmn:check` structurally cannot see this: it
      compares the committed SVG to the renderer's output and both agree. The
      assertion wanted is over the RENDERED TEXT — no `<tspan>` in any workflow
      SVG contains an XML character reference as literal text
- [ ] DECIDE the documentation half separately: should `processes:viz` turn a
      documentation body's line breaks into markdown paragraphs? Not assumed
      here; it changes every process page's shape
- [ ] the counts question: can a documentation body's job/step counts be checked
      against the diagram, or is that only reviewable? Five were wrong the moment
      a job was added and nothing said so
