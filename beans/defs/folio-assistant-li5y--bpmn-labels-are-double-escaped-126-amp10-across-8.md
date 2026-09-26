---
# folio-assistant-li5y
title: 'BPMN labels are DOUBLE-escaped: 126 `&amp;#10;` across 8 diagrams render as literal text in 7 published SVGs'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T11:40:56Z
updated_at: 2026-09-26T12:38:50Z
parent: folio-assistant-1xhc
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


## The GATE is built — `check:rendered-labels`, #1399

The second clause, done. `cat-harness/scripts/check-rendered-labels.ts`, wired in
the E2E job beside `rendered BPMN SVGs are current`, baseline at
`scripts/rendered-labels-baseline.json`: **6 files, 68 labels**.

It reads the RENDERED SVG rather than the `.bpmn`, and the second reason is the
one that settled it: `docs-site-publish.bpmn` carries eight `&amp;#10;` and its
SVG carries NONE — all eight are in `<bpmn:documentation>`. A source-level grep
would have demanded a label fix for eight cases that are the documentation half
of this bean, which wants a different remedy. The matcher also takes hex
(`&amp;#x2014;`), because the defect is a character reference reaching drawn
text, not one spelling.

Baselined on file AND count, not presence: a file already listed can gain a
seventh bad label, and a set of filenames would say nothing. Falsified in four
directions by hand before being pinned as 12 tests — new file fails, a baselined
file gaining one fails, progress prints FIXED at exit 0, an empty corpus is
undetermined.

### Done when — revised

- [ ] the remaining 7 files' `name` attributes are single-escaped and the SVGs
      re-rendered. **The gate now makes this safe to do incrementally**: fix one
      file, re-run with `--update`, and the diff a reviewer sees is the
      shrinking baseline
- [x] a GATE for it — `check:rendered-labels`, and it cannot be satisfied by the
      thing that hid this: it asserts over rendered TEXT, where
      `render:bpmn:check` asserts currency
- [ ] DECIDE the documentation half separately: should `processes:viz` turn a
      documentation body's line breaks into markdown paragraphs? Still not
      assumed — and now provably outside the label gate's scope rather than
      merely excluded by intent
- [ ] the counts question: five documentation counts AND one rendered label
      (`GW_Fork`, "All six" → "All seven") were falsified the moment a job was
      added, and nothing said so. The rendered one was caught only because a
      `.pot` diff laid every label side by side
- [ ] the five-locale exposure: `ar/es/fr/ru/zh` `.pot` templates handed
      translators the escape INSIDE the msgid. Fixed for code-quality-gates; the
      other 7 files still carry it
