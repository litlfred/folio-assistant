---
layout: default
title: 'ig-publication'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/authoring-who-smart-guidelines/ig-publication.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/authoring-who-smart-guidelines/ig-publication.md) — do not edit here. Typed contract: [schema reference](../skills/ig-publication.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/authoring-who-smart-guidelines/ig-publication.md){: .fa-edit-source }

{% raw %}
# ig-publication

> Skill id: `ig-publication` · Package: `authoring-who-smart-guidelines` ·
> The most-referenced skill in this package — named by seven activities across
> `l3-fhir-pipeline.bpmn`, `ig-incremental-build.bpmn` and
> `draft-to-publication.bpmn`, in the `Publication manager`,
> `Incremental build` and `Publisher + validator services (JVM)` lanes.

Build a FHIR Implementation Guide and publish it: version, tag, assemble the
site, deploy.

> **Sourcing.** The IG Publisher and the FHIR publication process are HL7's;
> WHO's own release conventions govern a SMART Guideline. This skill states how
> publication is wired **in this harness** — which lanes, which authority,
> which binaries — and defers to those for what a published IG must contain.

## Inputs and outputs

`schemas/skills/ig-publication/`:

- **in** — `igRoot` (required), `versionIncrement` (required), `releaseNotes`,
  `publicationTarget`
- **out** — `version`, `publishedUrl`, `releaseTag`, `releaseBranch`,
  `publicationRequestPath`, `buildStatus`

## Authorising a release is not the same as managing one, and the split is load-bearing

Two permissions, two holders:

| permission | held by | means |
|---|---|---|
| `release-authorization` | `programme-manager`, `admin` | may decide a release happens |
| `release-management` | `publication-manager` | may configure, build, version and deploy one that has been authorised |

`draft-to-publication.bpmn` marks `Task_AuthorizeRelease` and
`Task_PublishRelease` **`relaxable="false"`**: no package's
`workflow-policy.json` may relax either, with or without a reason.

**An agent never records the authorisation.** That is a human judgement, and
`skills/requirements/agent-workflow.json` states it as a SHALL: an agent shall
not record an approval, a sign-off or a decision to release on a human's
behalf. Building the artefact is this skill's job; deciding it ships is not.

## The toolchain

```sh
java -jar "${IG_PUBLISHER_JAR}"    # /opt/ig-publisher/publisher.jar
jekyll build                       # site assembly
```

Both are installed by this package's `docker` block; `ig-publisher` requires
`java-runtime`, `jekyll` is its own capability. `exposePorts: [4000]` is there
for serving the built site locally.

## The render-IG phase — what the Publisher run actually accomplishes

The Publisher is **one step** in the WHO build, between six pre-processing
invocations and eight post-processing ones
([`dak-preprocessing`](dak-preprocessing.md),
[`dak-postprocessing`](dak-postprocessing.md)). It is easy to credit it with
what the phases around it do, so this is what the run itself produces:

| it produces | notes |
|---|---|
| `output/` — the rendered site | HTML per resource and per page, from `input/pagecontent/` and `sushi-config.yaml`'s `pages:` |
| `{ResourceType}-{id}.json` per resource | the **structured** surface everything downstream reads |
| `.xml` and `.ttl` per resource | not read by this platform's render path — see the JSON-only contract |
| `package.tgz` → `package/.index.json` | filename / resourceType / id, index-version 2 |
| `canonicals.json`, `package.manifest.json` | partial views of the same artefact set |
| `artifacts.html` | the **only** source of an artefact's category |
| `qa.json` | the validation record, uploaded as a workflow artifact |
| POT files | extracted translatable strings |

**And it accomplishes two things no post-processing step can.** It *validates*
every resource against its profiles and the declared FHIR version, and it
*resolves* the dependency closure — `hl7.terminology`, `hl7.fhir.uv.cql`,
`hl7.fhir.uv.cpg`, `hl7.fhir.uv.crmi`, `hl7.fhir.uv.sdc` for smart-base — with
version pinning and terminology expansion against `tx`. That resolution is the
part a cache cannot fake, and it is why the phased transition keeps the
Publisher for the AST and QA rather than removing it.

### Where it is invoked from, and what that costs

Inside Docker (`hl7fhir/ig-publisher-base`), with `publisher.jar` re-downloaded
from the latest release on **every** run. So the toolchain version is whatever
HL7 shipped most recently, not a pin — two builds of an unchanged commit can
differ. Bean `dhvf` names this as the SUSHI/FHIR version-floating problem; it
applies here with the same force.

## Full build versus restored state

`ig-incremental-build.bpmn` restores derived state and assembles the site
without a full publisher run — fast enough for an authoring loop. The **full
publisher build** in that same diagram, in the JVM services lane, is what a
release is cut from.

Publishing from restored state is the failure this separation exists to
prevent: the site looks right and was never built by the publisher that the
release claims produced it.

## Report the URL only once it answers

`publishedUrl` is an output, and an output is a measurement. A deploy that has
returned is not a site that serves — GitHub Pages takes minutes on a first
publish. Probe it, and until it answers report `not-yet` or `unknown`, never a
live URL. `scripts/pages-bootstrap.ts` implements exactly this three-state
probe and `decisions/pages-live-gate.dmn` is the same logic as a table.

## Afterwards

`quality-control` runs the QC gates on what was built; the summary goes on the
issue, not only the PR.
{% endraw %}
