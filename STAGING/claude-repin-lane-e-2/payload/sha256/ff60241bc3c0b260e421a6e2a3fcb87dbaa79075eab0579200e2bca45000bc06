# smart-base Toolchain

> Skill id: `smart-base-tools` · Package:
> `authoring-who-smart-guidelines`

Run WHO's DAK toolchain from a `smart-base` checkout. **Load it; never vendor
it.**

> ## The direction of travel reversed on 2026-09-22 — and this rule did not
>
> The owner: *"the skill/tools under smart-base should consolidate under the
> `smart-base/tools/` directory under this repo"*, serving *"want to slowly get
> smart-base back to a more conventional IG state w/o tooling"*. So
> `WorldHealthOrganization/smart-base` is to stop being a toolchain host and
> become an ordinary FHIR IG, with the capabilities moving here.
>
> **That is not a licence to copy the Python in.** `smart-base/tools/` holds
> **Tool nodes** — declarations of what each capability consumes, produces and
> satisfies. Declaring that `dmn_questionnaire_generator.py` exists and turns
> DMN into `Questionnaire` resources duplicates none of it, and is what lets a
> BPMN activity bind the step at all.
>
> **Declare here, execute upstream, until the execution moves too.** When it
> does move, it moves as one migration with a cutover, not as a copy that
> quietly becomes a fork — which is the failure this rule was written against
> and is still the failure to avoid.
>
> Eleven tools are declared. Two upstream scripts deliberately are **not**:
> `strip_library_binaries.py` and `strip_library_content.py` are not DAK-shaped
> and belong to `fhir-harness` — see
> [`smart-stack-layering`](smart-stack-layering.md). The DAK repositories' own GitHub Actions invoke those scripts in place,
so `WorldHealthOrganization/smart-base` stays their authoritative home — a copy
here would be a second, drifting toolchain, which is the argument
`docs/proposals/rag-document-ingestion.md` §2c makes about corpora, applied to
code.

## Before you start

```sh
export SMART_BASE_HOME=/path/to/smart-base       # default: /opt/smart-base
python3 cat-harness-tools/scripts/smart-base-transform.py --check
```

`--check` exits non-zero and names what is missing. Without a checkout the
skill degrades to `skip` — it does **not** report a clean run over a toolchain
it never had.

## Transforms

Both are the *render* direction — an authored source artefact producing a
published representation, which is what §12.15 wants and what the extractors
are the inverse of.

```sh
# BPMN → FHIR Shorthand
python3 cat-harness-tools/scripts/smart-base-transform.py bpmn2fsh <file.bpmn|dir> -o OUTDIR

# DMN → HTML
python3 cat-harness-tools/scripts/smart-base-transform.py dmn2html <file.dmn|dir> -o OUTDIR
```

Omit `-o` for a dry run that reports counts and writes nothing.

## Two things to expect

**`bpmn2fhirfsh.xsl` emits many files per input.** Its output is an envelope,
`<files><file name="…">…</file>…</files>`, and each entry is a separate
artefact at the path the transform names. Measured on `smart-dak-immz`: 8
business processes → **313 files**, one process alone accounting for 157.

**Paths collide across inputs.** Those 313 land at only 201 distinct paths,
because shared actors and two near-duplicate copies of one process name the
same outputs. The runner counts and names every collision on stderr rather than
overwriting silently — 313 successes leaving 201 files is exactly the kind of
quiet arithmetic that hides a problem. Decide deliberately whether a collision
is a duplicate input to remove or two processes that legitimately contribute
the same actor.

## What else is in there

`smart-base` carries ~54 Python scripts (see the survey in the proposal §12.16):
extractors (`dd_extractor`, `dt_extractor`, `req_extractor`, `extractpr`),
generators (`generate_jsonld_vocabularies`, `generate_*_schemas`,
`dmn_questionnaire_generator`), a translation subsystem, and IG build/CI
orchestration. The two transforms above are wrapped, and `extract_dak.py`
(which runs `dd_extractor`, `req_extractor` and `dt_extractor`) is declared as
the Tool `extract-dak`. The IG build and CI scripts want no skill: GitHub
Actions is their caller.

## Adapting a DAK: use the toolchain the upstream used

An adaptation changes the upstream's components, so it produces them **the way
the upstream produced them**. Before writing any converter, generator, checker
or test runner, find that way, in this order, and record it in the stage-3 or
stage-5 dependency row of
[`smart-guideline-end-to-end`](smart-guideline-end-to-end.md) (`toolchain`):

1. **The tools graph.** `bun run cat check:tools` from the instance root lists
   every Tool the mounted layers declare (smart-base, fhir-harness,
   folio-assistant-core, cat-harness), with the skills each satisfies.
2. **The upstream repository's own toolchain.** Read the dependency's
   repository, not only its published IG. For the WHO immunizations DAK
   (<https://github.com/litlfred/smart-immunizations>), what it uses:

   | component | upstream source | how it is produced |
   |---|---|---|
   | decision-support logic | `input/decision-logic/IMMZ DAK_decision-support logic.xlsx`, DAK template | the repository's own `tools/node/processDTInput.js`, `processDTOutput.js`, `processDTCheck.js` (node-xlsx → CQL, FSH); `extract-dak` (`dt_extractor`, → DMN) reads the same layout |
   | scheduling logic | the schedule tabs of that spreadsheet | `tools/node/processDTSchedule.js <xlsx> <sheet> …` |
   | core data elements, indicators | `input/L2/IMMZ DAK_core data dictionary.xlsx`, `IMMZ DAK_indicators.xlsx` | `tools/node/processDAK.js -f <xlsx>`, `processIND.js`; `extract-dak` (`dd_extractor`) where the layout is `input/dictionary/` |
   | requirements | DAK requirements template (`input/system-requirements/`, empty in this repository) | `extract-dak` (`req_extractor`) |
   | CQL libraries (compile and refresh) | `input/cql/*.cql` | cqf tooling-cli `-RefreshIG` (`_refresh.sh`); the IG Publisher compiles CQL in the build |
   | test cases | `input/tests/plandefinition/<Library>/*.yaml` | `tools/node/makeExample.js` into FHIR test bundles |
   | L1 recommendations transcribed verbatim | `*.l1.yaml` (measles) | litlfred/test `tools/build_l1.py` |
   | L1 authored from pictures (posters, slides) | `*.l1.yaml` with `image:` / `from:` | the smart-base Tool `l1-transcription-verbatim` |

3. **WHO's method.** The WHO IG Starter Kit (`smart.who.int/ig-starter-kit`:
   `l2_dak_authoring`, `l3_decisiontables`, `l3_cql`, `l3_testing`) and its
   DAK templates (decision-support, scheduling, requirements, data dictionary,
   indicators). Jurisdiction training material where there is some, e.g.
   litlfred/uganda-sg-training for Uganda.

Only when all three come back empty is something new written, and then as a
**Tool node** under [`tool-authoring`](../../../../cat-harness/skills/tools/folio-core/tool-authoring.md),
with the search recorded in the dependency row (`toolchain: none`, and where
it looked). A script written into the adaptation repository with no Tool node
is the 2026-10-15 failure: the Uganda adaptation wrote its own YAML → DMN
builder, CQL compile script and test runner while the upstream kept its
decision tables in the DAK spreadsheet and had a converter, a CQL refresh and
YAML test cases. None of those was a declared Tool, which is why a graph
search alone would not have found them, and why step 2 is not optional.

**There is no PDF renderer in smart-base.** Its only PDF dependency is
`pdfplumber`, used to *read* PDFs when extracting personas.

## What the generic authoring skills need to know here

The platform's `bpmn-authoring`, `dmn-authoring` and `translation-manager`
are generic and name no DAK (bean `lthi`, 2026-10-09: the references used to
point up from them to this skill). What a DAK adds to each is said here:

- **BPMN is a source artefact.** `bpmn2fsh` turns an authored business
  process into FHIR Shorthand, so names and ids chosen in the diagram appear
  in the generated FSH. Author it knowing it will be transformed. A changed
  diagram also changes its picture and its translation templates: re-render
  it (`smart-base/scripts/render-processes.ts`) and run `bun run cat regen`
  ([`prepare-merge`](../../../../cat-harness/skills/sdlc/sdlc-core/prepare-merge.md)),
  which re-extracts the `.pot` files `translate-bpmn:check` gates on.
- **DMN is a source artefact.** `dmn2html` renders decision tables for human
  review, and `dmn_questionnaire_generator` derives questionnaires from them;
  the caveats are §"Two things to expect" above.
- **Translation.** smart-base defines the formal actor
  `SGAuthoring.Persona.Translator`, with the skill requirements
  `SGAuthoring.Skills.TranslateContent` and
  `SGAuthoring.Skills.ReviewTranslations`. The translation subsystem is
  invoked from a smart-base checkout, never copied — the same
  *load it; never vendor it* rule as every tool here.
