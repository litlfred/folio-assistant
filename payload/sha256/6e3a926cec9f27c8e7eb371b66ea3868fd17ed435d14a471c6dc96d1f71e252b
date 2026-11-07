---
name: ig-build-pipeline
description: >
  The bare FHIR IG pipeline — FSH to SUSHI to the IG Publisher to a pages
  branch, with no pre-processing and no post-processing. What this layer runs,
  what it emits, and the list of things it deliberately refuses to know about.
  Owns the AST cache lifecycle: an IG site is built from the AST on
  its cache branch, the publish refuses a stale one, and the reusable
  `ig-ast-refresh.yml` is the one writer. Owns what an IG reader may read:
  `contentTypes.ig.include` in the repository's `index.config.json`, and the
  legacy warning for a repository that declares none. Read before adding anything to
  fhir-harness, before onboarding, converting or changing the workflows of an
  IG repository, and before publishing an IG site.
governs:
  - fhir-harness/fhir-ig-tools
---

# ig-build-pipeline

> Skill id: `ig-build-pipeline` · Package: `fhir-ig-base` · Instance:
> `fhir-harness`

The **base**: run the FHIR IG Publisher over an IG, with no pre-processing and
no post-processing, and publish the result. It serves any FHIR IG; see
§"What this layer refuses to know about".

## The pipeline

```
input/fsh/          →  SUSHI      →  fsh-generated/resources/
input/pagecontent/  ┐
sushi-config.yaml   ┘  →  IG Publisher (JVM, Docker)  →  output/
                                                        →  publish to a pages branch
```

The publish target (the pages branch) is declared by the instance.

SUSHI and the Publisher both need `packages.fhir.org`. Where it is refused,
see [`fhir-validation`](../content/fhir-ig-authoring/fhir-validation.md)
§"When a package host refuses you" before concluding either cannot run.

## Source of truth versus compiled, cached and rendered output

The boundary is declared in [`schemas/ig-content-type.ts`](../../schemas/ig-content-type.ts):
`contentTypes.ig.include` in `index.config.json` defaults to
`["input/**", "sushi-config.yaml", "ig.ini", "publication-request.json"]` and
excludes `output/**`, `temp/**`, `template/**`, `fsh-generated/**` and
`input-cache/**`. Only the files inside `contentTypes.ig.include` (plus any
declared `ig-annex` directory) are hand-authored source.

| Authoritative source (edit here) | Compiled, cached or rendered output (never hand-edit; overwritten on build or publish) | Basis |
|---|---|---|
| `sushi-config.yaml` (`id`, `canonical`, `version`, `status`, `releaseLabel`, `fhirVersion`, `dependencies`, `pages`, `menu`), `ig.ini`, `publication-request.json` | `fsh-generated/resources/ImplementationGuide-*.json`, `output/`, `fhir-artifact-index/ig-identity.json`, `fhir-artifact-index/menu.json`, `fhir-artifact-index/releases.json`, `site.data.fhir` | `schemas/ig-content-type.ts` (`IG_DEFAULT_INCLUDE`), [`ig-render-jekyll`](ig-render-jekyll.md) |
| `input/fsh/**/*.fsh` | `fsh-generated/resources/*.json`, `fsh-generated/data/fsh-index.json`, `fsh-generated/includes/fsh-link-references.md` (even when `fsh-generated/` is committed in a legacy checkout, it is SUSHI's compiler output — edit the `.fsh` source, never the generated JSON) | `schemas/ig-content-type.ts` (`IG_DEFAULT_EXCLUDE`), [`ig-ast-delta`](ig-ast-delta.md) §"`fsh-index.json`" |
| `input/cql/**/*.cql` and `input/maps/**/*.fml` | Compiled `Library` (base64 ELM/CQL `content[]`) and `StructureMap` resources in `output/` and `output-ast/` | [`l3-fhir-authoring`](../content/fhir-ig-authoring/l3-fhir-authoring.md), [`ig-ast-delta`](ig-ast-delta.md) |
| `input/pagecontent/**/*.md`, `input/includes/**`, `input/translations/**/*.po`, and declared `ig-annex` directories (`annexes.json`) | Rendered HTML in `output/`, composed thin pages in `$SITE_WORK/` / `docs/`, and copied `assets/annex/*` | [`ig-render-jekyll`](ig-render-jekyll.md) §"Thin pages, the default"; §"The IG repository's site route" below |
| `input/images-source/*.plantuml` | `input/images/*.svg` written by the Publisher when a same-stem `.plantuml` exists in `input/images-source/` (hand-placed static assets under `input/images/` with no `.plantuml` stem are source) | [`ig-ast-delta`](ig-ast-delta.md) §"`validity`" |
| `input/**` + `sushi-config.yaml` + `ig.ini` | `output-ast/` and the AST cache branch `cat/fhir-harness/fhir-ast/<package id>` (`manifest.json` with `"authority": "cache"`, `dependencies.json`, `fsh-index.json`, `expansions.json`, `txcache/`), written only by `ig-ast-refresh.yml` | §"The AST cache lifecycle", [`ig-ast-delta`](ig-ast-delta.md) |
| The AST + `sushi-config.yaml` | `fhir-artifact-index/` (`index.json`, `menu.json`, `ig-identity.json`, `releases.json`, `sidecars/`), `ast-data/`, `artifact/<Type>-<id>.{html,jsonld,json}`, `assets/ig-search.json`, `folio-build.json`, and the published site on `gh-pages` (root and `branches/<branch>/`) | §"The IG repository's site route" |

An overlay using `pre-export` or `ig-site:sidecars` documents its own
authority table in its own skill. This layer puts back everything
`pre-export` touched before it records the clean commit's input digest
(§"The AST cache lifecycle").

## Version numbering: SEMVER for a FHIR IG

An IG's version is declared in `sushi-config.yaml` `version` (and mirrored in
`publication-request.json` `version` when cutting a release). It is always an
exact `MAJOR.MINOR.PATCH` semantic version triple (`versionIncrement: "major" |
"minor" | "patch"` in [`ig-publication`](../content/fhir-ig-authoring/ig-publication.md);
[`directory-conventions`](../../../cat-harness/skills/kg/kg-core/directory-conventions.md)
§"Pinning a reference"), never a range or floating tag. Which segment bumps is
determined by the delta on the IG's published conformance and canonical surface
since the previous release — measured over the AST with
`ig-ast.ts diff <prev-ast> <next-ast>` ([`ig-ast-delta`](ig-ast-delta.md) §"Diffing two ASTs"),
not from commit messages:

| Increment | What triggers the bump on a FHIR IG | Examples |
|---|---|---|
| **`major`** (`X+1.0.0`) | Any **breaking** change to the IG's canonical conformance surface, terminology bindings, CQL/operation signatures or FHIR version that can invalidate a conforming instance or downstream dependent IG | Removing or renaming a canonical resource (`StructureDefinition`, `ValueSet`, `CodeSystem`, `Library`, `PlanDefinition`, `Measure`, `Questionnaire`, `OperationDefinition`, `ConceptMap`, `StructureMap`); tightening cardinality (`0..*` → `1..*`, `0..1` → `1..1`) or adding a new required (`min >= 1`) element or `error`-severity invariant on an existing profile or logical model; strengthening a binding to `required` or replacing its bound `ValueSet` incompatibly; removing or changing the meaning of a concept in a published `CodeSystem`; incompatible change to a CQL library's public expression names/types or an `OperationDefinition`'s parameters; changing `fhirVersion`; or a breaking major bump in `dependencies:` |
| **`minor`** (`X.Y+1.0`) | Any **backward-compatible addition** to the IG's canonical resources, profiles, terminology, logic or narrative structure | Adding a new canonical resource (profile, logical model, extension, `ValueSet`, `CodeSystem`, `ConceptMap`, `Library`, `PlanDefinition`, `Measure`, `Questionnaire`, `ActivityDefinition`, `ActorDefinition`, `Requirements`); adding an optional (`min = 0`) element, optional slice or `warning`/`guideline`-severity invariant to a profile or logical model; adding concepts to a `CodeSystem` or widening a `ValueSet` expansion (`extensible` / `preferred` / `example` bindings); adding examples/instances or new narrative pages in `sushi-config.yaml` `pages:`; or a compatible minor update in `dependencies:` |
| **`patch`** (`X.Y.Z+1`) | Any **backward-compatible fix** that adds no canonical resource and breaks no conforming instance | Narrative prose, layout or typo fixes in `input/pagecontent/**`; description, title, comment or mapping metadata edits on existing elements; translation updates in `input/translations/**`; fixing invalid example instances; bug fixes in CQL expressions or FML maps that preserve declared inputs, outputs and clinical/functional intent; or rendering/theme fixes |

**Release vs development cycle and dependency pinning:**

1. **Cutting a release (`vX.Y.Z`)**: requires human `release-authorization`
   ([`ig-publication`](../content/fhir-ig-authoring/ig-publication.md)), a
   full AST build (`ig-ast.ts build-kind output-ast --require-full`),
   `status: active` and `releaseLabel: release` in `sushi-config.yaml`, a
   matching `version: "X.Y.Z"` entry in `publication-request.json`, and every
   entry under `sushi-config.yaml` `dependencies:` pinned to an exact
   `MAJOR.MINOR.PATCH` release version — never `current`, `dev`, a branch name
   or a commit SHA (checked by `bun run cat check:published-refs`).
2. **Between releases on the default branch**: `sushi-config.yaml` carries
   `status: draft` and `releaseLabel: ci-build` (or `ballot` during a ballot
   cycle) with the next target `MAJOR.MINOR.PATCH` version. Pre-release ballot
   or candidate cuts may append `-ballot` or `-rc.N` while keeping the target
   `MAJOR.MINOR.PATCH` core.
3. **Overlay co-versioning**: when an overlay pairs the IG with an upstream
   domain model in `index.config.json` `contentTypes`, the overlay's own skill
   defines how the two version numbers relate.

## What the Publisher run emits

See [`ig-publication`](../content/fhir-ig-authoring/ig-publication.md)
§"The render-IG phase".

## What the site build emits: thin pages, by default

The Jekyll phase emits thin pages: each artefact page and the IG's
`artifacts.html` and `toc.html` are a few KB that load their content from
JSON-LD nodes (`artifact/<Type>-<id>.jsonld` and `artifact/index.jsonld`).
Each artefact's tab views (definitions, mappings, JSON and examples) are thin
pages beside it, drawn from the resource's JSON. The IG's narrative pages
keep their prose, with every piece of chrome linked rather than inlined. Full
pages: pass `--full-pages` to `gen-ig-pages.ts` and `stage-ig-sites.ts`. What
each page holds, and the QA over the nodes, is
[`ig-render-jekyll`](ig-render-jekyll.md) §"Thin pages, the default".

## The AST cache lifecycle: an IG site is built from the AST

Process: [`ig-ast-cache.bpmn`](../../processes/content/ig-ast-cache.bpmn).

Terms:

- **AST**: the per-resource dump the IG Publisher AST exporter writes
  (`output-ast/`; formats in [`ig-ast-delta`](ig-ast-delta.md)).
- **Cache branch**: `cat/fhir-harness/fhir-ast/<package id>` on the IG's own
  repository, one orphan commit holding the AST, the Publisher's
  `expansions.json` and its `txcache/`. `<package id>` is `sushi-config.yaml`'s
  `id`.
- **Valid**: `ig-ast.ts validity` says the AST was built from the inputs the
  commit being published has (Publisher version, `sushi-config.yaml`,
  `ig.ini`, `input/`).

**The rule.**

1. **The site is built from the cache-branch AST; the publish runs no
   Publisher** and never uses the Publisher's HTML. Its first step is
   `ig-site:ast` (`ig-repo-site.ts ast`): `ig-cache.sh restore --ig-root .`,
   then `validity`, as `ig-cache.sh verify` does. §"The IG repository's site
   route" has the steps after it.
2. **The publish refuses an AST that is not valid**: `stale-inputs`,
   `cannot-tell`, or no cache at all. It does not fall back to a Publisher
   build or to the Publisher's HTML. **A preview (a STAGING, non-release
   build) accepts a stale or cannot-tell AST by default** (owner, 2026-11-05:
   "preview/staging (non release) builds can be on stale cache"): publish it
   at once, never wait on a cache refresh for it. `SITE_ACCEPT_STALE_AST=0`
   makes a preview refuse one too. The root still refuses; `folio-build.json`
   records the verdict the preview was built on.
3. **A commit that changes no input does not make the AST stale.** If the
   recorded commit is an ancestor of HEAD and the input digest is unchanged,
   the AST is still valid (`sameSourceAs` in `ig-ast.ts`), so a README or
   workflow merge needs no rebuild. A checkout that cannot see the recorded
   commit (a shallow clone) reads as stale. It never reads as valid.
4. **Only a Publisher run refreshes the cache.** Whenever the IG's source
   changes, someone has to run it. The workflow below is the usual writer.
   **When its run is queued and the root has to go out, build it where the
   checkout is** (owner, 2026-11-05: "local/agentic build and push to
   gh-pages"): `bash fhir-harness/scripts/ig-ast-build.sh --ig-root .` (the
   workflow's build step as a script; it needs Java, Maven, Node, Ruby and the
   Publisher's network; pass the same `--template-repo` the caller gives the
   workflow as `template-repos`, e.g. `--template-repo
   who.template.root=WorldHealthOrganization/smart-ig-template` for a WHO
   IG, whose `#current` template the build server does not list), then `bash fhir-harness/scripts/ig-cache.sh seed
   --ig-root . --push` on the default branch, then the publish. Do not wait on
   a queued runner for a publish an agent can do.

**Who writes the cache: one workflow, here.**
[`.github/workflows/ig-ast-refresh.yml`](../../.github/workflows/ig-ast-refresh.yml)
(`workflow_call`) is the only writer. The IG repository's `site-publish.yml`
(the [template](../../templates/ig-repo-site/site-publish.yml)) calls it as its
first job, `ast`, so a publish refreshes the cache before it builds: a no-op
when the cache is valid for the commit. No IG repository carries a workflow of
its own for it. A repository that wants the cache refreshed on every push to
its IG sources may add the optional caller
[`templates/ig-repo-site/ig-ast-refresh.yml`](../../templates/ig-repo-site/ig-ast-refresh.yml). One run:

1. mounts the layers the IG repository's `index.lock.json` pins;
2. restores and judges the cache for `ref` (default `main`);
3. if the cache is not valid, or `force` is set, runs the caller's
   `pre-export` command when it gives one, then builds the IG with
   `AstExportCli` (Tool `ig-ast-export`, pinned `ast-export-ref`);
4. puts back what `pre-export` changed in the inputs, and checks that the new
   AST is valid for its own commit;
5. seeds the cache with `ig-cache.sh seed --push`, only when the commit is on
   the default branch with the tip's inputs. Otherwise the AST is uploaded as
   a run artefact, `output-ast`.

**A stale cache is rebuilt incrementally; a release is cut from a full
build.** Step 3 does not always run a full Publisher build:

- When the cache is **stale**, the run is not `force`, and the caller gives no
  `pre-export`, it runs `IncrementalBuildCli` over the restored cache. That
  rebuilds only the cone of what changed and merges it over the cache (skill
  [`ig-publisher-fork`](ig-publisher-fork.md)). Its own plan falls back to a
  full build when it cannot tell, and a failure, or a merged AST that is not
  valid, falls back to `AstExportCli`.
- A cache that is **missing** or **cannot-tell**, a **`force`** run, and a
  caller with a **`pre-export`** always build in full. A `pre-export` changes
  the work tree, which the incremental build refuses.
- The run's `kind` output, and `ig-ast.ts build-kind output-ast`, say which kind
  of build it was: `full`, or `incremental` (the manifest is `mixed`, with an
  `incremental` lineage).
- **A release is cut from a full build only.** Any step that cuts a release
  runs `ig-ast.ts build-kind output-ast --require-full`, which exits 1 on an
  incremental AST. To get a full AST, run the refresh with `force`.
- **The site says which kind of build it came from.** `folio-build.json`
  carries `ast.kind` beside `ast.verdict` (`ig-repo-site.ts`, the
  `publisher-pages` step).

**A preview is built from its own branch's AST.** The template's `ast` job
passes `ref: github.ref_name`, and when that run rebuilt without seeding, the
`publish` job downloads the run's `output-ast` before `ig-site:ast` runs, which
keeps an AST already in the checkout when it is valid for the commit. So a
branch that changes the IG's inputs gets a preview of its own content, and
the shared cache stays the default branch's. `folio-build.json` names the AST
it used (`ast.commit`, `ast.verdict`) beside `source`.

Seeding is refused below 90% of the incumbent's resources or edges (the
no-shrink gate in `compiled-artefact-cache`). The run builds no site, writes
no gh-pages and dispatches nothing. The Tool node is `ig-ast-refresh`.

**An overlay's preparation: `pre-export`.** Some IGs prepare their inputs
before the Publisher runs: an overlay registers pages in `sushi-config.yaml`
or generates resources from other sources. The caller passes the command as
the optional `pre-export` input, written in its own workflow file. This layer
runs it with `bash` at the IG root and knows nothing about what it does: the
overlay names its own steps.

The run records the clean source digest (`ig-ast.ts digest`) before
`pre-export`, restores the inputs after the export, checks the digest again,
and writes it into the manifest's `inputs` (`ig-ast.ts source-inputs`). The
prepared tree's digest and the command go under `preExport`, so the cache
verifies on any clean checkout. A failing `pre-export` fails the run, and
nothing is seeded.

**When it runs.** Only when a person, or an agent named for that run,
dispatches it. An agent never dispatches it on its own (`feature-staging`
§"Agent-run repositories"). Adding a `push` trigger on the default branch,
filtered to `sushi-config.yaml`, `ig.ini` and `input/**`, is decided per
repository by its owner.

## What this layer reads: `contentTypes.ig.include`

An IG repository declares which paths this layer reads in its root
`index.config.json`; nothing else is read:

```json
"contentTypes": {
  "ig": { "include": ["sushi-config.yaml", "ig.ini", "input/fsh/", "input/pagecontent/"] }
}
```

The section is the `ig` content type (`schemas/ig-content-type.ts`). An entry
ending in `/` is a directory and covers everything under it; any other entry
is one file. Paths are repository-relative and POSIX: absolute paths, `..`,
`.`, backslashes and empty segments are refused. `sushi-config.yaml` is not
the marker: a repository is an IG source because it declares the section.

**Every IG reader here honours it.** Each one asks `scripts/ig-read-scope.ts`
(`igReadScope(root)`) before it touches a path: `build-ig-indexes`,
`ig-repo-site`, `build-ig-site`, `fsh-cone`, `ingest-ig-menu`,
`ingest-ig-chrome`, `ig-api-hub`, `ig-site-data`, `ig-review-data`,
`measure-logic-layer-edges` and `check-translation-supplements`. An undeclared optional directory (`input/images/`,
say) reads as absent; an undeclared file a reader cannot work without
(`sushi-config.yaml`) is refused with the path named. `ig-repo-site compose`
and `stageIgSite` stage from a copy of the declared paths only. Not gated:
`index.config.json` itself, and the `ig-ast.ts` input digest, which must
match the Java exporter's. The list bounds the harness, not SUSHI or the
Publisher.

**A repository that declares no section** is a legacy IG. Every path is read,
and each run prints one warning per repository:

```text
warning: <root> declares no contentTypes.ig in its index.config.json, so fhir-harness reads it as a legacy IG (every path). Declare "contentTypes": { "ig": { "include": [...] } } there, listing the paths the harness reads (see fhir-harness schemas/ig-content-type.ts).
```

When you see it, declare the section; do not silence the warning. A section
that is there but has no `include`, an empty one, or a bad entry is refused
outright: a section that declares nothing is never read as "everything".

**Adding a path.** When a page, a diagram or a data file is missing from the
site and the IG declares the section, check `include` before the reader. Add
the path to `contentTypes.ig.include` in the IG's own `index.config.json`
(a directory with a trailing `/`), in the same pull request as the content
that needs it, and say in the description which reader needed it. Add the
narrowest path that covers it, never `""` or the repository root. Example:
the WHO SMART Base IG includes `input/diagrams/`, `input/archimate/`,
`input/dmn/` and `input/ignoreWarnings.txt`.

## The IG repository's site route: the layers supply the steps

An IG repository declares no `site.build`. It holds `index.config.json` with
`"site": {"landing": "<layer>"}`, and the site route (`stage-local.ts`,
cat-harness-tools) asks the mounted layers' script table for these step
names, never naming a layer:

| slot | when | provided by | what |
|---|---|---|---|
| `ig-site:ast` | pre, required | this layer | restore the AST from the cache branch and judge it (rule 1 and 2) |
| `ig-site:sidecars` | pre, optional | the landing layer | the IG API sidecars from the AST, into `$SITE_WORK/ig-api/` |
| `render:bpmn` | pre, optional | cat-harness-tools | the site's drawing of every diagram, at `docs/assets/img/workflows/` of the harness's docs, which the process pages embed; built at publish, never committed |
| `ig-site:compose` | source, required | this layer | the artefact index from the AST, the thin pages, the IG composed at the root |
| `ig-site:openapi` | site, when the IG holds `openapi/cat-openapi.config.json` | cat-harness-tools | a page and an IRI for each OpenAPI operation, at `openapi/` |
| `ig-site:publisher-pages` | site, required | this layer | the AST's data served, the Publisher-chrome guard, the build stamp |
| `ig-site:bar` | final | this layer | the language picker and the IG's slim bar on the pages the platform wrote after `publisher-pages` (`ig-repo-site.ts bar`) |

**The handshake with a layer above** (`ig-repo-site.ts`):

- **Input**: a sidecar step leaves its files in
  `$SITE_WORK/ig-api/sidecars/`.
- **Descriptor**: what the IG calls them, in `$SITE_WORK/ig-api/ig-api.json`
  (`{ "label": "..." }`).
- **Binding**: this layer binds whatever is there to the artefacts by the
  Publisher's file names (`ast-to-artifact-index.ts --sidecars`), labels the
  pages with the descriptor's label, and serves the files at
  `fhir-artifact-index/sidecars/`. It knows no producer and writes no label
  down; with nothing there it binds nothing and the pages say "IG API".
- **Serving path**: files the layer above leaves in `$SITE_WORK/ig-api/site/`
  (its own pages over the sidecars, such as an OpenAPI page at
  `openapi/index.html`) are served verbatim at the site root, never over a
  path the site already holds. The Publisher-chrome guard judges them like
  every other page.
- **Placeholder exception**: a page of the IG's own that holds the
  descriptor's `"placeholder"` marker is a shell around the layer's content,
  and the layer's page at the same path replaces it. No other page is
  replaced.

**What the site serves from the AST**: each resource under `ast-data/` (the
thin pages' data, `gen-ig-pages --compiled-data ast-data`) and under the
Publisher's name `<Type>-<id>.json` at the root (the narrative's links), the
artefact index at `fhir-artifact-index/index.json`, and the AST as
`site.data` for the IG's own pages. The grouping of the IG's committed
`fhir-artifact-index/index.json` is kept when it holds one, since the AST
stops before the Publisher assigns categories.

**Annexes an IG's pages load on demand** (a data dictionary, say, rather than
the full workbook):

- **What an annex directory is**: the one directory an IG repository declares
  for this layer, because the data is the IG's own and no AST holds it. It is
  of the generic `ig-annex` kind (`typologies/ig-annex.json`) and holds
  `annexes.json` (`ig-annexes/v1`: `{ page, file, columns? }` per annex,
  `file` beside it). The files themselves sit in a directory nested inside,
  declared with the producing layer's own kind; this layer names none of
  them.
- **Who reads it**: `compose` and `stage-ig-sites.ts`, through `annexesFor`.
  Each copies every file to `assets/annex/` and mounts `ig-annex.js` on the
  page. An index also reads a committed `fhir-artifact-index/annexes.json` if
  present (legacy location; do not use).
- **Link check**: a `.md` annex is appended to its page as written, so its
  links address that page, not the directory holding the file. The kind says
  so (`shownOnPublishedPages`), which keeps them out of the harness's
  source-tree link sweep, and `bun run cat check:ig-annex-links`
  (`scripts/check-ig-annex-links.ts`) judges them from the host page instead:
  each `x.html` must be a page the IG serves, and each `#id` an id that page
  (its annexes included) carries.

## The deploy phase

Deploying to a pages branch belongs to this layer: the history page, the CI
build banner, the release-link fix, deleting files over 100 MB, and a deploy
that retries on a ref conflict. Commenting on a pull request that a deploy
finished belongs to cat-harness.

## Who starts a build

Before an adopted IG repository publishes on its own, two questions are put
to its owner: whether automatic gh-pages builds become manual-only, and
whether to install the just-the-docs site. They are in
[`fhir-ig-create`](fhir-ig-create.md) §"4. Who starts a build".

## What this layer refuses to know about

A list, because "generic" is a claim and a list is checkable. `fhir-harness`
must contain no reference to:

- `dak.config.json` (`dak.json` as upstream still spells it), the DAK logical
  model, or any DAK component
- `smart.who.int` canonicals, or any WHO publisher metadata
- the DAK API's NAMES and its PRODUCTION — the label "DAK API", the
  `dak-api.html` hub page and its `DAK_API_*` markers, and the
  post-processing that writes the sidecars. **Rendering** the sidecars an IG
  publishes is generic and IS here, as the **IG API** (`ig-api-views.ts`).
  A WHO instance passes its names in as configuration (`--sidecar-label`,
  `--api-hub-page`, `--api-hub-markers`, `--api-placeholder`); nothing here
  writes them down. The per-artefact `.schema.json`, `.displays.json` and
  `.openapi.json` sidecars are that API, not DAK's.
- the DAK pre- and post-processing steps, in either direction
- anything in the `authoring-who-smart-guidelines` package

The WHO package may reference this layer; this layer may not reference the
WHO package. A violation fails no build on its own: the layer simply stops
being usable for a non-WHO IG.

**Gate: `bun run cat check:fhir-harness-exclusions`** (in smart-base). A
mention is not a dependency. Comments, markdown, and JSON `_comment` or
`description` values are counted and never graded. Code (string literals
included), other JSON values, and BPMN outside `<documentation>` are graded.
The DAK step names are read from the WHO layer's own pre/post-processing
tables, so this list does not restate them.

It is a **ratchet**: existing hits are in a committed baseline, each with a
reason. A new hit fails, and so does a cleared one the baseline still allows,
until `--shrink` lowers it. Never widen the baseline to admit a hit: move the
WHO-specific part up, or have the WHO layer pass it in as a parameter (the IG
page generator's `--sidecar-label` is that shape already).

## Translation supplements: compiled on every pull request

An IG's translated FHIR terms are CodeSystem supplements, one FSH file per
locale in `input/fsh/translations/<locale>.fsh`. The IG build compiles them,
but it is often not run on a pull request, so an IG repository copies
`templates/ig-repo-site/translation-supplements.yml` into
`.github/workflows/` unchanged. Its one job is

```yaml
uses: litlfred/fhir-harness/.github/workflows/translation-supplements.yml@main
```

which runs `scripts/check-translation-supplements.ts` (Tool
`check-translation-supplements`). It compiles the IG's `CodeSystem`, `Alias`
and `RuleSet` entities with every translation file in a throw-away FSHOnly
SUSHI project, requires 0 SUSHI errors, and checks that each supplement
supplements a CodeSystem of this IG, designates only that CodeSystem's codes,
has the file's locale as its `language` (and no designation in another), and
that no CodeSystem id is used twice. An IG with no `input/fsh/translations/`
passes as not applicable. It reads only `sushi-config.yaml` and `input/fsh/`
within the IG's `include`.

Nothing is resolved at run time. SUSHI is the version `scripts/ig-toolchain.env`
pins (`SUSHI_VERSION`; no IG's `sushi-config.yaml` names one), installed from
`scripts/sushi/package-lock.json` with `npm ci --ignore-scripts`; the check
refuses a lockfile or binary of another version, and a test fails when the
lockfile and `ig-toolchain.env` disagree, so a SUSHI bump changes both in one
pull request. The FHIR core package for the IG's `fhirVersion` is pinned by
sha512 in `scripts/sushi/fhir-packages.lock.json` and fetched from the npm
mirror; a `fhirVersion` it does not list is refused. SUSHI runs with a package
cache made for the run and no network, and the run fails if anything but the
pinned core package appears in that cache.

## Generic post-processing scripts

`strip_library_binaries.py` and `strip_library_content.py` strip base64
payloads and inline CQL/ELM out of `Library` resources. Nothing in either is
DAK-shaped: any IG depending on `hl7.fhir.uv.cql` produces oversized
`Library` resources. They live in
[`scripts/library-strip/`](../../scripts/library-strip/README.md)
(byte-identical copies, with upstream commit, licence and hashes recorded,
and a test that runs them on a non-WHO IG's output).

Three more generic transforms live here: `generate_logical_model_schemas.py`
(a JSON Schema per logical model), `generate_valueset_schemas.py` (a JSON
Schema per ValueSet, plus the enumeration-response schemas) and
`generate_jsonld_vocabularies.py` (JSON-LD from ValueSet expansions).

The test for this layer: a step that reshapes what the Publisher already
emitted belongs here. A step that adds a constraint, a profile or a
WHO-specific name stays in the overlay. The per-artefact API sidecars and
their hub are the FHIR IG API above; only their DAK label stays in the
overlay. The Tools are declared in `fhir-harness/tools/`.

## Upgrading to the overlay

An IG that wants the DAK surface does not change this pipeline; the WHO harness
above it (the WHO SMART Base IG, whose DAK document kind carries the pre/post steps)
supplies them as an **overlay**. The base takes no
position on whether an overlay exists, and must not gain a flag for one — a
`do_dak` input at this layer would be this layer knowing about DAKs.

## Version floating is real here

`publisher.jar` is re-downloaded from the **latest** release on every WHO build,
so two builds of an unchanged commit can differ. If this layer pins instead, say
so in the instance's declaration and make the pin visible in the QA record.
