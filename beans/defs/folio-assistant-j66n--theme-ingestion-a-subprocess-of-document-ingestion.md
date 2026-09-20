---
# folio-assistant-j66n
title: 'THEME INGESTION: a subprocess of document ingestion, and one Theme node with kind sticky|webpage|publication'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T08:02:10Z
updated_at: 2026-09-20T08:02:10Z
parent: folio-assistant-kupb
---

Owner: extract 'smiilar stylngs for a webpage theme and also for publiccation themes', and (this session) ONE node with a kind discriminator rather than three node kinds.

TWO SOURCES, ONE ARTEFACT:
- WEBPAGE theme from the IRIS item page's own assets (`client-theme.css`, `styles.e55b0c9926626404.css`, three SVG logos), which is what a DSpace deployment's theme IS.
- PUBLICATION theme from the style guide's own rules — the document that TELLS you the palette, typography and pagination.

WHY THE DISCRIMINATOR AND NOT THREE KINDS. `schemas/theme.ts` already exists and already carries the argument: 106 hardcoded hex colours against 22 custom properties is what named roles fix. Three spellings of 'accent colour' reintroduces exactly that, one level up.

CONSTRAINT THE EXISTING NODE ALREADY STATES AND A NEW KIND MUST NOT BREAK: 'a theme sets the stripe's hue; it never sets its width to zero' — colour alone carrying a whole signal fails SC 1.4.1. A publication theme inherits that rule, and the style guide's own measured rule agrees with it ('Never red with green, never blue with yellow', `who-des-figure-colour-accessibility`).

LIVE COLLISION: PR #465 touches `schemas/theme.ts` and `themes.ts`. Merge, do not rebase.

## Done when
- `ingest-theme.bpmn`, called from `document-ingestion.bpmn`.
- `kind` on `ThemeSchema`, existing sticky themes unchanged and still valid.
- Two worked themes: `iris-web` and `who-wpro-publication`, each citing where every value came from.
- Every layout still required; a missing layout stays INVALID, never degraded.

## Progress 2026-09-20 — three of four clauses done

| clause | state |
|---|---|
| `kind` on `ThemeSchema`, existing sticky themes unchanged | **done** (landed in #477) |
| Two worked themes, each citing where every value came from | **done** — see below |
| Every layout still required; a missing layout stays INVALID | **done**, three tests |
| `ingest-theme.bpmn`, called from `document-ingestion.bpmn` | **diagram done, the CALL is not** |

### The themes are in `who-iris/themes/`, not in `cat-harness/schemas/themes.ts`

The platform's twelve themes are the platform's furniture. These two are WHO's,
and the root `AGENTS.md` draws the line they would cross: a palette read off a
WHO style guide is subject matter. They go through the platform's own
`resolveTheme` with `instance: "who-iris"`, which makes true a sentence
`themes.ts` had already written in prose — *"They go through the same function
a who-iris theme will."*

A `themes` graph kind was added so the directory is DECLARED. An undeclared one
is the `dh4f` defect, which `docs/` had just been rescued from.

### Every value is measured, and the TESTS READ THE SOURCES

Not a copy of the constants — `client-theme.css` is re-read out of the
committed capture zip at test time, and the style guide's values out of its
ingested page text. So the tests are a freshness check too: if the capture is
re-taken and IRIS has re-skinned, they fail rather than the theme going on
describing a site that no longer looks like that.

25 tests. Checked by breaking the code six ways: accent taken as the prettier
`--blue` → 1 fail; `minWidth` filled with a breakpoint → 1 fail; `ink` taken as
the other side of the source's contradiction → 1 fail; `edge` set to a
plausible grey → 1 fail; A4 rewritten into millimetres → 1 fail;
contradictions quietly dropped → 1 fail. Restored → 25 pass. Each hazard is
caught by exactly one test.

### The one value that is a CHOICE, flagged rather than dressed up

`who-wpro-publication.palette.edge`. The guide states **no** rule, border or
divider colour in any of its 33 pages — grepped, and the grep is itself a test,
so if a future ingestion surfaces one this becomes a measurement. `edge`
therefore takes the lightest blue of the palette the guide DOES state, and a
test pins it to membership of that palette so it cannot drift out of the brand
while looking harmless.

### Two contradictions IN THE SOURCE, kept as data

Both are what the document says, and `RECORDED_CONTRADICTIONS` is asserted by a
test so a later tidy-up cannot silently drop them:

- **page 6** gives the black logo as `K: 100` AND `R: 100 G: 100 B: 100` —
  process black against a mid grey. We took `K:100` because this is a print
  theme and CMYK is the print specification, and said so as a choice between
  two readings rather than a correction of the source.
- **page 6 against page 12** gives the one logo blue as `C: 95` and `C: 90`,
  both printed beside the same `R: 0 G: 147 B: 213`. We took the RGB, which
  both pages agree on; a screen theme carries no CMYK build.

### One correction to the issue's own measured inputs

[#476](https://github.com/litlfred/folio-assistant/issues/476) lists the IRIS
webpage `warning` as `#ec9433`. The stylesheet says `--warning: #d86422`;
`#ec9433` is `--yellow`. Read off the file, not off the issue.

### What is NOT done, and why it is a question rather than an omission

`ingest-theme.bpmn` is **not** a call activity of `document-ingestion.bpmn`.
Most ingested documents carry no theme, so an unconditional step would assert
that every one does, and a step that no-ops for almost every document is a step
a reader stops believing. The honest wiring is a gateway — *is this artefact a
theme source?* — and which artefacts answer yes is a judgement nobody has made:
a captured site obviously qualifies, a style guide qualifies because it STATES
rules, and whether an arbitrary branded PDF does is the open question. Recorded
in `every-workflow-in-the-repo.md` under the table, where a reader of the
workflow page meets it.

