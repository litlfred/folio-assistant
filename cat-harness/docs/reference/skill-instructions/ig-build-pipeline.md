---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'ig-build-pipeline'
parent: Skill instructions
---

{: .note }
> Generated from [`fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md`](https://github.com/litlfred/folio-assistant/blob/main/fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md){: .fa-edit-source }

{% raw %}
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

## What the Publisher run emits

Stated in [`ig-publication`](ig-publication.md)
§"The render-IG phase", because that skill owns the run and this one owns the
layer. Do not restate the list here — two copies of an emission list is two
copies free to drift, and the emission list is exactly the thing a new Publisher
release changes.

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
[`repo-conversion`](repo-conversion.md)
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
[`interaction-modality`](interaction-modality.md):
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

- **Never delete gh-pages content as part of this.** The previews already
  published stay. Removing them is a separate question, asked separately, with
  what would go and how big it is, per
  [`deletion-requires-confirmation`](deletion-requires-confirmation.md).
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

1. Copy [`templates/ig-repo-site/folio-site.yml`](https://github.com/litlfred/folio-assistant/blob/main/fhir-harness/templates/ig-repo-site/folio-site.yml)
   to `.github/workflows/folio-site.yml` and replace its two placeholders, as
   its header says. The template is `workflow_dispatch` only (#2291). Add a
   `push` trigger to the copy only if the owner asks for one in so many words.
2. The repository needs folio-assistant as a submodule at `folio-assistant/`;
   the template's header says so, and `init-folio --link submodule` does it.
3. Tell the owner how to run it: **Actions tab → "folio site" → Run
   workflow**, on the branch to publish. The site lands at the repository's
   own Pages URL, since the template reads the base path from the repository
   name rather than assuming it.

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
in a diagram. When one is drawn, steps 2 and 3 are the owner's lane and step
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

**It is a gate now: `bun run check:fhir-harness-exclusions`** (bean `wm63`).
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
[`scripts/library-strip/`](https://github.com/litlfred/folio-assistant/blob/main/fhir-harness/scripts/library-strip/README.md), with their
upstream commit, licence and hashes recorded, and a test that runs them on a
non-WHO IG's output. Recorded because this is the layering rule
([`smart-stack-layering`](smart-stack-layering.md))
producing a result its own step names contradicted — which is the only kind of
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
above it (smart-base, whose DAK document kind carries the pre/post steps)
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
{% endraw %}
