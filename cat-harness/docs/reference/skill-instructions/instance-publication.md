---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'instance-publication'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/kg/kg-core/instance-publication.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/kg/kg-core/instance-publication.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/kg/kg-core/instance-publication.md){: .fa-edit-source }

{% raw %}
# instance-publication — draft is a state, not an absence of one

> Skill id: `instance-publication` · Package: `folio-core` · Instance:
> `cat-harness` · Bean `9wb0`

The owner, 2026-09-23:

> all assets get a version and are in "draft" publication. formal publication
> process needs to be deinfed/neeeds tools/depends on instance

Three rules, and the third is what makes the first two safe.

## 1. Every asset carries a `version` — and the `id` is HELD

`version` is **universal**. Not only the publishable ones.

**It is enforced by `check:publishable`, not by the schema**, and that is a
measured decision rather than a weaker one: requiring it in the type breaks
**376 tests across 20+ files**, every fixture that builds a declaration
without it. A sweep that size hides a real regression among the noise, and the
property is delivered either way — all instances carry one, and a new instance
without a version fails the gate, **by name**, rather than as a parse error
somewhere in a fixture.

**`id` is a different story, and it is not shipped.** The owner ruled the
namespace `io.github.litlfred.folio-assistant.<name>`; it was minted into all
17 declarations and then **removed**, because the next ruling contradicts
writing it there at all:

> i want simplest so if someone wants to bootstrap a different harness, there
> is only one place to change. **ONE PLACE.**
>
> fork would only edit `bootstrap/README.md` and change ONE reference there.

A namespace written into 17 files is 17 places. So an id must be **derived**
from that single reference — and the reference does not exist yet.
`bootstrap/README.md` today carries **zero** outward references and its own
tests enforce that. Bean `iwtn` owns creating it.

Minting ids before then bakes the wrong scheme into something this schema
itself calls *stable forever, never reused*. The namespace rule below stands;
only its application waits.

This reverses what `instance-versioning.md` §3.1 originally shipped, which
**refused** them unless an instance declared `publishable: true`:

> refused while `publishable` is undeclared — a declared `version` reads as a
> published identity, and nobody has said this instance is published

That refusal rested on a premise the owner's ruling denies: that a version is
a *publication* claim. It is not. A version distinguishes snapshots of a thing;
whether anyone outside may depend on those snapshots is the separate question
below.

## 2. Publication is a STATE, and the state is `draft`

`publication` is not a boolean and never was one honestly. `draft` is the state
**everything is already in** — not an undecided-ness, not an absence.

**This is why the old model reported a fully-decided corpus as a worklist.**
`check:publishable` printed all 17 instances as `undecided`, correctly by its
own rules, because the model had no way to express the true thing. Seventeen
"nobody has looked" entries described a situation where the answer was known
for every one of them. A third state that cannot say what is true is not a
third state, it is a missing value.

Absence still means `draft`. Declaring `publication: "draft"` is legal and
says nothing extra; the field exists to reserve the axis and to make rule 3
testable rather than merely intended.

## 3. `published` is REFUSED by the schema, not merely reported

Because the process does not exist: *"needs to be deinfed/neeeds tools/depends
on instance."*

A flag nothing can verify is precisely the ceremony §3.1 was written against.
Accepting `published` today — even with a gate grumbling about it — would
rebuild that defect one name over, and a grumbling gate is a gate somebody
switches off. So a declaration setting `publication: "published"` **fails to
parse**, with the error naming what is missing.

> **Falsifier for this whole skill:** if `published` becomes settable by hand
> before any tool backs it, this is wrong and should be read again.

`depends on instance` is the part not yet designed. When the process arrives it
will be **per-instance** — what publishing means for `cat-harness` is not what
it means for a WHO IG mirror — so expect `publication` to gain a companion
naming that process, rather than to become a second boolean.

## The id namespace — one rule, no per-instance invention

Owner's ruling, 2026-09-23: **`io.github.litlfred.folio-assistant.<name>` for
all 17.**

The rule underneath it is mechanical: **reverse the host, append the path.**

| host + path | id |
|---|---|
| `litlfred.github.io/folio-assistant` | `io.github.litlfred.folio-assistant` |
| `smart.who.int/base` | `smart.who.int.base` |

The second row is not an example invented here — it is FHIR's actual published
package id for that IG, produced by the same rule. Following a convention that
already yields the right answer for a case we can check is worth more than a
scheme chosen for elegance.

An id is **stable forever and never reused**. That is the whole reason it was
ruled rather than derived quietly.

## A MIRROR NEVER TAKES ITS SUBJECT'S IDENTITY

The hardest question in the ruling, and the one most likely to be re-opened by
somebody who notices the ids "should" match.

`smart-trust` here is **not** the WHO SMART Trust IG. It is this repository's
reconstructed index *about* that IG. The two are different objects, and the
real upstream ids are already held — as **data**, in the right place:

```json
// smart-base/fhir-artifact-index/chrome.json, ingested at commit 26635f7b
{ "id": "smart.who.int.trust", "canonical": "http://smart.who.int/trust" }
```

Giving our instance `smart.who.int.trust` would claim our mirror **is** the
thing it mirrors. Anything resolving that id would then find two different
artefacts answering to it.

**The same reading governs `canonicalUrl`,** and `smart-base`'s own declaration
already said so before this skill existed:

> It is READ from upstream rather than chosen here, so it is a fact about
> smart-base and not a decision about where this staging directory publishes.

So, for a **true mirror**, `canonicalUrl` records the **subject**. It must not
drive **our** identity. A mirror's declaration that carries an upstream
canonical is describing what it mirrors, not asserting where it lives.

### Three questions that must not be merged — publication, staging, mirroring

Owner, 2026-10-05: *"there is staging vs publication being conflated here."*
Three different questions answer to "what is this instance's address", and
each has its own field:

| question | answered by | example |
|---|---|---|
| **Publication identity** — where the artefact lives once formally published | the `@id` its document mints; for an instance staged here for publication elsewhere, its declared `canonicalUrl` | `smart-base` → `http://smart.who.int/base/smart-base.jsonld` |
| **Staging location** — where this repository's site serves a draft copy now | the root index's `url`, never the `@id` | `smart-base` → `<site>/smart-base/smart-base.jsonld` |
| **True mirror** — this repository's index *about* someone else's artefact | its own identity on this site; the subject's ids are held as **data** | `smart-trust` is not the WHO SMART Trust IG |

**An instance staged here for publication at its `canonicalUrl` is not a
mirror.** It IS the thing that will be published there, so its `@id` is the
publication identity and this site is only where it is staged. The mirror rule
above applies to the third row and to nothing else. Reading this site's address
as an instance's identity is the conflation the owner named: it would mint ids
that change the day the artefact is published, which is exactly what a
publication identity exists to prevent.

## Release IRIs — one address, two audiences, derived from the version

Owner, 2026-09-29: the version is **semver**, and it appears in an IRI in one
of two forms depending on **who reads it**:

| reader | form | example (bootstrap `0.1.0`) |
|---|---|---|
| a program or agent — a namespace, a schema `$id`, a BPMN `xmlns`, a JSON-LD `@id` | `<iriBase><version>/…` | `https://litlfred.github.io/bootstrap/0.1.0/ns#` |
| a person — a page to read | `<iriBase>v<major>/…` | `https://litlfred.github.io/bootstrap/v0/` |

A program pins exactly, because a reader built against `0.1.0` must not be
handed `0.2.0` silently. A person's link lasts a major version, because prose
is not re-checked on every patch.

**`iriBase` and `version` are written ONCE, in the declaration** — the owner's
"ONE PLACE" rule above, which a fork edits and nothing else. `iriBase` is not
`canonicalUrl`: `canonicalUrl` says where documents are *published* and
`kg-export` mints a document `@id` from it; `iriBase` says what the
*identifiers* are, and those carry the release.

**Never type an address or a version.** Ask for it:

- in TypeScript, `releaseIris(decl)` / `releaseIri(r, path, "agent" | "human")`
  in `bootstrap-tools/schemas/release-iri.ts` — `gen-bootstrap-schemas` mints every `$id` this way;
- in a README template, the `release` variable ([`liquid-templates`](liquid-templates.md));
- on the site, `site.data.harness.releases.<instance>` (`version`, `major`,
  `agent`, `human`), written by `sync-docs-harness`.

**The copies that cannot ask are synced, and the sync is a gate.** An `xmlns`
attribute, a code-list value and a fixture string are literal by nature.
`bun run iri:sync` rewrites every `<iriBase><semver>/` and `<iriBase>v<N>/` in
the tree to the declared version; `iri:sync:check` fails CI and the pre-commit
hook on any that is not. Moving the base itself — a fork, or bootstrap's move
off `litlfred.github.io/folio-assistant/bootstrap/` (bean `r3gy`, group E) — is
`bun run iri:sync -- --from <old base>`, once. `beans/` is never rewritten: a
bean records what was true when it was written.

**A `$schema` tag carries its SCHEMA's semver**, not the instance's:
`model-registry/1.0.0`. A reader accepts any tag of the same major
(`tagCompatible`); a tag change that breaks a reader is a new major. An old
tag is accepted until that schema's next major, and a published schema never
names it.

**Not yet moved, on purpose:** the exported document's own `@id`
(`bootstrap.jsonld`). `kg-export` mints it from where the document is actually
served, and today that is this site; pointing it at a base that serves nothing
is the failure `40fl` / #718 recorded. It moves when the bootstrap repository
publishes.

## The release site — what is served where

The IRI rule above says what an identifier IS; this says what the instance's
own site must serve so that every identifier dereferences. Written 2026-09-29
for the bootstrap split, after the separation analysis found every bootstrap
identifier pointing at an address nothing yet served.

| path | holds | changes |
|---|---|---|
| `<iriBase><version>/` | every file of that release exactly where it sits in the repository — schemas, JSON-LD, BPMN, the declaration — plus an extension-less alias for a vocabulary document (`processes/ns` beside `processes/ns.jsonld`) | **never**, once published: an agent pinned to `0.1.0` must keep getting `0.1.0`, so every released version stays |
| `<iriBase>v<major>/` | the person-facing pages — READMEs rendered as HTML, the drawn schema page, the diagrams | moves forward with each minor or patch release of that major |
| `<iriBase>` | an index naming the current release of each major, and the versions available | with every release |

Three rules follow from the table:

- **Publish files where they sit.** A published node's own identifier must be
  its file's path under the release address, so copying the release's tree is
  enough to serve every identifier. `check:node-iris` enforces it; the two
  discussion schemas failed it until 2026-09-29.
- **No two artefacts may publish to one path.** A generated alias that lands on
  an authored file's path hides the authored file — the exported graph's
  `.json` copy at `bootstrap/bootstrap.json` does exactly that to bootstrap's
  own declaration on this site today (the workflow keeps the graph at that
  address and says so). On bootstrap's own site the collision cannot occur,
  because the exported graph is not published there (next rule).
- **An instance's own site serves only what its tools generate** (owner,
  2026-09-30, Q3 of bean `xsqm`). For bootstrap that is bootstrap's files as
  they sit, the schemas and diagram vocabulary among them, the `bs:` term
  vocabulary, and the person-facing pages — all produced by bootstrap-tools.
  **Output a harness computes ABOUT the instance stays on the harness's site,
  under the harness's addresses, naming the instance as its subject**: the
  exported graph `bootstrap.jsonld`, the swimlane glossary, the QA verdicts,
  the translation templates. So a new toolset over the same content never has
  to reproduce a harness's output to publish the content, and a harness's
  output never takes the instance's identity
  ([`kg-separation`](kg-separation.md) §"The pair").

`publish-instance-files.ts` is the step that copies an instance's files into a
site today — each file as it sits, `.md` also as `.html`, `README.md` as
`index.html`. It serves bootstrap under this site until bootstrap's own
repository publishes itself, at which point the job is bootstrap-tools'.

### Tags

A standalone repository — one instance, declared at its root — tags a release
plainly, `v<major>.<minor>.<patch>`; a repository of several instances tags
`<name>-v<major>.<minor>.<patch>`, because a plain tag could not say which
instance it released (owner, 2026-09-30). `check:version-bump` reads both
accordingly. The tag is what a site deploy writes `/<version>/` from, so an
untagged commit is never an agent-facing release.

## What each instance publishes — graph, address, schema, and what is stripped

Owner, 2026-10-02, opening bean `4ak5`: *"there are some rules in the KG
corpsu but scattered."* They were spread over an exporter's docblock, the
deploy workflow's comments, four skills and two beans (item 4). **This section
is where they are stated.** The files that carry the mechanics keep them and
point here for the policy.

### One document per declared instance, of its own directories

**Every directory carrying a declaration publishes ONE JSON-LD document, and
it holds only the directories that declaration names.** A dependency is
referenced by IRI, never inlined. The set is read from the declarations
(`instanceRootsIn`), never listed in a workflow: a list went stale the way
such lists do, missing every instance added since `l4ay`.

| instance | document on this site | built by |
|---|---|---|
| the host, `cat-harness` | `<site>/<stub>.jsonld` | `kg-export.ts --scope instance`, its own line in `docs-site.yml` |
| the checkout root, `folio-assistant` | `<site>/<stub>/<stub>.jsonld` | `kg-export.ts --instance .` (bean `l4ay`) |
| `bootstrap` | `<site>/bootstrap/bootstrap.jsonld` | `bootstrap-tools/scripts/export-graph.ts` (owner, 2026-09-30, bean `xsqm`) |
| every other declared instance | `<site>/<stub>/<stub>.jsonld` | `cat-harness/scripts/instance-exports.ts` |

- **Each document has a `.json` copy beside it**, the same bytes. Pages serves
  `.jsonld` as octet-stream, and `.json` is the only way to get a correct
  `Content-Type` out of it. The `.jsonld` stays canonical, since it is what
  every `@id` names.
- **The first three rows are the only exemptions**, and they are
  `PUBLISHED_ELSEWHERE` in `instance-exports.ts`, each with its reason. No
  other list exists.
- **The host is built in instance scope** since #2135 (owner ruling
  2026-10-05, option B; bean `4ak5` item 2). Before that one document carried
  every stacked instance's nodes under `cat-harness.jsonld#…`: 825 of 3369,
  measured the day it landed. `--scope checkout` remains for a corpus-wide
  consumer that says so (the `kg` search slice). It is never published under
  the host's name: `PUBLISHED_ELSEWHERE`'s pattern for the host refuses it.

The exporter's contract (the two scopes, what each collector reads) is
[`kg-export`](kg-export.md) §"Whose nodes — an instance publishes its own,
and leaves a tombstone".

### An `@id` that moved keeps a tombstone for ONE release

GitHub Pages cannot redirect a fragment. So each `@id` the checkout-scope
host document minted and the instance-scope one does not keeps a node:

```json
{ "@id": "<old>", "deprecated": true, "isReplacedBy": "<the same node in its owner's document>" }
```

`deprecated` is `owl:deprecated` and `isReplacedBy` is
`dcterms:isReplacedBy`. The replacement is minted the way the deploy
publishes the owner (`publishedIdentity` in `kg-export.ts`): an instance that
declares its own `canonicalUrl` is forwarded to its `canonicalUrl`-based
`@id`, so `smart-base`'s tombstones point under `http://smart.who.int/base/`, its
publication identity. Until that site serves it, the root index's `url` says
where this site stages it.
A node no owner's document mints (a package, a schema module) forwards to the
owner's DOCUMENT. A node with no home, or two, is a `problems[]` entry, and
the export exits non-zero rather than publish a tombstone that points
nowhere.

**Removal is due one release after the split** (`tombstonesFor`'s banner:
*"ONE RELEASE ONLY; REMOVE IN THE NEXT"*). Delete `tombstonesFor`, its call in
`buildExport`, the two context terms, and the test in `kg-export.test.ts` that
holds every tombstone to a replacement the deploy writes.

### Which base an `@id` is minted against

`exportIdentity` in `kg-export.ts` decides. The base is `--base-url` if
given; else the instance's own `canonicalUrl`; else, for an instance this
repository publishes, the host's. With no base at all the `@id` is
document-relative and a problem is reported, never a guessed absolute one
(bean `40fl`). The host sits at `<base>/<stub>.jsonld` and a foreign instance
at `<base>/<stub>/<stub>.jsonld` (bean `dyd3`). **An instance declaring its
own `canonicalUrl` is the host of its own base**, so its `@id` is
`<canonicalUrl>/<stub>.jsonld` (#1548), and the deploy passes it no
`--base-url` (`declaresOwnCanonical` in `instance-exports.ts`). Measured
2026-10-05, those are `cat-harness-tools`, `cat-openapi`, `fhir-harness` and
`smart-base`. **This site serves their bytes at `<site>/<stub>/<stub>.jsonld`,
and that is their STAGING location, not their identity** (§"Three questions
that must not be merged" above). The root index records both: `@id` is the
publication identity, `url` is where this site stages it. Anything that names a
node in another instance's document mints with `publishedIdentity`, or it
names a document nobody writes. `iriBase` is a different field, for
identifiers that carry the release (§"Release IRIs" above).

### The schema

`harness-schema-export.ts` writes `<site>/<stub>.schema.json` for the host.
That is the JSON Schema of the declaration itself, which every
`<instance>.json` is validated against. It also writes `tool.schema.json`,
`tool-types.schema.json` and each skill's I/O contract, each at the URL its
`$id` names. `bootstrap`'s schemas are published as they sit, by
`publish-instance-files.ts`.

**Every instance `instance-exports.ts` publishes also publishes
`<site>/<stub>/schema/`** (owner ruling 2026-10-05, option B; bean `4ak5`
item 1). It holds:

- **the instance's own skill I/O contracts**, at
  `schema/skills/<skill>/<io>.schema.json`. They are read from
  `<instance>/schemas/skills/`, the directory its skills' `input:` and
  `output:` refs name. The declared `schemas` graph is not the answer:
  `folio-assistant-sci` declares `sources/` as its `schemas` graph and keeps
  its contracts under `schemas/skills/`.
- **its public Zod schemas**, at `schema/zod/<module>/<Export>.schema.json`
  (§"Which Zod schemas are public" below).
- **an index, `schema/<stub>.schema.json`.** It `$ref`s the shared declaration
  schema (the host's `<stub>.schema.json`, by the `$id` the same build gives
  it) and lists every contract and every Zod rendering in `$defs` by `$id`.

**Every `$id` is the instance's publication identity, not this site's
address.** The schema base is `schema/` beside the document `publishedIdentity`
mints: `<site>/<stub>/schema/` for an instance with no `canonicalUrl`, and
`<canonicalUrl>/schema/` for one that declares its own. So `smart-base`'s
contracts are `http://smart.who.int/base/schema/skills/…`, and this site stages
the bytes at `<site>/smart-base/schema/` (§"Three questions that must not be
merged"). `publishedInstanceSchemas` in `kg-export.ts` is the one place
identity and builder meet, and the deploy and the gate both call it. A stored
`$id` in a source contract is never published: with a base the computed one
replaces it, and with no base the contract has none.

**The document links its index** with `conformsTo` (`dcterms:conformsTo`).
It does so exactly when `instance-exports.ts` writes one, which is when
`publishesInstanceSchema` finds the instance in the plan. The host and the
other two exemptions carry no such link.

#### Which Zod schemas are public

**Owner ruling 2026-10-05, option C: "every exported \*Schema".** In the
owner's words: *"Render all exported Zod \*Schema consts per instance now; may
expose internal schemas."* So an instance's public schemas are **every
exported const whose name ends in `Schema` and whose value is a Zod schema**,
in the `.ts` modules (not `*.test.ts`) directly inside its schemas directory.
That directory is the instance's declared `schemas` graph if it declares one,
else `<root>/schemas/` by convention. `folio-assistant-sci` and `who-iris`
declare `sources/`, which holds JSON descriptors, so they publish none.

The rule is the suffix, literally. A Zod value named otherwise is not public,
and an export named `notASchema` matches if its value is Zod. A `*Schema`
export whose value is not Zod is not public either; the scan lists it as
`notZod` and it is not a failure. Publishing a schema says it is reachable,
not that it is stable: the owner accepted that internal schemas are exposed.

Each one is rendered with `namedJsonSchema` (`to-json-schema.ts`), as the
host's own schema documents are, and gets an `$id` under the same schema base
as the contracts. `scanInstanceZodSchemas` and `renderZodSchemas` in
`harness-schema-export.ts` do the work, and `scannedInstanceSchemas` in
`kg-export.ts` is what the deploy and the gate both call. Once the scan has
run, the index drops `"omitted": ["schemas"]`, so an index with no `zod/`
entries means the scan ran and found none. If the directory could not be
resolved, `omitted` stays.

**A failure fails the publish.** A module that will not import, an export the
converter cannot represent (`z.date()`, `z.custom()`), a value with
`safeParse` that is not a zod-4 schema, and two modules that collide on one
path are each reported. They go into the index as `unrendered`, so "not
rendered" never reads as "not there". `instance-exports.ts` still writes what
did render, then exits 1, which is how it treats a failed `kg-export`.
Logging the failure and exiting 0 would publish a partial `zod/` that reads as
complete.

**The host is left out.** Its schema documents sit at the site root, not
under a per-instance `<stub>/schema/`, and every existing host file must stay
byte-identical, so it gets no `zod/`.

The JSON-LD document's own `omitted` is unchanged. Its schema-node collector
is still instance-bound and lists modules, not exports. The gate fails the
day an instance's export lists a `Schema` node, because nothing yet maps a
module node to its per-export renderings.

### Named subgraphs, and the root index above them

- **Named subgraphs** (bean `c1m4`): `<site>/subgraph/<HARNESS>/<PATH>/`, with
  `index.jsonld` (direct members as pointers) and `index.hydrated.jsonld`
  (every member inline, deep). **The harness root has `index.jsonld` only**,
  because a deep hydrated file there is the monolith `f233` forbids.
  `gen-subgraph-jsonld.ts` frames each instance from its OWN export, so no
  subgraph names a `cat-harness.jsonld#<foreign>` fragment. The tree is
  committed under `cat-harness/docs/subgraph/`, its `@context` is
  `<site>/ns/subgraph/v1.jsonld`, and heavy bodies are content-addressed
  payloads under `cat-harness/docs/payload/sha256/`, copied verbatim to
  `<site>/payload/`. `bootstrap` and `bootstrap-tools` publish their own
  subgraphs, and the repository index links them with `rdfs:seeAlso`
  (bean `t8c4`). The contract: [`kg-export`](kg-export.md) §"Named
  subgraphs" and §"Payloads".
- **The root index** (item 3): `<site>/index.jsonld` and `index.json`, built
  at publish time by `root-index.ts` and never committed (owner,
  2026-10-04): a committed copy conflicts whenever two PRs change the set of
  harnesses. It names every declared instance at depth 1, with no node of
  any graph inlined. It exits 1, having written nothing, when an instance's
  export is not where its identity says, rather than publish a shorter map.

### What is never in a published graph

- **`fsh-guts`.** Owner, 2026-09-19: *"NEVER include fsh-guts, references to
  fsh-guts stripped out of KG before sending to publication."* The one list is
  `UNPUBLISHED_GRAPH_KINDS` in `schemas/cat-harness.ts`. Every emitter filters
  on it where the document is built, not at upload: `isPublishedGraphKind`,
  `isPublishedDirectory` (a directory holding ANY unpublished kind),
  `isPublishedSkill` and `isPublishedSchemaModule`, plus a diagram's
  documentation prose (`publishableDocumentation`). The trashcan has its own
  document, `<site>/fsh-guts.jsonld`, from `fsh-guts-export.ts`. That is
  deliberate: a consumer may fetch it by name and must never arrive by
  following an edge. Mechanics: [`kg-export`](kg-export.md) §"`fsh-guts`
  NEVER reaches a published graph"; what belongs in it:
  [`fsh-guts`](fsh-guts.md).
- **A skill that declares `published: false`** in its front matter
  (`unpublishedSkills` in `known-skills.ts`). The name match and the
  declaration are two inputs on purpose: one asks whether a skill is NAMED
  after the trashcan, the other whether it SAID not to publish it.
- **The nodes of a `state` graph.** The export carries the declared Directory
  node and its `holdsGraph`. No collector in `kg-export.ts` reads a state
  graph's files (measured 2026-10-05). Where such contents are published, it
  is as their declared Subgraph node's own document (`todos.jsonld`,
  [`directory-conventions`](directory-conventions.md) §"Publishing a
  subgraph's contents"), as a SQLite slice built at deploy (bean `q8ar`), or
  on a branch rather than the site (QA verdicts, on `qa-reports`).

### The gates

| gate | fails when |
|---|---|
| `check:published-instance-exports` | the deploy does not run `instance-exports.ts`, a workflow running it drops an exempt instance's own publisher, an exemption names no declared instance, or a published export fails or mints a relative `@id`; or, for a planned instance, a contract its skills name is not written to `<stub>/schema/`, the index is missing, the document's `conformsTo` is not the index's `$id`, or the document lists a `Schema` node the publisher does not render; or an exported Zod `*Schema` const (read from the module text, confirmed Zod by import) is not written to `<stub>/schema/zod/` and listed in the index, the publisher did not scan, or it reports an import or render failure |
| `root-index.ts` at deploy | an instance's export is missing; the deploy fails rather than publish a shorter map |
| `subgraph:jsonld:check` | the committed subgraph tree or its payloads are stale |
| `check:process-index` | a declared BPMN has no `Process` node in the published subgraphs |
| `kg-export.test.ts` | a tombstone forwards to a document the deploy does not write, or a published `@id` dangles |
| `fsh-guts-unpublished.test.ts` | the string `fsh-guts` appears anywhere in the built export |
| `check:node-iris` | a node's identifier is not its file's path under the release address (§"The release site") |

## What a consumer may assume of a draft

- **That the id is stable.** It is the one thing that does not move.
- **That the version distinguishes snapshots** — and nothing more. It carries
  no promise that a snapshot remains fetchable, or that anyone announced it.
- **Nothing about availability.** No registry, no tarball, no announcement.
  Draft is not "published somewhere quiet"; it is "the process that would make
  this depend-on-able has not been built".

An instance that wants to be depended upon from outside does not declare its
way there. It waits for the process, which is somebody's work and not a field.

## Do not

- **Do not infer a publication state from evidence.** A `canonicalUrl`, a
  GitHub Release, a Pages deployment or a `dependsOn` naming this instance are
  all things that exist for drafts too. Inferring from them is how a boolean
  defaulting to `false` erases the difference between "decided" and "nobody
  looked" — the defect §3.1 was right about even where its model was wrong.
- **Do not mint an id for something that already has one upstream.** Record
  theirs as data, mint ours under the namespace above, and keep them apart.
- **Do not restate this skill in a bean, a proposal or `AGENTS.md`.** `kn0t`
  restated `ig-publisher-reduction` and drifted from it in four places within a
  day, one of which would have let a phase be approved on an impression. Point
  here instead.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [A knowledge graph leaves for its own repositories](../../processes/kg-separation.html) | 7 · Plan publication |

