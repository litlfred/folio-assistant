---
title: "smart-* separation"
kind: proposal
issue: 1767
summary: >-
  How the staged smart-base, smart-trust and smart-immunizations instances leave
  folio-assistant for the litlfred forks: one harness named smart-base that
  every IG repo instantiates the same way, smart-base needing fhir-harness, and
  everything FHIR-generic pushed down into fhir-harness first. A per-file
  classification, the wrong-direction edges it found, six staged PRs and the
  questions that gate them.
---

# smart-* separation

Owner, 2026-10-01 (#1767), in three turns:

> *"right now in f-a repo, there are staging dirs smart-base, smart-trust that
> should be in litlfred forks instead … push generic stuff as much as possible
> into fhir-harness first"*

> *"harness should be named smart-base and every repo gets same
> `<stub=smart-base>.config.json` and `smart-base/` dir … where all the dirs
> live. like smart-base/library is under repo litlfred/smart-trust. smart-base
> harness needs viewer"*

> *"will also need a fhir-harness visualizer. smart-base depends on
> fhir-harness. generalize skills/tools to fhir-harness. specific smart-base
> skills/tools/processes only when necessary. analyze, create splitting plan …
> ask structured questions"*

The larger repository separation (cat-harness, cat-harness-tools, core) is a
sibling session's. This proposal covers only the smart-* instances and the
fhir-harness layer they stand on.

## The target shape

| repository | root | `smart-base/` |
|---|---|---|
| `litlfred/smart-base` | the WHO IG source, unchanged, plus `smart-base.config.json` | **this IG's data**: its artefact index, generated docs, kg-qa (and the corpus, per Q2) |
| `litlfred/smart-trust` | the IG source, plus `smart-base.config.json` | smart-trust's artefact index, menu, docs, kg-qa |
| `litlfred/smart-immunizations` | the IG source, plus `smart-base.config.json` | its artefact index (and 774 DAK sidecars), kg-qa |

**Every IG repository instantiates smart-base identically.** That is the
owner's rule, and it is what makes `kg:subscribe` (#1719) able to treat them as
one kind of substrate. Where the harness DEFINITION lives (skills, tools,
methodologies, voices) is Q1.

`needs` runs one way: **IG data → smart-base → fhir-harness → core.** Nothing
in fhir-harness may name WHO, DAK or SMART.

## What was measured

Every tracked file under `smart-base/`, `smart-trust/`, `smart-immunizations/`
and `smart-{l1,dak,ig}/` was read and classified. Bulk directories
(`library/`, `fhir-artifact-index/`, `docs/`) were classified as wholes. The
FHIR-related code outside those directories was classified too.

| destination | files | what |
|---|---|---|
| **F** fhir-harness | 2 in the dirs, ~18 outside them | `ig-artifact-ingestion` (generic part), the pages test; outside: `ingest-ig-{menu,chrome,artifacts}`, `ig-menu`/`ig-chrome`/`ig-metadata-index`/`fhir-artifact-index` schemas, `check-artifact-index`, `fsh-cone`, `pin-smart-base-terminology` (→ `pin-ig-terminology`), `ig-incremental-build` and `ig-ast-delta-review` BPMN, the IG Publisher / validator / SUSHI capability nodes, the `ig-publisher` and `fhir-content` docs |
| **S** smart-base harness | 33 | the `authoring-who-smart-guidelines` package (DAK pre/post, GRADE, L2, toolchain, layering), the WHO digital-health voice, DIIG and its BPMN, roles, L2 schemas, the WHO template theme (now in `smart-trust/themes/`), the WHO chrome |
| **D** per-IG data | 43, plus the bulk dirs | indexes, menus, generated docs, kg-qa, declarations, root configs |
| **X** retire or elsewhere | 25 | `smart-l1/`, `smart-dak/`, `smart-ig/` (boilerplate plus one kg-qa file each), smart-trust's stale `scripts/README.md` |

**Mixed files** (a generic mechanism with WHO parts) split rather than move
whole:
- `smart-base/tools/index.ts`: 4 of 9 Tool nodes are FHIR-generic. They are `logical-model-schemas`, `valueset-schemas`, `jsonld-vocabularies` and `smart-liquid-variables`.
- `fhir-artifact-index.ts` and `ingest-ig-artifacts.ts`: the DAK overlay (Q3).
- `gen-ig-pages.ts`: the DAK sections and the "WHO Implementation Guide" publish note.
- `dak-postprocessing.md`: steps 3–5 and 8 are generic.
- `package-manifest.json`: its IG Publisher, SUSHI and Java docker block is generic.
- `l3-fhir-pipeline.bpmn`: "Map L2 → L3" is the only DAK task.

### Wrong-direction edges found

No TypeScript import crosses today. The edges are in declarations and data,
which is why no import check has caught them:

1. **fhir-harness's four skill definitions declare `"package":
   "authoring-who-smart-guidelines"`**, which is smart-base's package. They are
   `fhir-validation`, `ig-publication`, `l3-fhir-authoring` and
   `terminology-management`.
2. `l3-fhir-authoring.json` `dependsOn` the S skill `l2-dak-authoring`. Its
   input schema also requires "L2 DAK source material".
3. `ig-publication/input.schema.json` enumerates the publication target
   `smart-who-int`.
4. Prose links from fhir-harness into smart-base: `AGENTS.md`,
   `ig-build-pipeline.md`, `ig-render-jekyll.md` and `tools/index.ts`.
5. `cat-harness/cat-harness.json` declares `smart-base-library`,
   `smart-base-methodologies` and `smart-base-processes`.
6. `smart-trust.json` and `smart-immunizations.json` `need` `smart-ig`, a
   layer that holds nothing.

## Staged PRs

Each PR is green on its own and reversible on its own. A later one never
lands before an earlier one.

| # | PR | gated on |
|---|---|---|
| A | **The generic page generator, and a `/smart-base/` landing page.** `gen-smart-trust-pages.ts` becomes `fhir-harness/scripts/gen-ig-pages.ts`; smart-trust's 681 pages stay byte-identical. smart-base gets `docs/` via `--summary`. The banner takes its identity from the index, never from a chrome ingested from another IG. #1768 | — |
| B | **fhir-harness takes the generic code**: `ingest-ig-menu`, `ingest-ig-chrome` (its `who.css` default becomes a flag), the `ig-*` schemas, `check-artifact-index`, `fsh-cone`, `pin-ig-terminology` and the generic BPMN. It also fixes edges 1–4 and moves the 4 generic Tool nodes (Q6, default). | — |
| C | **The fhir-harness visualizer.** `fhir-artifact-index` gets a kind viewer at `/fhir-artifact-index/<instance>/` for every instance that holds one, generated by `gen-ig-pages`. So no instance needs a script of its own, and harness-tiles' "no viewer yet" finding closes. The DAK sections become an overlay that smart-base supplies (Q3, decided: neutral overlay). | — |
| D | **The smart-base harness, consolidated**: the WHO theme moves from smart-trust to smart-base, `chrome.json` is re-keyed to the template (Q4), `needs` are repointed to smart-base, and smart-l1 / smart-dak become L1 and DAK **document kinds with visualizers** inside smart-base (Q5, decided below). | Q4 |
| E | **Seed the forks.** One PR per fork, on a branch: `smart-base.config.json` plus `smart-base/`, laid out per Q1 and Q2 (the harness definition at litlfred/smart-base's root), carrying the history of the moved files. | A–D |
| F | **folio-assistant subscribes** to the three forks (`kg:subscribe`, #1719) and instantiates them. The **cutover** retires the staged copies into fsh-guts as verified archives (`state:seed --cutover`) rather than deleting them (owner, 2026-10-06: *"cutover dirs should go to fsh-guts"*; the archive form chosen over plain trees the same day), and happens only on the owner's explicit OK (`deletion-requires-confirmation`). | E, owner |

## Questions

Each has a default the work proceeds on.

**Q1. Where does the harness definition live in `litlfred/smart-base`**, which
is both the harness and an IG that instantiates it?
- (a) **Default.** The definition at the repo root (`skills/`, `tools/`, `methodologies/`, `scenarios/`), and the IG's own data under `smart-base/` like every other IG. This keeps "every repo instantiates it the same way" true of litlfred/smart-base too.
- (b) Both under `smart-base/`.
- (c) A separate harness-only repository.

**Q2. Who owns `library/`**, the WHO digital-health corpus (2,430 files)?
- (a) **Default.** litlfred/smart-base's own data. No IG reads it; the voice and DIIG cite it, and those citations still resolve under Q1(a).
- (b) Part of the harness, so every repo inherits it.
- (c) A corpus repository of its own.

**Q3. The DAK overlay** in the artefact-index schema, the ingest and the pages:
- (a) A `dak` field kept in fhir-harness. Quick, but it breaks "no WHO in fhir-harness".
- (b) **Default.** A neutral per-artefact sidecar overlay (`schema`, `displays`, `openapi`, `jsonld`) in fhir-harness, with smart-base supplying the "DAK API" label and hub. Three of the four sidecar producers are FHIR-generic anyway. This needs a one-time migration of the committed `index.json` files.
- (c) A passthrough schema in fhir-harness that smart-base extends with plugins.

**Q4. `chrome.json`**: it sits in smart-base but describes `smart.who.int.trust` 1.8.0.
- (a) **Default.** Re-key it to `who.template.root`, the template every smart-* IG builds with, and ship it with the harness.
- (b) Re-ingest it per IG.
- (c) Move it to smart-trust.

**Q5. smart-l1 / smart-dak / smart-ig**:
- (a) **Default.** Retire them, fold their one-question tests into `smart-stack-layering`, and repoint `needs` to smart-base.
- (b) Keep them as sub-harnesses.

**Q6. The four generic Tool nodes** in smart-base:
- (a) **Default.** Declare them in fhir-harness now, with a new fhir-harness skill for them to satisfy and the Python still run from WHO's checkout. The Library strippers set this precedent.
- (b) Wait until the scripts themselves move.

**Q7. Graph-typology registration** for `fhir-artifact-index`: keep the entries in
core, with validator pointers repointed into fhir-harness (**default**). A way
for a harness to contribute kinds is a separate bean.

## Decided

Owner, 2026-10-01:

- **Q1 → (a).** The harness definition sits at the root of `litlfred/smart-base`, and that IG's own data under `smart-base/`, exactly as in every other fork.
- **Q2 → (a).** `library/` is litlfred/smart-base's own data.
- **Q3 → (b).** A neutral sidecar overlay in fhir-harness, with smart-base supplying the "DAK API" label and hub.
- **Q5 → neither option. A reframe.** The owner, verbatim: *"what they really need to be are sub-document types/kinds/visualizer for them. smart-L1 is like a L1 document that was fully computable from smart-base assets (and maybe some other things like PICO, cochrane, etc), semi fixed structure … similarly DAK is a publication type w/ the 10 components, fixed structure."* So `smart-l1/` and `smart-dak/` stop being **harnesses** and become **document kinds inside the smart-base harness, each with a visualizer**:

  | kind | structure | computed from |
  |---|---|---|
  | L1 | semi-fixed | smart-base assets (`library/`), plus external evidence such as PICO and Cochrane |
  | DAK | fixed: the ten components | L1 content and authored L2 |

  The DAK half has a head start: `cat-harness/schemas/dak.ts`, `dak-blocks.ts` and `dak-content-type.ts` already exist and, by this plan, are S-destined. `smart-ig` has no counterpart in the owner's reframe; it is treated as the IG publication the DAK feeds (fhir-harness's concern) until told otherwise. The L1 library is to grow PCMT and the other WHO digital-transformation handbooks; that has its own bean. Stage D therefore stops **retiring** the three directories and **re-homes** them as kinds; the `needs: smart-ig` edges are repointed to `smart-base` either way.

- **Q4, Q6 and Q7** proceed on their defaults.
- **The `l3-fhir-authoring` → `l2-dak-authoring` edge** (raised in stage B): owner chose option 1. It stays for now. In stage D the generic skill's input becomes a source model, and smart-base supplies the L2 → L3 specialisation.

- **Stage D decisions** (owner, 2026-10-01, before stage D started; bean `kg83`):
  - **Old layers:** `smart-l1/` and `smart-dak/` are retired; their content becomes the L1 and DAK kinds above. **`smart-ig/` stays**, as the IG-publication layer the DAK feeds, so smart-trust and smart-immunizations keep `needs: smart-ig`.
  - **Q4 → (a):** `chrome.json` is re-keyed to the template (`who.template.root`) and ships with the smart-base harness.
  - **DAK code:** `dak.ts`, `dak-blocks.ts` and `dak-content-type.ts` all move into smart-base, and the partition rule that filed `dak-blocks.ts` as core follows.
  - The stack's merge into `main` is paused at stage C (#1783) while stage D is built on top of it.

## What would change this plan

- **A gate that cannot pass in a fork.** Every smart-* page gate today runs
  inside folio-assistant's CI. If a fork cannot run `gen-ig-pages` without
  cloning folio-assistant, E needs a tools package first, as `kg-separation`
  stage 6 requires.
- **A second consumer of the corpus.** If an IG starts reading `library/`, Q2
  flips to (b).
- **WHO adopting the forks upstream.** That changes where E's PRs go, not what
  they carry.
