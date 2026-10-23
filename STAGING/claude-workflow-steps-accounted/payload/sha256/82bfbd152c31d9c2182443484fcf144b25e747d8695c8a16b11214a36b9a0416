---
name: dak-preprocessing
description: >
  What the DAK pre-processing phase actually accomplishes, step by step, before
  the IG Publisher runs — and which of its steps exist only to satisfy the
  Publisher's own page index — and how it runs as the overlay on
  fhir-harness's AST cache refresh (`dak-pre-export.sh`). Read before changing
  a pre-processing step, before assuming one is needed, and before moving one
  to another layer.
---

# dak-preprocessing

> Skill id: `dak-preprocessing` · Package: `authoring-who-smart-guidelines` ·
> Layer: **`smart-base`, DAK kind** ([`smart-stack-layering`](smart-stack-layering.md); `smart-dak` until stage D, #1767),
> with two steps that are not pre-processing at all — see §"Two of these are
> authoring, not pre-processing".

The phase the WHO build calls *DAK Preprocessing*: everything that runs between
checkout and `publisher.jar`, gated by the `do_dak` input and by the presence of
`dak.json` at the repository root — **upstream's spelling**; ours is
`dak.config.json` since 2026-09-22 and nothing at WHO has been renamed.

> **Sourcing.** Read from `WorldHealthOrganization/smart-base` —
> `.github/workflows/ghbuild.yml` and the scripts under `input/scripts/` — on
> 2026-09-22, at that repository's `main`. Line numbers move; step names and
> script names are the stable handles. **Re-read before relying on a detail**:
> the scripts are fetched at build time from `SCRIPTS_BASE_URL` pinned to
> smart-base `main`, so a downstream IG's build runs whatever smart-base's main
> holds that day, not whatever its own checkout holds.

## The steps, and what each one accomplishes

| # | script | what it actually does |
|---|---|---|
| 1 | `generate_dak_from_sushi.py` | writes `dak.json` from `sushi-config.yaml` plus branch/repo context — only when `smart.who.int.base` is a dependency and `dak.json` is absent |
| 2 | `update_sushi_config.py` | **registers pages and menu entries in `sushi-config.yaml`, and writes placeholder markdown** — see below, this is the one that matters |
| 3 | `generate_dak_from_sushi.py`, again | re-runs step 1 with the resolved branch context, after the branch name has been sanitised |
| 4 | `dmn_questionnaire_generator.py` | emits FHIR `Questionnaire` resources from the DMN decision tables |
| 5 | `transform_dmn.py` + `dmn2html.xslt` + `dmn.css` | renders each DMN file to HTML for inclusion in a page |
| 6 | `inject_translations.py` | substitutes translated strings into the diagram sources before they are rendered |

Six script invocations across four named workflow steps: the first two share the
step *"Prepare DAK environment"*, and step 3 is a deliberate second run.

## What "get it into the IG index" meant — step 2, precisely

This is the step the phase mostly exists for, and it is worth stating exactly,
because the vague version (*"pre-processing gets things into the index so the
pages render"*) is what keeps the phase alive after its reason has gone.

`update_sushi_config.py` does four things:

1. **Scans for resources** — `fsh-generated/resources/` (SUSHI's output) and
   `input/resources/` (static JSON), collecting every `ValueSet` and every
   logical-model `StructureDefinition`.
2. **Writes a placeholder markdown page per resource** into
   `input/pagecontent/`, as `ValueSet-<id>.md` and the logical-model equivalent,
   each carrying a `<!-- DAK_API_PLACEHOLDER: … -->` marker. A file that already
   exists **with real content** is left alone; the marker is how the script
   tells its own placeholder from an author's page.
3. **Registers `dak-api.md` in `sushi-config.yaml`'s `pages:` map**, creating
   the `pages:` key if the IG has none.
4. **Registers `Indices → DAK API → dak-api.html` in the `menu:` map**, creating
   `menu:` and the `Indices` subsection if absent.

So the "index" is **`sushi-config.yaml`'s `pages:` and `menu:` maps**, and the
"pages would not render" is literal: the IG Publisher's Jekyll renders a page
only if the file exists in `input/pagecontent/` **and** the config's `pages:`
names it. Both halves are what step 2 supplies.

**Which is why this step does not survive the transition.** Under the
just-the-docs pipeline the navigation is derived from `sushi-config.yaml`
directly and the pages are folio pages — we own both maps, so writing them back
into somebody else's config to get them read again is a round trip through a
tool we are removing. See [`ig-render-jekyll`](../../../../fhir-harness/skills/fhir-ig-base/ig-render-jekyll.md)
for what replaces it, and `kn0t` for the phasing.

## Two of these are authoring, not pre-processing

Steps 4 and 5 — `dmn_questionnaire_generator.py` and `transform_dmn.py` — are
**not** hooks around a renderer. They mint artefacts:

- the questionnaire generator emits **FHIR resources**, which the Publisher then
  validates, indexes and publishes like any other resource. Delete the step and
  the IG is missing `Questionnaire`s, not missing a page.
- the DMN transform produces the **only** human-readable rendering of a decision
  table the IG has.

They run late because the pipeline had nowhere earlier to put them, not because
they depend on anything the Publisher does. **They are content generation and
belong upstream of the Publisher, in the DAK document kind as authoring steps** — which is
how they survive the transition while step 2 does not.

`transform_dmn.py` has a second property worth recording: its output is
**HTML**, which the JSON-only render contract does not take. Either it gains a
structured output, or its HTML is treated as an embedded asset rather than as a
representation. That is an open question, not a settled one — bean `kn0t`.

## Step 6 is conditional on who renders

`inject_translations.py` rewrites diagram sources **before** rendering because
the Publisher offers no later hook. Once pages render through just-the-docs, the
locale layer already in this platform does this, and the step is redundant **for
pages**. It is not redundant for the diagram sources themselves, which are still
rasterised outside Jekyll.

Do not remove it on the strength of the page argument alone.

## Steps 1 and 3 — one fact, computed twice

`generate_dak_from_sushi.py` runs twice, the second time *"with current branch
context"*. That is a workaround for ordering: the branch name is sanitised by a
later step than the one that first needs it.

`dak.config.json` is **ours** (bean `cz17`), not a file we merely read, so this is a
derivation we own and can compute once, in the right order. Do not reproduce the
double run when lifting this step.

## What a QA report already exists for

Every one of these scripts instantiates a `QAReporter` and writes a phase report
— `successes`, `warnings`, `errors`, `files_processed`, `files_expected`,
`files_missing`, plus a summary with counts and a completion timestamp. **The
data for the QA-report graph typology already exists and is thrown away**, because
nothing downstream read it.

**It has somewhere to go now.** The owner ruled for the evidence-led option on
2026-09-22 and `qa-report/v1` is registered — `schemas/qa-report.ts`, graph typology
`qa-report`, `holds: "state"`. The shape is whatever these scripts already emit,
down to upstream's snake_case field names, because renaming them would insert a
translation step between a producer we do not control and a consumer we do.

## In the AST lifecycle: the overlay on fhir-harness's refresh

Owner, 2026-10-14: *"that should be in fhir-harness then smart-* all use
that"*, and *"i want AST to be used. it should be in cache branch"*. smart-base's
IG is published from the AST on its cache branch
(`cat/fhir-harness/fhir-ast/<package id>`), like every smart-* IG. The one
writer of that branch is fhir-harness's reusable `ig-ast-refresh.yml`
(skill `ig-build-pipeline`, §"The AST cache lifecycle"). The plain AST
exporter does not run this phase, so smart-base supplies it as an
**overlay**. fhir-harness never names it.

- **The command** is [`smart-base/scripts/dak-pre-export.sh`](../../../scripts/dak-pre-export.sh)
  (`bun run cat smart-base:dak-pre-export`). It runs steps 1, 2, 4, 5 and 6
  of the table above, in that order. It uses this checkout's own
  `input/scripts/`, never a download from another repository's `main`. It
  does not repeat step 3, as §"Steps 1 and 3" says. Steps 4–6 run only when
  `dak.json` is present, as in `ghbuild.yml`. Any failure fails the run.
- **The caller** is smart-base's `.github/workflows/ig-ast-refresh.yml`:
  fhir-harness's template plus `pre-export: bash smart-base/scripts/dak-pre-export.sh`.
  It runs by hand, and on every push to `main` that changes `sushi-config.yaml`,
  `ig.ini` or `input/**` (owner, 2026-10-14: refresh automatically when the IG
  source changes).
- **What the cache records.** This phase rewrites the IG's inputs:
  `sushi-config.yaml`'s `pages:`/`menu:` and placeholder pages under
  `input/pagecontent/`. fhir-harness takes the clean commit's input digest
  before the command runs, puts the inputs back after the export, and records
  the AST against the clean commit. The prepared tree's digest is kept under
  the manifest's `preExport`. So the cache verifies on any clean checkout, and
  a merge that changes no input does not make it stale.
- **The counterpart** after the export is not the Publisher's `output/` any
  more. It is `dak-ast-sidecars.ts`, which runs the post-processing schema and
  vocabulary generators over the AST ([`dak-postprocessing`](dak-postprocessing.md)).

`ghbuild.yml` is WHO's inherited build and keeps its own copy of these steps
for downstream repositories. It is not how smart-base's cache is written.

## Where the counterpart is

[`dak-postprocessing`](dak-postprocessing.md) — the eight steps after the
Publisher run. [`ig-publication`](../../../../fhir-harness/skills/content/fhir-ig-authoring/ig-publication.md) — the Publisher run itself
and the authority to release. [`smart-stack-layering`](smart-stack-layering.md)
— which layer each of these belongs to, and the falsification test that placing
them is what checks the stack.
