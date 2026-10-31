# AGENTS.md — fhir-harness

The **bare** FHIR IG pipeline: SUSHI → IG Publisher → Jekyll → a pages branch,
with no pre-processing and no post-processing. It serves any implementation
guide.

## The one rule

**Nothing here may know about WHO.** Not `dak.config.json`, not the DAK logical
model, not `smart.who.int` canonicals, not the DAK API's names or the
post-processing that produces it, not the pre/post-processing steps, and
nothing from the `authoring-who-smart-guidelines` package. **Rendering** the
sidecars an IG publishes is generic and is here, as the IG API
(`ig-api-views.ts`; owner, 2026-10-03, bean `d313`); a WHO instance passes the
"DAK API" names in as configuration.

The import direction is the enforceable half: the WHO package may reference
this layer, this layer may not reference it. A violation **fails nothing** —
the build stays green and the layer simply stops being usable for the non-WHO
IG it exists for. That is why the refusal is written as a checkable list in
[`skills/fhir-ig-base/ig-build-pipeline.md`](skills/fhir-ig-base/ig-build-pipeline.md)
rather than left as an intention.

**It is a gate since 2026-10-03: `bun run cat check:fhir-harness-exclusions`.** It
is a ratchet over a baseline of the hits that were already here. A new one
fails CI. The fix is to move the WHO part up into the overlay, never to widen
the baseline. The skill above says what counts as a mention rather than a
dependency.

## Where the layer sits

```
folio-assistant-core → fhir-harness → the WHO SMART Base IG (L1 and DAK document kinds) → smart-ig
```

The owner's ruling, 2026-09-22. An IG that wants the DAK surface does not
change this pipeline — the DAK document kind in the WHO SMART Base IG supplies the
pre/post steps as an **overlay**. (Owner's stack ruling 2026-09-22, revised
2026-10-01: `smart-l1` and `smart-dak` became document kinds, #1767.) This
layer must not gain a `do_dak` flag: that would be this layer knowing about
DAKs.

Placement:
[`smart-stack-layering`](https://github.com/litlfred/smart-base/blob/main/smart-base/skills/content/authoring-who-smart-guidelines/smart-stack-layering.md).

## What is here

`skills/fhir-ig-base/`: `ig-build-pipeline`, `ig-render-jekyll`,
`ig-publisher-reduction` (the five phases), `ig-publisher-fork` (the AST
work, built as a library on top of the Publisher) and `ig-ast-delta` (list,
check, diff and render IG ASTs; `scripts/ig-ast.ts`). The package manifest is
the list, not this sentence.
`skills/fhir-client/` — `smart-launch` and `fhir-client-operations`, which use
the SMARTerFHIR library. `docs/`: this layer's pages on the platform's site
(the IG Publisher and FHIR content, authored under `docs/source/` and
rendered by the platform's docs-page run), plus the `ig-ast` wireframe. Nothing else, and the declaration says so: a declared-but-absent directory is the
`dh4f` defect, where a consumer scans nothing and reports a clean run over it.

## An IG repository declares nothing of this layer's

An IG repository that builds on this layer declares no `fhir-ast/`,
`fhir-artifact-index/` or docs directory of its own. It `needs` this layer, or
an overlay above it, and this layer supplies the rest from the AST on the
repository's own branch family: the site and the artefact index
([`ig-build-pipeline`](skills/fhir-ig-base/ig-build-pipeline.md), "The IG
repository's site route"; `ig-repo-site.ts`, `ast-to-artifact-index.ts`), and
its entry in the `ig-ast` viewer (`gen-ig-ast-pages.ts`, inherited through
`needs`). Its `fhir-artifact-index/` (index, menu, releases) is written at
publish by `ig-index:build` (`build-ig-indexes.ts`) from the same AST and the
IG's own `sushi-config.yaml`, so an IG instance commits none (#124). **Read that skill and the IG's own AGENTS.md before proposing a
folder, page or declaration for an IG.** An IG instance that does declare such
directories does so only because an index still mounts files it commits,
which #124 retires. That is an exception, not a pattern to copy. The one directory an IG repository does declare for this layer is an
`ig-annex` directory of annexes its pages load on demand, data no AST holds
(the skill above, "Annexes an IG's pages load on demand"). Owner, 2026-10-23: the AST listing "should
be inherited", because the IG depends on this layer.

## The skills this layer publishes

<!-- skills:index:begin -->

_17 skills in 3 directories, generated from each skill's front matter. `bun run cat readme:sync` rewrites this list and `readme:sync:check` fails when it is stale. Skills this repository inherits are listed by the repositories that publish them._

**`skills/content/fhir-ig-authoring/`** (6)

| Skill | What it is for |
|---|---|
| [`fhir-questionnaire-wireframe`](skills/content/fhir-ig-authoring/fhir-questionnaire-wireframe.md) | Show a built FHIR `Questionnaire` the way a person will meet it — a mid-fidelity wireframe at web and mobile width, and a live form — have it reviewed as a design, check that it says what the… |
| [`fhir-validation`](skills/content/fhir-ig-authoring/fhir-validation.md) | Validate an IG's FHIR artefacts against the profiles and packages they claim to conform to. |
| [`ig-publication`](skills/content/fhir-ig-authoring/ig-publication.md) | Build a FHIR Implementation Guide and publish it: version, tag, assemble the site, deploy. |
| [`l3-fhir-authoring`](skills/content/fhir-ig-authoring/l3-fhir-authoring.md) | Derive the **L3** layer — machine-readable FHIR artefacts — from an authored L2 DAK, using FHIR Shorthand and SUSHI. |
| [`pcf-consent`](skills/content/fhir-ig-authoring/pcf-consent.md) | Model IHE Privacy Consent on FHIR (PCF 1.1.0, Trial Implementation) and HL7 FHIR R4 `Consent` (Trial Use) resources referenced by canonical URL only, translate PCF Basic and Additional… |
| [`terminology-management`](skills/content/fhir-ig-authoring/terminology-management.md) | Bind a DAK's data elements to standard terminologies, and manage the value sets and concept maps that result. |

**`skills/fhir-client/`** (2)

| Skill | What it is for |
|---|---|
| [`fhir-client-operations`](skills/fhir-client/fhir-client-operations.md) | Reading, searching and writing FHIR R4 resources through the SMARTerFHIR client (`BaseClient` and its vendor subclasses): the launch-context reads, `requestResource`, `create` with its automatic… |
| [`smart-launch`](skills/fhir-client/smart-launch.md) | How a browser app performs a SMART on FHIR launch — EHR launch and standalone launch — with the SMARTerFHIR library: `SmartLaunchHandler`, the `LAUNCH` and `EMR` enums, the scopes it requests per… |

**`skills/fhir-ig-base/`** (9)

| Skill | What it is for |
|---|---|
| [`fhir-ig-create`](skills/fhir-ig-base/fhir-ig-create.md) | Somebody asked for a new FHIR Implementation Guide. |
| [`ig-ast-delta`](skills/fhir-ig-base/ig-ast-delta.md) | List and view what changed between two IG ASTs, check whether an AST is still valid for the IG's current inputs, and render the delta as just-the-docs pages that carry the provisional mark. |
| [`ig-binary-artefacts`](skills/fhir-ig-base/ig-binary-artefacts.md) | Where the IG Publisher's binary outputs go — full-ig.zip, package.tgz and its R4/R4B variants, package.db, validator packs, and the definitions, examples and expansions zips — and why a pages branch… |
| [`ig-build-pipeline`](skills/fhir-ig-base/ig-build-pipeline.md) | The bare FHIR IG pipeline — FSH to SUSHI to the IG Publisher to a pages branch, with no pre-processing and no post-processing. |
| [`ig-publisher-fork`](skills/fhir-ig-base/ig-publisher-fork.md) | Requirements for an agent working a local experimental fork of the IG Publisher — which repositories, what the AST must carry, what must not change, and the acceptance criteria. |
| [`ig-publisher-reduction`](skills/fhir-ig-base/ig-publisher-reduction.md) | The phased transition that reduces the IG Publisher to AST + QA — five phases, each with an exit criterion that is measured rather than asserted, and the staleness contract that makes an AST-backed… |
| [`ig-render-jekyll`](skills/fhir-ig-base/ig-render-jekyll.md) | Rendering a FHIR IG's content through the just-the-docs pipeline instead of mounting the IG Publisher's finished HTML — the JSON-only representation contract, navigation derived from… |
| [`ig-site-links`](skills/fhir-ig-base/ig-site-links.md) | What happens to an IG's links when its pages are rendered on our site rather than by the IG Publisher: which are rewritten (artefact pages, a case-only mismatch, the Publisher's downloads and pages,… |
| [`ig-site-theme`](skills/fhir-ig-base/ig-site-theme.md) | How an IG rendered through just-the-docs wears the theme its instance ALREADY declares: the one `webpage` theme becomes the IG site's colour scheme. |

<!-- skills:index:end -->

`schemas/ig-content-type.ts` registers the `ig` content type. A repository
declares itself an IG source with `contentTypes.ig` in its root
`index.config.json` (owner, 2026-10-30), not by carrying `sushi-config.yaml`.
The section's `include` lists the repository paths this layer reads, and a
path not on that list is not read. The owner's principle, 2026-10-30: "a
harness can point to a repo, but doesnt want to automatically slurpo up all
content in a repo. harness desclares what it it pays attention to in the
repo."

Every IG reader here asks `scripts/ig-read-scope.ts` before it touches a
path: `build-ig-indexes`, `ig-repo-site`, `build-ig-site`, `fsh-cone`,
`ingest-ig-menu`, `ingest-ig-chrome`, `ig-api-hub`, `ig-site-data`,
`ig-review-data` and `measure-logic-layer-edges`. A repository that declares
the section is read only within `include`; `ig-repo-site compose` and
`stageIgSite` stage from a copy of the declared paths. A repository that
declares none is a legacy IG: it is read as before, and one warning per run
names the missing section. A section with no usable `include` is refused.
To make a reader see a path it skips, add that path to `include` (a directory
ends in `/`) in the IG's own `index.config.json`, in the pull request that
needs it. The full rules, the warning's text and how to add a path are in
[`ig-build-pipeline`](skills/fhir-ig-base/ig-build-pipeline.md) §"What this
layer reads".
The input digest in `ig-ast.ts` is not gated: it must match the Java
exporter, and it names what SUSHI and the Publisher read. The `ig` type is
registered at load time by `pipeline/plugin-slots.ts`, the module the
contributions loader requires for every repository that depends on this layer.
