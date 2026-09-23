---
# folio-assistant-j66n
title: 'THEME INGESTION: a subprocess of document ingestion, and one Theme node with kind sticky|webpage|publication'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T08:02:10Z
updated_at: 2026-09-23T03:55:00Z
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

---

## Wired 2026-09-23 — the gateway is answered, not computed

Owner ruled **"human/agentic judgement at the gateway"** over a declared
predicate. `ingest-theme.bpmn` is now a call activity of
`document-ingestion.bpmn`, reached through `Gateway_ThemeSource` —
*"A theme source? (author's judgement)"*.

**The predicate is deliberately absent, and the diagram says why.** The
alternative on offer was testable — a captured web deployment, or a document
that STATES palette and typography rules — and it was refused for the reason
the owner had already given when withdrawing `xffc`/`d3yq`: *"no formal
role/theme mapping per se. that is authoring (human/agentic) decision/
judgement."* An arbitrary branded PDF is not a theme source because a rule says
so; it is not one because the author says it is not.

**Why a gateway rather than a filter inside the subprocess.** `ingest-theme`
starts at *"Theme source in hand"* and can refuse as incomplete. Routing every
document into it would make *"this is not a theme"* and *"this theme is
malformed"* the same refusal — and the second is a defect while the first is
the normal case.

### Placement, and the thing that nearly went wrong

`Derive` → `Gateway_ThemeSource` → (yes) `CallActivity_IngestTheme` →
`BuildKg`; (no) straight to `BuildKg`. It sits before the L1 build because a
theme is derived content that has to reach the graph.

**It stays in Lane_1 (Ingestion Engine).** The obvious way to make room was to
drop the call activity below the main line, where `Task_OpenBean` sits — but
that is **Lane_2, the shared work plan**, and filing a theme ingestion there
would have said this is a write to the plan rather than the engine asking its
author a question. So the 7 shapes right of x=940 were shifted +340 instead,
and the pool and all four lanes widened to match. Lane_1's own documentation
now says this.

### Two gates caught what review would not have

- **`check:lane-documentation`** and the interpretability test both failed:
  the two new nodes had DI, flows and documentation, and **no
  `<bpmn:flowNodeRef>`**. A node can be drawn, connected and rendered while
  belonging to no lane — which is to say, to no ROLE.
- Regeneration is not optional and is not one command: `render:bpmn`,
  `translate-bpmn --extract` (**5 locales**, since a new label is a new
  translatable string), `processes:viz`, `docs:auto`, `kg:audit`.

### Verified on the rendering, not on the generator

`bun run gates` 127/127, and the built SVG opened: viewBox widened to
`155 75 2217 730`, all four new labels present, and the branch inside Lane_1's
y-band (310–415 against 260–440). A green gate set is not a rendered page.

### One thing fixed in passing

`Task_OpenBean` carried `<folio:skill ref="todo-manager" />` **three times**.
Reduced to one; nothing else about that task changed.

### Still open on this bean

The two themes themselves — `iris-web` (source already on disk in the IRIS
capture) and `who-wpro-publication` (source is the style guide's own rules).
This entry wires the process; it does not ingest them.
