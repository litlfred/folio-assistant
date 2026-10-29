---
name: ig-build-pipeline
description: >
  The bare FHIR IG pipeline — FSH to SUSHI to the IG Publisher to a pages
  branch, with no pre-processing and no post-processing. What this layer runs,
  what it emits, and the list of things it deliberately refuses to know about.
  Also owns the two questions put to the owner when an IG repository is
  adopted or found publishing on its own: whether automatic gh-pages builds
  become manual-only, and whether to install the just-the-docs site (default
  yes). Owns the AST cache lifecycle: an IG site is built from the AST on
  its cache branch, the publish refuses a stale one, and the reusable
  `ig-ast-refresh.yml` is the one writer. Read before adding anything to
  fhir-harness, before onboarding, converting or changing the workflows of an
  IG repository, and before publishing an IG site.
governs:
  - fhir-harness/fhir-ig-tools
---

# ig-build-pipeline

> Skill id: `ig-build-pipeline` · Package: `fhir-ig-base` · Instance:
> `fhir-harness`

The **base**: run the FHIR IG Publisher over an IG, with no pre-processing and
no post-processing, and publish the result. This is how WHO SMART Guidelines
were built *before* DAK pre/post processing was added, so it is a shape that
demonstrably worked rather than a design being invented here.

It serves **any** FHIR IG. That is the whole point of the layer, and it is a
constraint rather than an aspiration — see §"What this layer refuses to know".

## The pipeline

```
input/fsh/          →  SUSHI      →  fsh-generated/resources/
input/pagecontent/  ┐
sushi-config.yaml   ┘  →  IG Publisher (JVM, Docker)  →  output/
                                                        →  publish to a pages branch
```

Four stages, and the only one that is not a straight invocation is the last: a
pages branch is a deployment target, and which one is the instance's to declare.

SUSHI and the Publisher both need `packages.fhir.org`. Where it is refused,
see [`fhir-validation`](../content/fhir-ig-authoring/fhir-validation.md)
§"When a package host refuses you" before concluding either cannot run.

## What the Publisher run emits

Stated in [`ig-publication`](../content/fhir-ig-authoring/ig-publication.md)
§"The render-IG phase", because that skill owns the run and this one owns the
layer. Do not restate the list here — two copies of an emission list is two
copies free to drift, and the emission list is exactly the thing a new Publisher
release changes.

## What the site build emits: thin pages, by default

Since 2026-10-12 (owner: *"make thin default"*) the Jekyll phase emits THIN
pages: each artefact page and the IG's `artifacts.html` and `toc.html` are a
few KB that load their content from JSON-LD nodes (`artifact/<Type>-<id>.jsonld`
and `artifact/index.jsonld`). Each artefact's tab views (definitions,
mappings, JSON and examples) are thin pages beside it, drawn from the
resource's JSON (owner, 2026-10-14: *"3. Render them too"*). The IG's
narrative pages keep their prose
with every piece of chrome linked rather than inlined. The old full pages stay
reachable with `--full-pages` on both `gen-ig-pages.ts` and `stage-ig-sites.ts`.
An IG that pins this layer by SHA changes nothing until it re-pins, and gets
the thin pages when it does. What each page holds, and the QA over the nodes,
is [`ig-render-jekyll`](ig-render-jekyll.md) §"Thin pages, the default".

## The AST cache lifecycle: an IG site is built from the AST

Owner, 2026-10-14: *"i want AST to be used. it should be in cache branch.
update processes/skills"*, and *"that should be in fhir-harness then smart-*
all use that"*. The process is
[`ig-ast-cache.bpmn`](../../processes/content/ig-ast-cache.bpmn).

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

1. **An IG repository's site is built from the AST on its cache branch.** The
   site is never built from the Publisher's HTML, and the publish runs no
   Publisher. Its first step restores the cache and judges it: `ig-site:ast`
   (`ig-repo-site.ts ast`), which runs `ig-cache.sh restore --ig-root .` and
   then `validity`, as `ig-cache.sh verify` does. See §"The IG repository's
   site route" for the steps that follow it.
2. **The publish refuses an AST that is not valid**: `stale-inputs`,
   `cannot-tell`, or no cache at all. It does not fall back to a Publisher
   build or to the Publisher's HTML. `ig-site:ast` accepts a stale AST with
   `SITE_ACCEPT_STALE_AST=1` for a preview only; on the root it still refuses.
3. **A commit that changes no input does not make the AST stale.** If the
   recorded commit is an ancestor of HEAD and the input digest is unchanged,
   the AST is still valid (`sameSourceAs` in `ig-ast.ts`), so a README or
   workflow merge needs no rebuild. A checkout that cannot see the recorded
   commit (a shallow clone) reads as stale. It never reads as valid.
4. **Only a Publisher run refreshes the cache, and it runs on a GitHub runner.**
   It needs Java, a 10 GB heap and `tx.fhir.org`, which an agent's container
   lacks. Whenever the IG's source changes, someone has to run it.

**Who writes the cache: one workflow, here.**
[`.github/workflows/ig-ast-refresh.yml`](../../.github/workflows/ig-ast-refresh.yml)
(`workflow_call`) is the only writer. The IG repository's `site-publish.yml`
(the [template](../../templates/ig-repo-site/site-publish.yml)) calls it as its
first job, `ast`, so a publish refreshes the cache before it builds: a no-op
when the cache is valid for the commit. No IG repository carries a workflow of
its own for it (owner, 2026-10-14, paraphrased: all of this should be part of
fhir-harness, reached through the IG overlay above it). A repository whose owner wants the cache refreshed on every
push to its IG sources may add the optional caller
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

**A stale cache is rebuilt incrementally; a release is cut from a full build**
(phase P4, bean `h3tx`; owner, 2026-10-24, option C). Step 3 does not always
run a full Publisher build:

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
the shared cache stays the default branch's. Pinned to the default branch, as
the template was until 2026-10-24, every such branch was refused as stale: a
review committee could never see a content change on STAGING (the
folio-assistant#215 walk on smart-immunizations-uganda#12). Overriding with
`SITE_ACCEPT_STALE_AST=1` is no substitute: it mixes the branch's narrative
with the default branch's artefacts. That is why `folio-build.json` names the
AST it used (`ast.commit`, `ast.verdict`) beside `source`.

Seeding is refused below 90% of the incumbent's resources or edges (the
no-shrink gate in `compiled-artefact-cache`). The run builds no site, writes
no gh-pages and dispatches nothing. The Tool node is `ig-ast-refresh`.

**An overlay's preparation: `pre-export`.** Some IGs prepare their inputs
before the Publisher runs: an overlay registers pages in `sushi-config.yaml`
or generates resources from other sources. The plain exporter does not do
this, so the caller passes the command as the optional `pre-export` input,
written in its own workflow file. This layer runs it with `bash` at the IG root
and knows nothing about what it does: the overlay names its own steps, and
this skill does not list them.

The exporter records the digest of the tree it is given, and a prepared tree
is one no clean checkout has. So the run takes the source's digest
(`ig-ast.ts digest`) before the command runs. After the export it puts the
inputs back, checks the digest again, and writes the source's digest into the
manifest's `inputs` with `ig-ast.ts source-inputs`. The prepared tree's
digest and the command are kept under `preExport`. The cache then verifies
on any clean checkout, the way an AST built without `pre-export` does. A
failing `pre-export` fails the run, so nothing is seeded.

**When it runs.** The run is dispatched by a person, or by an agent the owner
named for that run. An agent never dispatches it on its own (`feature-staging`
§"Agent-run repositories"). Adding a `push` trigger on the default branch,
filtered to `sushi-config.yaml`, `ig.ini` and `input/**`, is the owner's
decision for each repository.

**Measured 2026-10-14**, cache branch against `main`. None of the three
caches was built from a commit on `main`; each came from a side branch, so all
three are stale by revision even under point 3:

| repository | cache built from | `main` | input files that differ |
|---|---|---|---|
| the WHO SMART Trust IG | `dab31ed` (Publisher 2.3.4), 678 resources | `0dae5c4` | 3 |
| the WHO SMART Immunizations IG | `6004ec5` (Publisher 3.0.0), 748 resources | `91f7cdb` | 0 |
| the WHO SMART Base IG | `b1e00c5` (Publisher 2.3.4), 162 resources | `a710c5d` | 51 |

Until 2026-10-14 nothing refreshed these branches when the source changed.
Each was seeded once, on 2026-10-12, by hand or by the WHO SMART Trust IG's
`folio-site.yml` on its branch `claude/seed-smart-base`. That workflow built
from its own branch, and the same run also published gh-pages.

What is WHO-specific stays in the overlay: the DAK sidecars and their label
are the landing layer's `ig-site:sidecars` step (smart-base's), never this
layer's and never the IG repository's own declaration. Restoring, judging,
building and seeding are here.

## The IG repository's site route: the layers supply the steps

Owner, 2026-10-14, on an IG repository that lost its OpenAPI pages, its DAK
API sidecars and its artefact index when it dropped its own declaration
(paraphrased): those steps should already be supplied by the layers, the DAK
API by the IG overlay above this one and the OpenAPI pages by the harness. So an IG repository declares no `site.build`. It holds
`index.config.json` with `"site": {"landing": "<layer>"}`, and the site route
(`stage-local.ts`, cat-harness-tools) asks the mounted layers' script table
for these step names, never naming a layer:

| slot | when | provided by | what |
|---|---|---|---|
| `ig-site:ast` | pre, required | this layer | restore the AST from the cache branch and judge it (rule 1 and 2) |
| `ig-site:sidecars` | pre, optional | the landing layer | the IG API sidecars from the AST, into `$SITE_WORK/ig-api/` |
| `ig-site:compose` | source, required | this layer | the artefact index from the AST, the thin pages, the IG composed at the root |
| `ig-site:openapi` | site, when the IG holds `openapi/cat-openapi.config.json` | cat-harness-tools | a page and an IRI for each OpenAPI operation, at `openapi/` |
| `ig-site:publisher-pages` | site, required | this layer | the AST's data served, the Publisher-chrome guard, the build stamp |

**The handshake with a layer above** (`ig-repo-site.ts`): a sidecar step
leaves its files in `$SITE_WORK/ig-api/sidecars/` and what the IG calls them
in `$SITE_WORK/ig-api/ig-api.json` (`{ "label": "..." }`). This layer binds
whatever is there to the artefacts by the Publisher's file names
(`ast-to-artifact-index.ts --sidecars`), labels the pages with the descriptor's
label, and serves the files at `fhir-artifact-index/sidecars/`. It knows no
producer and writes no label down; with nothing there it binds nothing and
the pages say "IG API". Files the layer above leaves in
`$SITE_WORK/ig-api/site/` (its own pages over the sidecars, such as an
OpenAPI page at `openapi/index.html`) are served verbatim at the site root,
never over a path the site already holds, and the Publisher-chrome guard
judges them like every other page. The one exception is named by the
descriptor's `"placeholder"`: a page of the IG's own that holds that marker
is a shell around the layer's content (an IG's hub page around its marker),
and the layer's page at the same path replaces it. No other page is replaced.

**What the site serves from the AST**: each resource under `ast-data/` (the
thin pages' data, `gen-ig-pages --compiled-data ast-data`) and under the
Publisher's name `<Type>-<id>.json` at the root (the narrative's links), the
artefact index at `fhir-artifact-index/index.json`, and the AST as
`site.data` for the IG's own pages. The grouping of the IG's committed
`fhir-artifact-index/index.json` is kept when it holds one, since the AST
stops before the Publisher assigns categories.

**Annexes an IG's pages load on demand** (owner, 2026-10-10: the data
dictionary in the graph, loaded dynamically, not the full workbook). This is
the one directory an IG repository declares for this layer, because the data is
the IG's own and no AST holds it. It is a directory of the generic `ig-annex`
kind (`typologies/ig-annex.json`) holding `annexes.json` (`ig-annexes/v1`:
`{ page, file, columns? }` per annex, `file` beside it). `compose` and
`stage-ig-sites.ts` both read it through `annexesFor`, copy each file to
`assets/annex/` and mount `ig-annex.js` on the page. The files themselves
sit in a directory nested inside, declared with the producing layer's own
kind, because each kind owns the `$schema` families of its own directory.
This layer names none of them. An index still reads a committed
`fhir-artifact-index/annexes.json` where one is held. That is the location
before the kind existed, and an IG repository does not use it (#124).
A `.md` annex is appended to its page as written, so its links address that
page, not the directory holding the file: the kind says so
(`shownOnPublishedPages`), which keeps them out of the harness's source-tree
link sweep, and `bun run cat check:ig-annex-links`
(`scripts/check-ig-annex-links.ts`) judges them from the host page instead:
each `x.html` must be a page the IG serves, and each `#id` an id that page
(its annexes included) carries (smart-immunizations#81).

## The deploy phase, and the result that surprised me

The WHO build's deploy phase is **ten steps**, read from `ghbuild.yml`:

| step | layer |
|---|---|
| `update_branch_index.py` — history page, README branch links | `fhir-harness` |
| `inject_build_banner.py` — CI-build banner into output pages | `fhir-harness` |
| `fix_release_links.py` — release links in output pages | `fhir-harness` |
| delete files >100 MB before deployment | `fhir-harness` |
| deploy candidate / deploy main, each with a ref-conflict retry (4 steps) | `fhir-harness` |
| commit the README branch-links update | `fhir-harness` |
| comment on the PR that deployment completed | **`cat-harness`** |

**Nothing in the deploy phase is WHO-specific.** Every step is a property of
publishing a FHIR IG to a pages branch: an IG's history page is a FHIR IG
convention, a CI banner distinguishes a preview from a release, the 100 MB
purge is GitHub's file-size limit, and the ref-conflict retry is what concurrent
pages deploys do.

That was not the expected answer — the phase sits inside a workflow whose other
two phases are gated on `do_dak`, so the obvious reading is that it is WHO's
too. It is not, and this is the strongest single piece of evidence for `nsbb`'s
claim that **the base is the real pipeline and DAK is an overlay on it**: the
overlay does not reach the deployment end at all.

**One step places outside the stack, and that is not a failure.** Commenting on
a pull request is forge plumbing, which `cat-harness` already owns — it is not
an IG concern in any layer. The falsification test asks whether a step can be
placed, not whether it lands in one of the five; a step with a home elsewhere
in the harness is placed.

## Who starts a build: two owner questions before a repository publishes on its own

Owner, 2026-10-06: *"make this part of the process/skill. if gh-pages is being
populated, ask use if disable. ask use if they want justthedocs rendering
(default is yes)"*. Bean `p3yl`.

**This section owns the rule.** Every other skill that adopts, onboards or
converts an IG repository points here rather than restating it.

**When it applies:** whenever an agent adopts an IG repository
([`fhir-ig-create`](fhir-ig-create.md) `existing-ig` or `new-repo`, or
[`repo-conversion`](../../../cat-harness/skills/conduct/conduct-core/repo-conversion.md)
over a repository with a `sushi-config.yaml` or `ig.ini`), **and** whenever it
notices automatic builds in an IG repository it is already working in. A
repository forked from an upstream IG usually arrives with the upstream's
build workflows, and those publish on every push and every pull request
whether or not the fork's owner wants that.

Why ask rather than leave them: the measured case (2026-10-06, three IG forks)
had IG Publisher workflows writing a `branches/<name>/` preview to `gh-pages`
on every push and every PR, which the owner did not want, and one fork's PR
preview was deploying to **another organisation's** Pages site. Nothing in the
repository said so; it was found by reading the triggers.

### 1. Detect, read-only

List every workflow under `.github/workflows/` whose `on:` includes `push`,
`pull_request`, `pull_request_target` or `schedule` **and** that builds or
deploys a site: it runs the IG Publisher, pushes to `gh-pages` (or another
pages branch), or uses a Pages deploy action. For each, record:

| field | what |
|---|---|
| file | the workflow path |
| automatic triggers | which of the four, with their branch filters |
| what it publishes | full build, branch preview (`branches/<name>/`), PR preview |
| where it publishes | the repository's own Pages site, or a target **outside** it (another repository's pages branch, another organisation's `github.io`) |
| called by others | whether it declares `workflow_call`, and whether another repository calls it |

**A deploy target outside the repository's own Pages site is a finding in its
own right**, reported even if the owner keeps every trigger: the repository
is writing to a site it does not own.

If nothing matches, say so in one line and skip to step 3.

### 2. Ask whether to disable the automatic triggers

Put it per
[`interaction-modality`](../../../cat-harness/skills/conduct/conduct-core/interaction-modality.md):
the detection table first, so the owner can answer without opening anything,
then this question:

> This repository publishes to gh-pages automatically: *(the table from step 1)*.
> Should those builds keep running on their own?
>
> 1. **Manual only** *(recommended)*. I change each listed trigger to
>    `workflow_dispatch`, so a build runs only when someone starts it from
>    the Actions tab. I keep `workflow_call` wherever another repository calls
>    the workflow, and I leave what is already on gh-pages untouched.
> 2. **Manual only, and remove the workflows nobody calls.** As 1, but a
>    workflow with no caller and no remaining use is deleted from
>    `.github/workflows/` rather than kept as a manual one.
> 3. **Keep them as they are.** Nothing changes; I record the finding
>    (and any out-of-repository target) in the work plan.
> 4. **Tell me more.**
>
> **Default if you do not answer: 1.**

The default is 1, manual only, by the owner's ruling of 2026-10-06: *"i dont
want github tools implemented, only defined."* A build workflow is kept
**defined**, so it can be started from the Actions tab, but it does not run
on its own. Disabling a trigger is reversible, and an IG fork's owner has, so
far, never wanted every push published. Option 3 stays available to an owner
who says so; it is no longer what silence means.

Rules that hold whichever option is chosen:

- **Turning a repository's automatic BUILDS off never turns its harness
  CHECKS off.** The question is about the IG Publisher and gh-pages
  workflows. The harness checks are a separate workflow: a caller of
  cat-harness-tools' `layer-pr-checks.yml` on `pull_request`, described in the
  cat-harness skill
  [`index-config`](../../../cat-harness/skills/kg/kg-core/index-config.md)
  ("A harnessed repository runs its checks on its own pull requests"). It stays
  on whatever the answer is. On 2026-10-06 the answer "manual only" was
  applied to every workflow in the WHO SMART Base IG, the WHO SMART Trust IG and the WHO SMART Immunizations IG,
  so their harness gates went off together with their builds, and nothing
  judged those repositories until an index re-pinned them (owner, 2026-10-14:
  "There should be CI running").

- **Never delete gh-pages content as part of this.** The previews already
  published stay. Removing them is a separate question, asked separately, with
  what would go and how big it is, per
  [`deletion-requires-confirmation`](../../../cat-harness/skills/conduct/conduct-core/deletion-requires-confirmation.md).
  Option 2 deletes a workflow file, which `git revert` restores; it does not
  delete anything the workflow published.
- **Keep `workflow_call`.** A workflow another repository calls is an API;
  dropping the trigger breaks the caller, and the caller's owner is not in
  this conversation.
- **An out-of-repository deploy target is never "kept" silently.** If the
  owner chooses 3, the finding still goes in the work plan.

### 3. Ask whether to render the IG with the just-the-docs site

> Do you want this IG rendered as a just-the-docs site, with the harness's
> navigation, search and language bar, on this repository's own Pages site?
>
> 1. **Yes** *(recommended)*. I install the folio site workflow, manual
>    trigger only, and tell you how to run it.
> 2. **No.** The IG Publisher output stays the only rendering.
> 3. **Tell me more.**
>
> **Default if you do not answer: 1.**

The default is yes because this is the rendering the owner wants
([`ig-render-jekyll`](ig-render-jekyll.md) says why: the Publisher's finished
HTML is opaque to every harness surface), and installing a manual-only
workflow publishes nothing until somebody runs it.

On yes:

1. **The repository needs no harness of its own.** No `<repo>.json`
   declaration and no `folio-assistant/` submodule. Its `index.config.json`
   names the layer it builds on as a remote instance, with consent: this
   layer for a bare IG, or the overlay above it (the WHO SMART Base IG, for an IG that
   wants the DAK surface). `remote-mount.ts --seed` writes the entry and
   `remote-mount.ts` the `index.lock.json`; the layer's closure comes with
   it. The owner's ruling, 2026-10-14 (paraphrased): the IG repository
   can just define `index.config.json` and reference the overlay layer as a
   dependency, and that is the preferred and expected behaviour.
   `index.config.json` also says which mounted layer's chrome the site
   wears: `"site": {"landing": "<that layer>"}` (the WHO SMART Base IG for a WHO
   SMART IG). Without it the route refuses rather than guess among the
   mounted layers.
2. Keep one workflow that calls the overlay's IG build (`ghbuild.yml` or
   `fhirbuild.yml` of the layer the IG builds on): it is the recipe the
   publish mirrors, and it stays `workflow_dispatch` only.
3. Add `.github/workflows/site-publish.yml` from
   [`templates/ig-repo-site/site-publish.yml`](../../templates/ig-repo-site/site-publish.yml),
   `workflow_dispatch` only. It mounts the locked layers and runs
   `bun run cat-harness-tools/scripts/stage-local.ts --repo .`, the same
   command every agent-run repository publishes with: it builds the site
   from the IG's cached AST, with the steps the mounted layers provide
   (§"The IG repository's site route"), and publishes `main` at the root
   (keeping `STAGING/`, `_render-log/` and `branches/`) and any other branch
   as a preview under `STAGING/<branch>/`. `--plan` prints what it would do
   and `--dry-run` builds without publishing. `--bare-ig`, which publishes
   the Publisher's own output, is not how an IG site is built under the
   2026-10-14 rule, and neither is a Publisher run by the route: it runs
   none. The route's steps come from the mounted layers (§"The IG
   repository's site route"); an IG that needs steps of its own beyond them
   declares `site.build` inline in its `index.config.json` entry, never in a
   `<instance>.config.json` (bean `ymvt`, owner 2026-10-14: *"i thought ONLY
   index.config.json"*). The menu is read from `sushi-config.yaml`
   at build time: nothing is committed for it. The old per-repository
   `folio-site.yml` needed the `folio-assistant/` submodule, which the layer
   split (bean `n3h9`) removed; the template above replaces it.
   The site is built from the IG's AST on its cache branch, never from the
   Publisher's HTML: the route's first step is `ig-site:ast`, the restore and
   its judgement (§"The AST cache lifecycle").
3a. Nothing more for the AST: the template's first job, `ast`, calls this
   layer's reusable `ig-ast-refresh.yml`, which runs the Publisher on a runner
   and seeds the cache branch when it is missing or stale for the commit.
4. Tell the owner how to run it: **Actions tab → "Site publish (by hand)"
   → Run workflow**, on the branch to publish, with `plan` ticked first. The site lands at the repository's
   own Pages URL, since the template reads the base path from the repository
   name rather than assuming it.
5. If the IG has sibling sites (other IGs on the same platform) or depends
   on another IG with its own site, set the two repository **variables** the
   template reads, so no copy is edited per repository:
   `FOLIO_SITE_SIBLINGS` (site URLs) and `FOLIO_SITE_DEPENDENCIES`
   (`owner/repo@ref`). The run then reports each sibling built with a
   different platform, and re-runs the dependencies' `Site publish (by hand)` after a
   publish. The re-run needs a `FOLIO_SITE_DISPATCH_TOKEN` secret. Without it
   the run summary says what was not rebuilt, and nothing fails.

   Why: built by hand, the sites drift. Each one shows the harness chrome of
   the platform it was last built with, and in bean `48a6` the owner found
   that by looking. Every build writes `folio-build.json` at its site root
   (`scripts/site-build-stamp.ts`), so a deployed site can be compared
   without rebuilding it. A sibling whose stamp cannot be read is reported as
   **not checked**, never as matching. The report is a message, not a gate,
   and the dependency rebuild is the owner's interim step (2026-10-09:
   *"1, but rebuild dependency for now"*).

### 4. Say what the pull request will fire

A pull request that changes a workflow **still runs the base branch's
`pull_request_target` workflows**, because `pull_request_target` runs the
workflow file from the base, not the one in the PR. So the PR that disables
an automatic preview fires that preview one last time, and on the measured
fork that meant a deploy to another organisation's site.

Say so before opening the PR, and offer the two ways round it: cancel those
runs as soon as they start (`gh run cancel <id>`), or, with the owner's
agreement, push the workflow change straight to the working branch rather
than through a PR. Once the change is on the base branch, later PRs are
quiet.

### Process diagram

No BPMN activity covers IG repository adoption yet, so these steps are not
in a diagram. Publishing the adopted site, and refreshing the AST it is built
from, is [`ig-ast-cache.bpmn`](../../processes/content/ig-ast-cache.bpmn). When one is drawn, steps 2 and 3 are the owner's lane and step
1 is the agent's, with step 2's "no change" default as the gateway's default
flow.

## What this layer refuses to know about

A list, because "generic" is a claim and a list is checkable. `fhir-harness`
must contain no reference to:

- `dak.config.json` (`dak.json` as upstream still spells it), the DAK logical
  model, or any DAK component
- `smart.who.int` canonicals, or any WHO publisher metadata
- the DAK API's NAMES and its PRODUCTION — the label "DAK API", the
  `dak-api.html` hub page and its `DAK_API_*` markers, and the
  post-processing that writes the sidecars. **Rendering** the sidecars an IG
  publishes is generic and IS here, as the **IG API** (`ig-api-views.ts`):
  owner, 2026-10-03, *"can we rename dakapi hub to someting more ig generic.
  split up/generifize code. relabel?"* (bean `d313`). A WHO instance passes
  its names in as configuration (`--sidecar-label`, `--api-hub-page`,
  `--api-hub-markers`, `--api-placeholder`); nothing here writes them down.
  Same ruling, put the other way: *"should be FHIR-IG-API, no DAK
  label/names"* (owner, 2026-10-03). The per-artefact `.schema.json`,
  `.displays.json` and `.openapi.json` sidecars are that API, not DAK's.
- the DAK pre- and post-processing steps, in either direction
- anything in the `authoring-who-smart-guidelines` package

**The import direction is the enforceable half.** The WHO package may reference
this layer; this layer may not reference the WHO package. A violation fails
nothing on its own — the build stays green and the layer simply stops being
usable for a non-WHO IG, which is the failure this list exists to make visible.

**It is a gate now: `bun run cat check:fhir-harness-exclusions`** (bean `wm63`).
The checker lives in the layer that owns the excluded names, not here, because
a copy of this list inside `fhir-harness` would be its own first violation. A
mention is not a dependency. Comments, markdown, and JSON `_comment` or
`description` values are counted and never graded. Code (string literals
included), other JSON values, and BPMN outside `<documentation>` are graded.
The DAK step names are read from the WHO layer's own pre/post-processing
tables, so this list does not restate them.

It is a **ratchet**. The layer was not clean on 2026-10-03, so its hits are
in a committed baseline, each with a reason. A new hit fails, and so does a
cleared one the baseline still allows, until `--shrink` lowers it. Never
widen the baseline to admit a hit: move the WHO-specific part up, or have the
WHO layer pass it in as a parameter (the IG page generator's `--sidecar-label`
is that shape already).

## Five steps that came DOWN from the WHO build

`strip_library_binaries.py` and `strip_library_content.py` strip base64 payloads
and inline CQL/ELM out of `Library` resources. They arrived labelled *"DAK
Postprocessing"* and nothing in either is DAK-shaped: any IG depending on
`hl7.fhir.uv.cql` produces oversized `Library` resources, and the WHO deploy
phase's *"Delete files >100MB before deployment"* is the same concern one layer
down.

They belong here, and since 2026-10-04 they are here: byte-identical copies in
[`scripts/library-strip/`](../../scripts/library-strip/README.md), with their
upstream commit, licence and hashes recorded, and a test that runs them on a
non-WHO IG's output. Recorded because this is the layering rule
([`AGENTS.md`](../../AGENTS.md) §"The one rule") producing a result its own step names contradicted — which is the only kind of
evidence that a split is doing work.

**Three more followed, on the owner's ruling of 2026-10-03:**
`generate_logical_model_schemas.py` (a JSON Schema per logical model),
`generate_valueset_schemas.py` (a JSON Schema per ValueSet, plus the
enumeration-response schemas) and `generate_jsonld_vocabularies.py` (JSON-LD
from ValueSet expansions). The ruling: *"it is only transforming existing
(meta)data, not adding any new constraints or profiles (e.g. like smart
guidelines does). It is generic."* That is the test for this layer. A step
that reshapes what the Publisher already emitted belongs here. A step that adds
a constraint, a profile or a WHO-specific name stays in the overlay. The
per-artefact API sidecars and their hub are not WHO-specific: they are the
FHIR IG API above, and only their DAK label stays in the overlay. The Tools are
declared in `fhir-harness/tools/`.

## Upgrading to the overlay

An IG that wants the DAK surface does not change this pipeline; the WHO harness
above it (the WHO SMART Base IG, whose DAK document kind carries the pre/post steps)
supplies them as an **overlay**. The base takes no
position on whether an overlay exists, and must not gain a flag for one — a
`do_dak` input at this layer would be this layer knowing about DAKs.

## Version floating is real here

`publisher.jar` is re-downloaded from the **latest** release on every WHO build,
so two builds of an unchanged commit can differ. If this layer pins instead, say
so in the instance's declaration and make the pin visible in the QA record;
bean `dhvf` is the general case.

Do not treat an unpinned toolchain as a detail. It makes "the build changed" and
"the content changed" indistinguishable, which is the same class of defect as an
unrecorded workflow outcome.
