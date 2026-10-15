---
name: smart-guideline-end-to-end
description: >
  The whole road from a use case to a running application on WHO SMART
  Guidelines, for a new guideline or a jurisdiction's adaptation: find the L1
  guidelines that bear on the use case, ingest them into an L1 knowledge graph,
  choose the existing L2 DAKs and L3 IGs to build on, create or adapt the L2
  and L3 assets, then build the consuming application the user describes.
  Human adjudication follows every stage, as QA and never as a gate: the agent
  goes on to the next stage while the last one is reviewed. Read before
  starting any end-to-end authoring or adaptation, and to find which existing
  skill and process runs each stage.
---

# smart-guideline-end-to-end

> Skill id: `smart-guideline-end-to-end` · Package: `authoring-who-smart-guidelines` ·
> Process: [`smart-guideline-end-to-end.bpmn`](../../../processes/content/smart-guideline-end-to-end.bpmn)

**This skill adds an order and a dependency choice at each level. It adds no
authoring, no review record and no status vocabulary of its own.** Each stage
runs a skill or process that already exists, named in the table below, and
every record it leaves uses a schema that already exists, named in
[What it reuses](#what-it-reuses). If a stage needs something those do not
say, fix them. Do not add it here.

## The rule that shapes everything: adjudication is QA, not a gate

Owner, 2026-10-14: *"while adjudication is required at every step, it is a QA
issue, not a gate. so once agent produces L2 it can produce L3."*

So every stage ends in a **fork**, not a decision:

```
stage n (agent) ──┬──► stage n+1 (agent)          keeps going
                  └──► adjudicate stage n (human)  runs beside it
```

What follows from that:

1. **Every stage needs adjudication, and the guideline is not done until every
   adjudication is recorded.** Not waiting is not the same as skipping. The
   process ends only when the last stage and all its adjudications are in.
2. **An asset built on unadjudicated input says so.** Each derived KG node
   already names its inputs in `wasDerivedFrom` (hash-pinned, so a changed
   input makes it stale; smart-base `kg/src/graph.ts`). The adjudication state
   of an input goes on that edge's open `properties`, beside the
   `resolutionStatus` and `reviewStatus` that `recommendation-extraction`
   already puts there: `adjudication: pending` while the input's review is
   open. This is provenance, not a warning banner. When the review closes,
   the property updates.
3. **A rejection reopens the stage, and the flag spreads downstream.** A
   `request-changes` or `reject` decision files a bean against the stage.
   Every downstream asset derived from the rejected item gets
   `adjudication: rejected-upstream` on that edge, and is re-derived when
   the stage is redone. It is not deleted ahead of time: the re-derivation
   may come out the same.
4. **The agent never adjudicates.** The person who signs is named by role
   (table below). An agent may prepare the review material, never record the
   verdict. This is `recommendation-extraction`'s sign-off rule applied to
   every level.

`l2-dak-authoring.bpmn` follows the same rule (owner, 2026-10-14). Its
**Clinically accurate?** decision now runs beside assembly, not before it: a
parallel fork after the authoring join starts clinical validation and
assembly together. `changes needed` still sends the work round again, which
re-assembles the DAK. `validated` ends in its own event.

## The stages

| # | stage | runs | produces | adjudicated by | what the adjudicator sees |
|---|---|---|---|---|---|
| 0 | **Describe the use case** | `user` | the use case: population, setting, jurisdiction, interventions in scope | (the user *is* the source) | — |
| 1 | **Identify L1 guidelines and recommendations** that bear on the use case | [`dak-l1-library`](dak-l1-library.md) (Component 1 sources first, then WHO IRIS and the jurisdiction's own guidelines) | a list of candidate L1 sources, each marked *in the library* / *ingested to KG* / *not yet* | Clinical SME | the list, each with why it was included or left out |
| 2 | **Ingest into an L1 KG** the sources not yet in one | `bun run cat ingest` → [`dak-l1-library`](dak-l1-library.md) (generic-document layer, `l1-library`) → [`recommendation-extraction`](recommendation-extraction.md) (L1 layer: recommendations, remarks, practices, scenario candidates) | `library/<bib>/` and `library/<bib>/l1-extraction/` | `l1-extraction-reviewer` (exclusions and coverage), Clinical SME (recommendations) | the extraction beside the printed page; coverage score; every `WARNING` |
| 3 | **Choose L2 dependencies**: which existing DAKs (WHO, or the jurisdiction's adaptation) to build on | agent, reading the L1 KG's `implementedBy` / `realises` edges against each candidate DAK's Component 1; [`decision-comparison`](#stages-3-and-5-dependency-choice) for the table | a dependency list: DAK, version, which components are reused, extended or not used, and why | Programme manager + Business analyst | one row per candidate DAK, including the ones rejected |
| 4 | **Create or adapt the L2 DAK assets** | the steps of [`l2-dak-authoring.bpmn`](../../../processes/content/l2-dak-authoring.bpmn), each an edit-then-review call into [`l2-component-edit-review.bpmn`](../../../processes/content/l2-component-edit-review.bpmn): [`l2-dak-authoring`](l2-dak-authoring.md), `bpmn-authoring`, `dmn-authoring`, `terminology-management`; pre/post-processing by [`dak-preprocessing`](dak-preprocessing.md) / [`dak-postprocessing`](dak-postprocessing.md), run around fhir-harness's AST cache refresh as smart-base's overlay | the DAK components | per asset, see [Per-asset review](#per-asset-review) | per asset; **before and after** for an adaptation |
| 5 | **Choose L3 dependencies**: which existing FHIR IGs (WHO, or the jurisdiction's) to build on | [`ig-artifact-ingestion`](ig-artifact-ingestion.md) to index each candidate IG; agent matches the L1 KG and the stage-4 L2 assets against the index; `decision-comparison` for the table | a dependency list: IG package, version, which profiles / value sets / libraries are reused, derived from or not used | FHIR modeller + Terminologist | one row per candidate IG, including the ones rejected |
| 6 | **Produce the L3 assets** from the L2 assets | [`dak-l3-ig.bpmn`](../../../processes/content/dak-l3-ig.bpmn): `l3-fhir-authoring` with `l2-dak-authoring`, then fhir-harness's L3 pipeline up to a clean IG build | the FHIR IG (FSH, CQL, profiles, terminology, examples, tests) | per asset, see [Per-asset review](#per-asset-review) | per asset; **before and after** for an adaptation |
| 7 | **L4: describe the consuming application** | `user`, prompted by the agent | the application brief: who uses it, on what device, which L2 processes it covers, which L3 resources and operations it calls, connectivity, the systems it talks to. This is the written intent `wireframe-design-review` starts from | (the user *is* the source) | — |
| 8 | **L4: wireframe, then build the consuming application** | `wireframe-design-review` (design use, from the stage-7 intent), then the agent builds against the stage-6 IG (a clean build, not a publication) | wireframe candidates under `docs/wireframes/<topic>/`; the application and its conformance tests against the IG's examples and test cases | Business analyst + Clinical SME (does it do what the L2 says?), FHIR modeller (does it conform to L3?) | the running app, walked through each L2 user scenario |

Publication of the IG (the end of `dak-l3-ig.bpmn`) runs as normal and is not
on the path to stage 8: an application can be built against an IG that has
not been published yet.

Every adjudication in the process is a call to cat-harness's generic review,
`Process_Review` (`processes/content/review-task.bpmn`): it works out what
kind of change it has, runs the review that fits, and accepts or sends back.
When reviewers disagree, that process hands over to `Process_Adjudication`.
Neither is copied here.

### Staging: every review looks at a staged preview

Each stage commits to the guideline's feature branch, and that branch is
staged as a just-the-docs preview by
[`feature-staging`](https://github.com/litlfred/cat-harness/blob/main/skills/sdlc/sdlc-core/feature-staging.md)
(`Process_FeatureStaging`), at `STAGING/<slug>/` on the platform's site.
For smart-base, which folio-assistant mounts, the branch reaches that build
by a **staging re-pin**: a folio-assistant pull request that points the
`smart-base` mount at the branch's commit, recorded with
`bun run cat mount:remote --staging` (basis `staging`, so it needs no
consent). The IG Publisher's `branches/` preview (`ghbuild.yml`, `/deploy`)
is the IG's, not this content's, and is never the preview for it. A review item
never links to source alone. It links to the staged page, through
`staging-review`, which returns **before** (main) and **after** (staging)
URL pairs. A new guideline that has no repository yet is staged inside the
current one first, as [`smart-guideline-create`](smart-guideline-create.md)
already defaults to (`in-repo`, a staged sub-KG).

### Stages 0 and 7 belong to the user

The agent does not invent the use case or the application. If the request
does not describe them, ask a numbered question. Use the user's own words
where they gave any, and offer options drawn from the L2 personas and
processes already found:

> Which application are we building?
>
> 1. **A point-of-care app** for the DAK's main persona, covering its business
>    processes *(recommended when stage 4 found one dominant persona)*.
> 2. **A reporting / indicator dashboard** over the DAK's indicators.
> 3. **A decision-support service** (CDS Hooks / `$apply`) that an existing
>    EMR calls.
> 4. **Tell me more.**

### Stage 2 is skipped only for what is already in a KG

"Already ingested" means `library/<bib>/l1-extraction/` is there, declared,
and at the same source version. A library entry with no extraction still needs
the L1 half. Skipping is per source, not for the whole stage.

### Stages 3 and 5: dependency choice

A dependency decides what the guideline inherits, so the choice is an asset in
its own right and is adjudicated like one. Each candidate is one row:

| field | from | meaning |
|---|---|---|
| `packageId`, `version`, `uri` | cat-harness `DependsOnRecord` (`schemas/depends-on.ts`), the same three fields as FHIR `ImplementationGuide.dependsOn` | the candidate DAK or IG. A candidate missing one of the three is a `DependsOnGap`, not a row |
| `publisher` | — | WHO, or the adapting jurisdiction |
| `evidence` | smart-base KG `evidence` (`kg/src/graph.ts`) | the L1 KG nodes (and, at L3, the L2 assets) that point at it |
| `decision` | this skill | `reuse` (unchanged) · `adapt` (fork and change) · `extend` (depend and add) · `reject` |
| `reason` | this skill | one sentence; required for `reject` |

The agent lays the candidates out as a `decision-comparison` table and asks
through a `DecisionRequest` (`schemas/decision-request.ts`: two to four
options, a recommendation, and what happens if nobody answers). Under the
QA rule it goes ahead with its recommendation. The adjudicator's answer is
the stage's review decision.

Only `decision` and `reason` are new. Once adjudicated, a `reuse`, `adapt` or
`extend` row becomes an ordinary dependency: a `dependencies:` entry in
`sushi-config.yaml` at L3, and the DAK's own reference at L2.

**Reuse first.** This is the precedence `recommendation-extraction` already
uses for personas and processes: reuse an existing asset, then adapt one, and
create only when neither fits, with a `WARNING` saying none fitted. Prefer the
jurisdiction's adaptation over the WHO original when one exists for the same
scope, because it already holds the local decisions. Record the WHO original
too, as the upstream of that adaptation.

## Per-asset review

Every asset a stage **creates or changes** gets its own review item. An asset
that was reused unchanged gets none: its upstream's adjudication covers it.
The review item shows the asset the way its reviewer reads it, not as source,
on the staged preview. At L2 it is a run of [`l2-component-edit-review.bpmn`](../../../processes/content/l2-component-edit-review.bpmn), whose [skill](l2-component-edit-review.md) gives each row's checker, renderer and reviewer:

| level | asset | review shows |
|---|---|---|
| L1 | recommendation / remark / practice | the node beside the printed sentence and page |
| L2 | persona, user scenario | the card: role, goal, setting |
| L2 | business process (BPMN) | the rendered diagram (`render:bpmn` / `dak-swimlanes`) |
| L2 | decision table (DMN) | the table (`dmn2html`), with the L1 recommendation each rule cites, and its test cases |
| L2 | core data elements | data-dictionary rows (`dak-data-dictionary`) and their term diff (`dak-data-dictionary-diff`), and the **chosen wireframe** of each form that captures them (see [Forms are designed as wireframes](#forms-are-designed-as-wireframes-at-l2)) |
| L2 | indicators, requirements | the indicator definition / requirement list, each with the persona and process it serves |
| L3 | Questionnaire | the L2 wireframe it was derived from, beside the Questionnaire's field ↔ item correspondence (see below). The design was already reviewed at L2, so this review checks fidelity to it, not the design again |
| L3 | profile, logical model | the IG Publisher's differential view |
| L3 | CQL / PlanDefinition | the logic beside the DMN rule it implements, and its test cases passing or failing |
| L3 | terminology | the expansion, and the mapping to ICD-11 / SNOMED CT / LOINC |
| app | screen / flow | the chosen wireframe beside the running screen, walked through the L2 scenario it serves |

### Forms are designed as wireframes at L2

A data-entry form is designed once, at L2, and the L3 Questionnaire is
derived from that design. It is not designed at L3 and then drawn back as a
picture for review.

1. **Stage 4: design.** For each business-process activity where a persona
   records data, the agent runs `wireframe-design-review` in its **design
   use**. The intent comes from the L2 assets: the persona (who), the
   activity and its user scenario (what they do), and the core data elements
   the activity captures (what it shows). That produces two or more
   candidates, each with a web and a mobile layout, using real content: the
   data elements' labels, value sets and the DMN rules that show or hide a
   field. Each field carries the id of the core data element it captures (a
   `data-element` attribute). Under the QA rule the agent goes on with its
   recommended candidate. The review and the choice between candidates
   (`Process_Adjudication`, `Process_OptionsAnalysis`) are that form's
   stage-4 adjudication.
2. **Stage 6: derive.** The Questionnaire follows the chosen wireframe:
   one item per field, in its order and grouping, each item's `definition`
   pointing at the logical-model element of the same core data element, and
   `enableWhen` taken from the same DMN rules.
3. **Stage 6 review: fidelity.** It is fhir-harness's skill
   `fhir-questionnaire-wireframe` (process
   `Process_QuestionnaireWireframeReview`), run on each built Questionnaire
   with the chosen wireframe as its L2 wireframe. Its fidelity step is
   fhir-harness `check-wireframe-questionnaire`, which pairs the wireframe's
   `data-element` attributes with the Questionnaire items' `definition`s. A
   field with no item, an item with no field, or a different order is a
   finding. The check compares two lists and renders nothing:

   ```sh
   bun run fhir-harness/scripts/check-wireframe-questionnaire.ts <wireframe.html> <Questionnaire.json>
   ```

   A wireframe that draws web and mobile as separate subtrees marks each
   with `data-layout`, and each layout is checked on its own. A
   Questionnaire item names its data element by `definition` (the URL, or
   the element path after `#`) or by `code[].code`. Exit 0 faithful, 1 a
   finding, 2 unreadable input.

If the chosen wireframe changes later (a review asks for it), the
Questionnaire derived from it is flagged `rejected-upstream` like any other
derived asset. A change request on either side — through ✍ suggest or the
`questionnaire-change` issue form — says which side was edited, and the other
is brought back in line (`fhir-questionnaire-wireframe`, step 7).

**An adaptation is reviewed as a diff.** When the asset came from a stage-3 or
stage-5 dependency with `decision: adapt`, the review item shows **before**
(the upstream asset at its pinned version) and **after** side by side, with the
change highlighted, and the L1 node that justifies the change. At L3 the diff
is fhir-harness's `ig-ast-delta` (element-level, per resource). At L2, and
for anything rendered, it is `before-after-preview`, drawn with one of the
`DiffRenderer`s in `schemas/diff-renderers.ts`. A changed asset
with no L1 justification is a finding in its own right: an adaptation is local
evidence or local policy, and the KG has to say which.

The record of a review item is a cat-harness `QaReview` (`qa-review/v1`,
`schemas/qa-review.ts`): `subject` is the asset, and each verdict is a
`Decision` whose `role` is the adjudicator's role id. Its outcomes are the
ones to use:

| outcome | meaning here |
|---|---|
| `approve` | the asset stands |
| `request-changes` | reopen the stage for this asset. If the reviewer wrote the fix themselves, it goes in an `AuditNote` and the agent applies it as given |
| `reject` | the asset is wrong at the root (wrong source, wrong dependency). Reopen the stage that chose it |

At L1, `recommendation-extraction` keeps its existing `review: {by, at}`
fields on the mapping. The `QaReview` is the record of the stage's review,
not a replacement for those fields.

## New guideline or adaptation: one process

An adaptation is not a separate process. It is this process with stages 3 and
5 returning `adapt` decisions, which makes stages 4 and 6 show diffs. A new
guideline is the case where those stages return only `reuse`, `extend` or
nothing. Do not maintain two copies of the stages.

## What it reuses

| need | reused from | new? |
|---|---|---|
| each adjudication | cat-harness `Process_Review`, then `Process_Adjudication` on disagreement | no |
| review record and verdict | cat-harness `qa-review/v1`: `QaReview`, `Decision` (`approve` · `request-changes` · `reject`), `AuditNote` | no |
| who adjudicates | role ids: `clinical-sme`, `programme-manager`, `business-analyst`, `fhir-modeller`, `terminologist`, `reviewer`, and smart-base's `l1-extraction-reviewer` | no |
| staged preview, before/after links | `feature-staging`, `staging-review` | no |
| diffs | `ig-ast-delta` (L3), `before-after-preview` with `DiffRenderer` (L2, rendered pages) | the data-dictionary term diff `dak-data-dictionary-diff.ts` is new |
| form and app design | `wireframe-design-review`, design use: L2 forms (stage 4) and the application (stage 8a) | no; the stage-6 fidelity review is fhir-harness `fhir-questionnaire-wireframe`, whose field ↔ item check is fhir-harness `check-wireframe-questionnaire` |
| dependency row | `DependsOnRecord`, `DependsOnGap`, KG `evidence` | adds `decision` and `reason` |
| asking for a dependency choice | `decision-comparison`, `DecisionRequest` | no |
| provenance flag | KG `wasDerivedFrom` and edge `properties` | adds the values `pending` and `rejected-upstream` |

## What this does not change

- The WHO DAK component set and L1–L4 layering: [`smart-stack-layering`](smart-stack-layering.md).
- How a new repository or IG is set up: [`smart-guideline-create`](smart-guideline-create.md).
  Run it before stage 4 if the guideline has no home yet.
- The persona-swimlane lifecycle (planning, QC, translation, publication) on
  the IG's [Authoring Process](https://worldhealthorganization.github.io/smart-base/authoring-process.html)
  page. Those phases still run. This process says what goes *into* phases 2a
  and 2b, and what comes before and after them.
