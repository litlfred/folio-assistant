---
input: schemas/skills/ig-publication/input.schema.json
output: schemas/skills/ig-publication/output.schema.json
---

# ig-publication

> Skill id: `ig-publication` · Package: `fhir-ig-authoring` ·
> Named by activities in `l3-fhir-pipeline.bpmn` (`Build pipeline` and
> `Publication manager` lanes) and `ig-incremental-build.bpmn` (`Incremental
> build`, `Publisher + validator services (JVM)` and `Publication manager`
> lanes).

Build a FHIR Implementation Guide and publish it: version, tag, assemble the
site, deploy.

> **Sourcing.** The IG Publisher and the FHIR publication process are HL7's;
> an IG's own publisher sets its release conventions. This skill states how
> publication is wired **in this harness** — which lanes, which authority,
> which binaries — and defers to those for what a published IG must contain.

## Inputs and outputs

`fhir-harness/schemas/skills/ig-publication/`:

- **in** — `igRoot` (required), `versionIncrement` (required), `releaseNotes`,
  `publicationTarget`
- **out** — `version` (required), `publishedUrl` (required), `releaseTag`,
  `releaseBranch`, `publicationRequestPath`, `buildStatus`

How `versionIncrement` (`"major" | "minor" | "patch"`) is chosen from the AST
delta against the previous release, and which files in `igRoot` are
authoritative source versus compiled, cached or rendered output, is defined in
[`ig-build-pipeline`](../../fhir-ig-base/ig-build-pipeline.md) §"Source of
truth versus compiled, cached and rendered output" and §"Version numbering:
SEMVER for a FHIR IG".

## Authorising a release is not the same as managing one

Two permissions, two holders:

| permission | held by | means |
|---|---|---|
| `release-authorization` | `programme-manager`, `admin` | may decide a release happens |
| `release-management` | `publication-manager` | may configure, build, version and deploy one that has been authorised |

`draft-to-publication.bpmn` marks `Task_AuthorizeRelease` and
`Task_PublishRelease` **`relaxable="false"`**: no package's
`workflow-policy.json` may relax either, with or without a reason.

**An agent never records the authorisation.** `skills/requirements/agent-workflow.json`
states it as a SHALL: an agent shall not record an approval, a sign-off or a
decision to release on a human's behalf. Building the artefact is this
skill's job; deciding it ships is not.

## The toolchain

```sh
java -jar "${IG_PUBLISHER_JAR}"    # default /opt/ig-publisher/publisher.jar
jekyll build                       # site assembly
```

`ig-publisher` is a declared capability of this package and requires
`java-runtime`; `jekyll` is not one of its declared capabilities.

## What the Publisher run produces

The Publisher is **one step** in an IG's build. An overlay may wrap it in
pre- and post-processing of its own, which that overlay's skills describe;
this layer names none of them. The run itself produces:

| it produces | notes |
|---|---|
| `output/` — the rendered site | HTML per resource and per page, from `input/pagecontent/` and `sushi-config.yaml`'s `pages:` |
| `{ResourceType}-{id}.json` per resource | the **structured** surface everything downstream reads |
| `.xml` and `.ttl` per resource | not read, rendered or linked by this platform — see the JSON-only contract in [`ig-render-jekyll`](../../fhir-ig-base/ig-render-jekyll.md) |
| `package.tgz` → `package/.index.json` | filename / resourceType / id, index-version 2 |
| `canonicals.json`, `package.manifest.json` | partial views of the same artefact set |
| `artifacts.html` | the **only** source of an artefact's category |
| `qa.json` | the validation record, uploaded as a workflow artifact |
| POT files | extracted translatable strings |

**It also does two things no post-processing step can.** It *validates*
every resource against its profiles and the declared FHIR version, and it
*resolves* the dependency closure (`hl7.terminology`, `hl7.fhir.uv.cql`,
`hl7.fhir.uv.cpg`, `hl7.fhir.uv.crmi`, `hl7.fhir.uv.sdc` for a
clinical-reasoning IG) with version pinning and terminology expansion against
`tx`. A cache cannot fake that resolution, which is why the
[phased transition](../../fhir-ig-base/ig-publisher-reduction.md) keeps the
Publisher for the AST and QA.

### Where it is invoked from

Inside Docker (`hl7fhir/ig-publisher-base`), with `publisher.jar` downloaded
from the latest release on **every** run. The toolchain version is therefore
not pinned: two builds of an unchanged commit can differ.

## Full build versus restored state

`ig-incremental-build.bpmn` restores derived state and assembles the site
without a full publisher run, fast enough for an authoring loop. A release is
cut only from the **full publisher build** in that same diagram, in the JVM
services lane. Never publish from restored state: the site looks right and was
never built by the publisher the release claims produced it.

## Report the URL only once it answers

`publishedUrl` is a measurement. A deploy that has returned is not a site that
serves — GitHub Pages takes minutes on a first publish. Probe it, and until it
answers report `not-yet` or `unknown`, never a live URL.
`scripts/pages-bootstrap.ts` implements this three-state probe and
`decisions/pages-live-gate.dmn` states the same logic as a table.

## Pages of statements extracted from the IG's sources

When the IG draws on library sources, the statements extracted from them are
published as pages of the IG before the Publisher runs, each linked to its
library entry and section. That is core's standard step
(`publish-extracted-statements`, `bun run cat statements:pages`), the same for
every content type. What the IG supplies is its look, and nothing else:

- the page spec's `out` is a page under the IG's own page content directory,
  so the Publisher and the site route render it like any other page;
- its `tableAttr` is the kramdown class the IG's tables use (for example
  `{:.grid}`);
- the page is registered in the IG's own `sushi-config.yaml` pages and menu.

`statements:pages --check` runs in the IG's CI, so a page that no longer
matches its extraction fails the build.

## Afterwards

`quality-control` runs the QC gates on what was built; the summary goes on the
issue, not only the PR.
