---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'KG export'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/kg/kg-core/kg-export.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/kg/kg-core/kg-export.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/kg/kg-core/kg-export.md){: .fa-edit-source }

{% raw %}
# KG export — publishing the graph as linked data, not as a page

**`agentic-harness` has no renderer.** `folio` is the only `renderable` graph
kind and it belongs to `folio-assist-core`, so the harness cannot put its
knowledge graph on a page the way a folio puts a chapter on one. That boundary
is deliberate and this does not move it.

**The way out is that the export is data.** One JSON document describing the
graph; drawing it is somebody else's job, and may be a static viewer, an
external tool, or nothing at all. Publishing data does not make the harness
self-documenting — it makes it *inspectable*, which is the thing that was
missing.

Per [`skills-and-tools`](skills-and-tools.md):

| | |
|---|---|
| **this skill** | produce the serialization — generic, no host named |
| **the Tool** | publish it somewhere — today `pages-publish` (GitHub Pages) |

A GitLab Pages or object-store Tool satisfies the same skill later. Nothing in
this skill names a host, and nothing in it should.

## It is JSON-LD, and the `@type: @id` coercion is the whole point

Modelled on `WorldHealthOrganization/smart-base`'s
`input/scripts/generate_jsonld_vocabularies.py`. Four things carry the weight,
and the first is the one that is cheap to lose and invisible when you do:

**1. Every edge term is declared `{"@type": "@id"}`.** Without that coercion,
`implementedBy`, `performedBy` and `partOf` are **string literals** to any
JSON-LD processor, and the document is a list of records that merely *looks*
linked to a human reading the JSON. Declaring them costs one line each and is
the difference between 900 records and a traversable graph. A test asserts it.

**2. The document's `@id` is the URL it is served from**, with
`@type: prov:Entity` and a `generatedAt` typed `xsd:dateTime`. Fetch the `@id`,
get the document. smart-base's type-usage note is explicit about this and it is
what makes the graph mergeable with anyone else's.

**3. Node IRIs are fragments of that document** —
`…/kg/<stub>.jsonld#skill/todo-manager`. The prettier
`…/kg/skill/todo-manager` is a **lie**: nothing serves that path. `AGENTS.md`
records the same defect in the README generator, which composed PDF links by
convention and shipped twenty-three 404s. **An `@id` that looks dereferenceable
and is not is worse than one that is obviously local.**

**4. No `@vocab`, and `id`/`type` are aliased.** Every term carries its full
namespace IRI, so an undeclared key stays undeclared instead of silently
minting an IRI nobody chose. The aliases keep the published JSON readable as
ordinary records for someone who does not know JSON-LD.

**5. Every property name in `@graph` is declared in `@context`, and the export
FAILS if one is not.** A name that is neither declared nor an absolute IRI is
not a property: a processor drops it. Measured before bean `ovkk`, 19 declared
terms against 53 used — **34 names, 3583 occurrences**, every one of them
visible when the file is read as plain JSON, which is why it went unnoticed for
as long as the document had no consumer.

## Declaring a term is a decision, not a line of context

Five questions, in this order. The worked call for each term is in
`buildContext()`, beside the term it justifies.

1. **Does the fact belong in the graph at all?** Five of the thirty-four were
   DENORMALISED copies of links already present — `implementsSkillNames`,
   `satisfiesSkillNames`, `graphTypologies`, `packagePaths`, `laneName`. Removed
   rather than declared, once every one of those links was shown to resolve for
   every node. A name beside the link that reaches it is a second answer that
   can go stale; what a consumer must never have to do is recover a fact by
   splitting an IRI.
2. **Is it a LINK or a literal?** Wrong here is worse than undeclared —
   confidently wrong rather than absent. Under `{"@type": "@id"}` the value
   must already BE an IRI: a bare `git-push` resolves against the document base
   to `<base>/git-push`, which nobody minted and nothing serves. So
   `hasCapability` mints its values with `makeIri`, and a repo-relative path
   (`instructionsPath`, `sourcePath`, `maintainsFrom`) stays a literal for the
   reverse reason.
3. **Does the referent exist in this graph?** `roleName`, `permissionName` and
   `decisionRef` stayed names: the role registry, the permission vocabulary and
   the DMN tables are not collected, so 69 coerced IRIs would have resolved to
   nothing. Each becomes a link the day its referent becomes a node — residue
   worth recording, not a reason to assert the edge early.
4. **Is one name carrying two relations?** Then it is two terms: `source` was a
   `.bpmn` path on a Process and `bpmn-lane` on a lane-derived Role (a node
   kind retired in #1168 B9b: a lane is now a `Lane`), so it is
   `sourcePath` and `sourceKind`. Heterogeneous SHAPE under one relation is a
   different case — `install` is a command string from a Capability and a
   dispatch object from a Tool, and stays one term typed `@json`, because
   declaring a container term alone keeps the outer key and drops every inner
   one.
5. **Does a published standard already say it?** Then the term IS the
   standard's property, and nothing is minted. Owner, 2026-09-30 (bean
   `xsqm`): *"emphasize preexisting standards … now align"*. `title` and
   `description` are Dublin Core's; `partOf`/`inSubgraph` are
   `dcterms:isPartOf`, `holdsGraph` is `dcterms:type`, `conformsTo` is
   `dcterms:conformsTo`; a sequence flow's `from`/`to` are BPMN's own
   `sourceRef`/`targetRef` and a node's `incoming`/`outgoing` BPMN's
   attributes of those names; `implementedBy` and `bindsRole` are bootstrap's
   `processes:skill` and `processes:role`, the extension attributes the
   diagram itself carries. bootstrap's own graph (bootstrap-tools'
   `export-graph.ts`) uses the same IRIs, so the two graphs agree.

   **How, so it cannot drift:** a term that restated a standard keeps its
   gloss in `schemas/vocabulary.ts` and gains `replacedBy`, a CURIE.
   `buildContext()` maps each such key through `propertyIri()`
   (`schemas/namespaces.ts`), which reads that field, so the exporter cannot
   name one IRI while the vocabulary names another. The published vocabulary
   keeps the old term, `owl:deprecated` and `dcterms:isReplacedBy` the
   standard property: data already holding the old IRI still dereferences to
   a definition that says where to go. The JSON keys are unchanged, so a
   reader of plain JSON sees no difference.

   What stays minted is what no standard says: `performedBy`, `inLane`,
   `hasSkill`, `startNode`, and the rest. BPMN spells a lane's members as
   `flowNodeRef` on the LANE; `inLane` is the inverse, on the node, and no
   standard names that direction.

**No `canonicalUrl` and no `--base-url` → no absolute IRIs**, reported in
`problems[]` rather than papered over. A fabricated absolute base is the same
failure as a fabricated link.

## Every key is a declared term — in content documents too

Rule 5 above, applied to CONTENT (bean `yh6u`): in every document on the
published content context, a plain key must be a declared term, or a JSON-LD
processor drops it without a word. Measured before the check existed: 8
undeclared keys across 392 committed figure blocks — every agent-drafted figure
narrative was being dropped. `bun run check:context-emission` now fails on one.

It does **not** descend into a value typed `@json`. Such a value is a JSON
literal by declaration: its inner keys are data, not properties. That is the
right home for a nested structure that is ours rather than linked data, and
**the only way its nulls survive** — the three-state rule lives in them.

**A path is a literal, never an `@id`.** A document-relative path coerced to
`@id` resolves against the context's `@base`, not against the document, and so
names a location the file is not at. `text` did exactly that on all 1,323
committed prose blocks — `../sections/x.md` became a well-formed link to
nowhere — until bean `589f` made it, `leanSource` and `file` literals.
`check:context-emission` now fails if a file path sits under any `@id` term.

**The upgrade rule** (owner, 2026-09-23, chosen for the least drift): a path
term becomes a link — `@type: @id` with ABSOLUTE IRIs minted by the one
function that mints block IRIs — when, and only when, the files it names are
SERVED at a URL an instance declares. Until then a link is a promise nothing
keeps, and a literal is the honest record: one reading, resolved by our tools
against the file that carries it.

## A prefix is the stub — and a prefix that is spoken must be bound

Owner, 2026-09-23: *"prefix -> match stub"*. Each of our namespaces is
`<canonical>/<stub>/ns#`, so the prefix bound to it is **that same word**:

| namespace | prefix |
|---|---|
| `https://litlfred.github.io/bootstrap/0.1.0/ns#` | `bootstrap` |
| `…/folio-assistant/cat-harness/ns#` | `cat-harness` |
| `…/folio-assistant/folio-assistant-core/ns#` | `folio-assistant-core` |

bootstrap's row is the exception to the `<canonical>/<stub>/` shape, and says
so: its namespace sits under bootstrap's own `iriBase` and carries the
release version (bean `r3gy` E), because bootstrap is published from its own
repository and an agent reading it pins a release. The prefix is still the
stub. The address is written once, in `cat-harness/code-lists/own-namespaces.json` (read as
`CAT_BOOTSTRAP_NS`), and `iri:sync` keeps every literal copy — this table's
included — at bootstrap's declared version.

One word in three places — path segment, stub, prefix — instead of three
words that must agree.

### Naming a namespace document — `ns`, and why (owner, 2026-09-30)

**A namespace document is published where its identifiers point**, so its file
name IS its address: `bootstrap/ns.jsonld` is what makes
`…/bootstrap/0.1.0/ns#Node` resolve, and `check:node-iris` fails the day they
differ. Renaming the file renames every term.

The owner asked whether `ns` should be a friendlier name (`vocabulary.jsonld`,
`schemas/terms.jsonld`) and chose to keep it, on this analysis:

- **It is the house rule and the common practice.** Six of this project's own
  namespaces end in `/ns#` — each layer's, core's DSpace fields, and both
  process-extension namespaces — and `<canonical>/<stub>/ns#` is what "the
  prefix is the stub" rests on. W3C publishes PROV, DCAT, ORG and SHACL under
  `w3.org/ns/`.
- **Renaming is not local.** Changing the pattern means renaming cat-harness's
  and core's namespaces, already published (a MAJOR version each under
  `instance-versioning`), and 91 BPMN files binding the process namespaces.
- **`schemas/` would misclassify it.** Here a schema is what a Node is
  *checked against*; a vocabulary *defines words*.
- **Findability is solved without renaming**: the file's own `label` ("bootstrap
  vocabulary") is what the generated README file table shows beside it.

### One source per layer — and no all-layers union (owner, 2026-09-30)

Each layer's vocabulary is ONE document, and every term's `rdfs:isDefinedBy`
names that document. bootstrap's is `bootstrap/ns.jsonld`, written by
bootstrap-tools from bootstrap's own terms and committed; the site copies it,
and the harness's full build reads it rather than rebuilding it, so nothing
can say a thing about a bootstrap term that bootstrap's file does not
(`ns-export-skos.test.ts` holds them equal, node for node).

The all-layers union at `<site>/ns/vocabulary.jsonld` is **retired**. Asked
where it should live for findability, the answer came from who reads it: a
program follows a term's IRI to its layer document; a person looking for terms
goes to the Glossary, which lists every term and publishes SKOS for every
scheme. The union served neither, linked from no page, and was a third copy of
the same terms — so it is gone, rather than moved. `NS_PREFIXES` in `schemas/namespaces.ts` is the one
list; `stubOfNamespace()` reads the stub back off an IRI. The abbreviations
`bs`, `cat` and `fac` were retired the same day, for a measured reason
rather than taste.

**Why an abbreviation is a defect waiting to happen (bean `zaqn`).** The
content `@context` renamed its binding from `folio` to `fac` and kept writing
twenty terms as `folio:…`. **An unbound prefix is not an error to a JSON-LD
processor**: it reads `folio` as a URI SCHEME, so `folio:Definition` expanded
to an absolute IRI that is well-formed, means nothing, and joins with nothing
— in 1,737 committed documents. Every gate was green, for two reasons worth
remembering:

- a `--check` drift gate compares the generated copy with its SOURCE, and the
  source was wrong the same way — **a drift gate proves agreement, never
  correctness**;
- `check:context-emission` asked only whether each *bound* prefix is spoken.
  The converse — is each *spoken* prefix bound? — is the direction that
  corrupts data, and nothing asked it.

**The two rules, and what enforces them** — `bun run check:context-emission`,
in CI (`code-quality-gates.yml`), over every committed `.jsonld`:

1. **Spoken ⇒ bound.** A compact IRI used as a KEY or an `@type` value must
   have its prefix bound in that document's context — inline, or the
   published one by URL, or an array of both. The published context's own
   term targets are checked too, whether or not a document uses them. Plain
   string VALUES are not read as CURIEs: `label: "def:foo"` is an authored
   label, which is exactly the hazard `schemas/jsonld.ts` opens with.
2. **Own namespace ⇒ stub spelling.** A binding onto a `…/<stub>/ns#`
   namespace of ours must be spelt `<stub>`, and `<stub>` must be declared by
   an instance (`<stub>/<stub>.json`).

A context URL the check cannot resolve is **"could not determine"**, counted
and listed — never read as clean.

**Checking a fix: expand, don't read.** A compact IRI looks right to a human
whether or not it is bound. The evidence that closes a prefix defect is a
document run through a JSON-LD processor, with **zero** expanded IRIs outside
`http(s):`.

**Where a prefix cannot be bound at all, a different spelling is never the
answer.** CSVW metadata allows only `@language` and `@base` in its local
context, so the `fac:` keys in `tabular-metadata`
dangled under ANY prefix. The two real answers are absolute IRIs, or not being
JSON-LD at all. Bean `792y` took the second: the record became plain JSON and
the CSVW document is derived from it. **A file whose extension says `.jsonld`
is making a claim** — a processor will read every colon-key in it as an IRI.

## `fsh-guts` NEVER reaches a published graph

Owner, 2026-09-19: *"NEVER include fsh-guts, references to fsh-guts stripped
out of KG before sending to publication."*

**Keeping the CONTENT out of the render pipeline is a different property from
keeping the REFERENCE out of the graph**, and shipping the first while
believing it covered the second is exactly how this was got wrong. An
instance's declared directories become nodes in `<stub>.jsonld`, so declaring
`fsh-guts/` — which is required, or no tool can find it and the never-delete
rule has no destination — put its id, path and description into the published
document.

`UNPUBLISHED_GRAPH_TYPOLOGIES` in `schemas/cat-harness.ts` is the one list, read by
every emitter, so two filters cannot disagree about what is excluded.

**Three emitters had to be filtered, and the third was found only because the
first two were not enough:**

| emitter | what leaked |
|---|---|
| graph typologies | the `fsh-guts` GraphTypology node |
| declared directories | the Directory node — id, path, description — and its `holdsGraph` edge |
| **skills** | `skill/fsh-guts`, plus the `declaresSkill` edge from `package/folio-core` |

The skill is excluded on the merits as well as the letter: its subject IS
where SDLC churn goes, so publishing it advertises the trashcan to every
consumer of the graph. **An edge to a stripped node is not a compromise —
it is a dangling reference that still spells the name it was meant to
remove.**

**A directory is excluded when ANY graph it holds is excluded**, not when all
of them are. `graphs` is an array and `schemas/` already holds two; an "all"
test would publish a directory holding both `cat-harness` and `fsh-guts`,
naming the path on the way past.

### This is not a contradiction of `<base>/fsh-guts.jsonld`

Different documents. That one IS the trashcan's graph and is fetched by name;
every other published artefact must carry no path to it. A consumer may go
there deliberately and must never arrive by following an edge.

### Strip where the document is built

Not at upload. A strip on the happy path only leaves a graph that **looks**
clean and is not, and the test must read the built artefact rather than the
inputs. `scripts/tests/fsh-guts-unpublished.test.ts` serialises the whole
export and asserts the substring is absent — a structural check would have to
know every field that could carry it, and the one it forgets is the one that
leaks.

That test also carries its own cautionary tale: its first version read
`.graph` where the export uses `@graph`, filtered `undefined`, and passed
while two nodes were still leaking. It now asserts the node list is non-empty
before filtering it.

## Staging must not claim to be canonical

CI passes `--base-url` for a branch preview. Without it every staged export
mints `@id`s pointing at `main`'s published document, and two different graphs
assert the same IRIs — the preview would claim to **be** the canonical graph.
That is not cosmetic: an `@id` is an assertion of identity, and duplicating one
is how a merged graph acquires contradictory statements about the same node.

## The graph carries its own vocabulary

Graph typologies are **nodes**, not just TypeScript. Follow `holdsGraph` from a
directory and you arrive at a node saying what that kind holds and whether it
renders. Without them the vocabulary needed to interpret the document lives
only in code the consumer cannot fetch — which is the difference between a
self-describing graph and a graph with documentation.

The schema half is `scripts/harness-schema-export.ts`: the declaration's JSON
Schema, published at the URL its own `$id` names, so a consumer holding an
a declaration it does not understand has somewhere to go. It is a third
rendering of `CatHarnessDeclarationSchema` beside the JSON-LD — **not a
second authority**; the Zod is authoritative, per
[`directory-conventions`](directory-conventions.md).

## A preview says what it is, and links back — explicitly

Passing `--base-url` stops the collision: a preview's nodes get preview IRIs,
so the two graphs cannot contradict each other. That left the opposite problem —
the graphs became **unrelatable**, and nothing could say "this PR changes skill
X", which is most of what a preview graph is for.

Three things close it, and all three are stated in the artefact rather than
left to a convention:

| | |
|---|---|
| `@type` | `[prov:Entity, folio:PreviewGraph]` — "am I the real one?" is answerable from the document's own type |
| `canonicalDocument` | the canonical document's IRI, at document level |
| `alternateOf` | **per node**, `prov:alternateOf` → that node's canonical IRI |

**`prov:alternateOf`, never `owl:sameAs`.** `sameAs` entails identity, so a
reasoner merges every statement about both nodes — and if the preview changed a
skill's description, the merged graph would assert two conflicting descriptions
of one thing. That is exactly the contradiction distinct IRIs were introduced to
avoid. `alternateOf` says "same underlying thing, different presentation" and
merges nothing.

**The per-node links are derivable, and are emitted anyway.** `makeIri` produces
an identical fragment whatever the base, so a consumer *could* swap one base for
the other. 968 fields instead of one. That is the deliberate trade, on the
owner's standing rule: **a downstream consumer must never have to
string-manipulate or infer a rule to follow a link.** A rule a consumer has to
know is a rule a consumer can get wrong, and the cost is paid by someone who
cannot see the code that made the assumption look reasonable. See
[`crdm-requirements-workflow`](crdm-requirements-workflow.md) §"Consumer burden
is a requirement".

**Vocabulary nodes get no `alternateOf`.** Graph typologies are minted under the
namespace, not the document, so they are byte-identical in both graphs. A
blanket loop gave them one pointing at a canonical fragment that does not
exist — a generated broken link is still a broken link, and a test now pins it.

## Naming — artefacts take the repository's name, the config does not

The **stub** (`<name>.json` → `stub`, defaulting to `name`) is the
filename stem of everything this instance publishes: `<stub>.jsonld`,
`<stub>.schema.json`. One helper, `artefactStub()`, computes it, so the two
exporters cannot disagree about what this instance is called.

smart-base does the same and derives its stub by stripping a prefix
(`smart-base` → `base` → `https://smart.who.int/base`), so stub, directory and
published path are one word.

**The declaration file is named for the instance's `name`, not its `stub`.**
It is `<name>.json` — so it is still not stub-named, but it is no longer a
fixed word either, and the argument that used to stand here was reversed on
2026-09-21.

That argument ran: a consumer bootstrapping into a repository it knows nothing
about needs **one fixed filename to open first**, so the declaration stays
`harness.json` exactly as smart-base's config stays `dak.json`; renaming it
per-repo buys consistency and costs discovery.

(The `dak.json` half of that quoted argument has since gone too: the DAK
marker is ours and became `dak.config.json` on 2026-09-22. The quote is left
as it stood, because it is a record of what was argued.)

**The discovery half was answered rather than traded away.**
`findDeclarationFile()` scans a directory for a `*.json` carrying a `name`
whose stem EQUALS that name, so a consumer still opens a declaration without
being told its filename — it matches on the file agreeing with **itself**
instead of on a word agreed in advance, and two such files in one directory
**throw** rather than one being picked silently. What the old objection
warned of was a resolver deriving the name from the DIRECTORY, which would
find nothing in a repository cloned under a different name; that is precisely
what this does not do.

Everything the declaration *describes* remains free to be named, for the
reason given before: by the time you fetch those you have read the
declaration naming them.

## The edges are the reason to publish

A list of skills is not a graph, and a JSON array of them would not have been
worth a pipeline. What makes the export worth having is the relations that
already exist on disk and that **no tool surfaces**:

- **activity → skill.** Every BPMN activity may carry
  `<bootstrap.processes:skill ref="…"/>`, so the export can say which process step is
  implemented by which skill.
- **activity → role.** A BPMN lane is the role that performs the step.
- **skill → package**, and a skill's **two facets**: its instruction body
  (`<name>.md`) and the I/O contract it names in its front matter
  (`input:`/`output:`, usually `schemas/skills/<name>/`).

That last one is the one to understand before editing the exporter. **A name
may have an instruction body, an I/O contract, or both — they are facets of one
skill, not two kinds of skill.** So the graph is keyed by *name*, which is also
what a BPMN ref uses. Keying by file instead produces two disconnected node
sets and loses the relation entirely.

It is also what makes "declared somewhere, written nowhere" visible: measured
on `main` 2026-09-18, of 135 skills only **11 have both**, 113 are prose with
no declared I/O, and 11 are an I/O contract with no prose. None of that was
visible before the export existed.

## A partial graph must never pass for a whole one

This is the rule, and it was learned by breaking it in the module that states
it. The first exporter looked in six instruction-body directories, did not know
about `schemas/skills/`, and reported **11 BPMN skill refs as dangling** — they
resolve fine. A partial graph had been produced and would have been published
as a complete one.

**Why that is worse than an error.** A consumer of the JSON cannot distinguish
a skill that is absent from one that was never collected: both are simply not
in `@graph`. Counts look plausible either way and nothing fails. It is the
`dh4f` shape — a clean run over a corpus the tool could not read.

Three consequences, all of which the implementation carries:

1. **A source that cannot be read goes in `problems[]` and the export exits
   non-zero.** Publishing is blocked, rather than a truncated file being
   deployed.
2. **`counts` by type ships with the graph**, so a consumer can see at a glance
   that a corpus it expected is missing, without re-deriving it.
3. **The invariant is asserted against something outside the exporter's own
   view.** `scripts/tests/kg-export.test.ts` requires every skill a *diagram*
   names to appear — and `check:workflow-refs` independently guarantees those
   refs resolve against the real skill locations. So if the exporter's notion
   of where skills live ever narrows again, the test fails. An invariant
   checked only against the exporter's own collection would have passed the
   original bug.

## Whose nodes — an instance publishes its own, and leaves a tombstone

**The policy is [`instance-publication`](instance-publication.md) §"What each
instance publishes — graph, address, schema, and what is stripped"**: which
instance publishes which document where, the owner's 2026-10-05 ruling
(option B; bean `4ak5` item 2), and when the tombstones are removed. This
section is the exporter's side of it.

`buildExport` takes `scope`, and the CLI `--scope <instance|checkout>`:

| scope | reads | for |
|---|---|---|
| `instance` (default) | this instance's declaration alone | the published document, its locale variants, its QA sidecar |
| `checkout` | this instance plus every instance stacked on it | a corpus-wide consumer that says so — the `kg` search slice |

A tombstone, one per `@id` the checkout-scope document mints and the
instance-scope one does not:

```json
{ "@id": "<old>", "deprecated": true, "isReplacedBy": "<the same node in its owner's document>" }
```

`deprecated` and `isReplacedBy` are `owl:deprecated` and
`dcterms:isReplacedBy` in the context, as `ns-export` already publishes a
retired term. A tombstone has no `@type` and is in neither `counts` nor
`danglingLinks` — a link to a node that left still reads as dangling. A node
no owner's document mints (a package, a schema module: those collectors are
instance-bound) forwards to the owner's DOCUMENT. The owner's IRI is minted
the way the deploy publishes it (`publishedIdentity`). Removing them means
deleting `tombstonesFor`, its call, and the two terms.

## Named subgraphs — one IRI, two files, framed from one graph

**Contract (bean `c1m4`; owner rulings 2026-10-03).** A *named subgraph* is a
directory of a declared graph, read as a set of KG nodes: `skills/` is one, and
so is `skills/sdlc/`. Asking for "every node of `cat-harness/skills/sdlc`" must
take one fetch. Before this contract it could not be done in one step. Today's
export is one document per instance, and `skills/sdlc` is not a subgraph
anywhere (measured 2026-10-03; the evidence is on bean `c1m4`).

### Identity

- **The subgraph IRI is a directory IRI in its own namespace:**
  `<BASE_URL>/subgraph/<HARNESS>/<PATH>/`, for example
  `…/subgraph/cat-harness/skills/sdlc/`.
- It is kept apart from content-node IRIs on purpose. A subgraph is a *view* of
  nodes, not one of them, so renaming a file never renames the subgraph, and
  re-homing a node never re-mints the subgraph.
- `/hydrated-graph/` was rejected. The pointer-only file would then live under
  a path that says "hydrated".
- **The repository's level is `<BASE_URL>/subgraph/`** (bean `ax6r`). It has
  `index.jsonld` only, and its `hasSubgraph` are the harness roots this build
  frames. It is the one file a consumer needs to find every root. The workflow
  page starts there.

### Two files under the IRI

Both files have root `@id` = the directory IRI.

| file | what is in it | who it is for |
|---|---|---|
| `index.jsonld` | **referenced**: each direct member as a pointer (`@id`, `@type`, label), and each child subgraph by its IRI | search, navigation, skeleton loading (`f233`) |
| `index.hydrated.jsonld` | **dereferenced**: every node in the subgraph's *transitive* membership, inline and fully hydrated | "give me all of `skills/sdlc`" in one fetch |

Rules for the pair:

- **The hydrated file carries KG metadata, never heavy content.** Markdown
  bodies, images and binaries are payloads, reached by a `payload` link
  (§"Payloads — heavy content by content address", below).
- **The root has `index.jsonld` only.** A harness instance is itself a named
  subgraph of the repo KG, and the repo KG is the level above it. A *deep*
  hydrated file at the root would be the whole graph in one document, which is
  the monolith `f233` forbids. The owner ruled "deep, but not at root"; the
  rejected options were shallow everywhere, deep everywhere, and size-capped.
- **The GitHub Pages caveat.** Pages does no content negotiation, so the
  directory IRI is documented as resolving to `index.jsonld` by explicit path.
  A consumer that dereferences the bare IRI gets whatever Pages serves for the
  directory; `index.jsonld` and `index.hydrated.jsonld` are always addressable
  by name.

### Building the files

- **One source, two frames.** Both files come out of one build step, from the
  same in-memory graph, by JSON-LD **framing**: a pointer frame
  (`@embed: @never`) and an embed frame (`@embed: @always`).
- **Never two hand-synced properties.** No `authorUri` beside `author`. Two
  properties carrying one fact is the drift `data-modelling` §3 exists to stop.
- **`@context` is never inlined.** Every file declares the one shared, cached
  context URL, the way content documents already use
  `ns/content/v1.jsonld`.
- **Where it is built.** `bun run subgraph:jsonld`
  (`scripts/gen-subgraph-jsonld.ts`) frames kg-export's in-memory graphs —
  one per framed instance, each from its OWN export, never a stacked
  instance's node under this document's tombstoned `@id` — and
  writes `docs/subgraph/<HARNESS>/<PATH>/index[.hydrated].jsonld`, which Pages
  serves at the subgraph IRI, plus the context at `ns/subgraph/v1.jsonld`.
  `subgraph:jsonld:check` is the gate. The file shape is
  `schemas/subgraph-manifest.ts`.

### Membership is declared, not inferred

- A subgraph's members are what its **declared membership rule** selects.
- For a directory of a declared graph, the rule is *containment*: a node is in
  the deepest subgraph directory that contains its source path, and in every
  ancestor of that one, transitively.
- **An overlaid instance heads its own tree** (bean `ax6r`). kg-export reads
  the corpus of every instance stacked on this one, so `folio-assistant-core`'s
  processes and skills are nodes of this graph. Until then they all fell to
  the root, which has no hydrated file, so "every process of this graph"
  could not be fetched at all. A directory belongs to the instance that
  declares it, so those nodes now sit under `<BASE_URL>/subgraph/<that
  instance>/…`, framed by this build because this graph publishes them. Their
  `@id`s do not change.
- **Bootstrap gets no tree here.** `bootstrap` and `bootstrap-tools` sit
  *below* this instance, and `pve3` (#432) keeps their processes out of its
  graph. They publish through their own graph. Framing a tree for them here
  would re-carry what that ruling excluded, so a consumer that needs their
  subgraphs needs bootstrap to publish them.
- A harness's own rule, saying which directories are its graph, is its
  `<instance>.json` declaration. `Harness` and `Subgraph` therefore share
  one base, `GraphNodeDirectoryShape`. They do not get two parallel
  "directory with members" types.
- A node whose subgraph cannot be determined goes in `problems[]`. It is never
  silently left out (§"A partial graph must never pass for a whole one").

### Consumers

- **Remote materialization reads these same files.**
  `bun run kg:materialize --nodes <subscription> <subgraph-path>` fetches one
  subgraph's `index.hydrated.jsonld` at the subscription's pin. It never does
  a sparse checkout of the subgraph's directory. The file is validated against
  `SubgraphHydratedSchema`, its root `@id` must be the subgraph asked for, and
  it is held with a sha256 record. A request for the root is refused, with a
  pointer to `index.jsonld`. This is a metadata mode (owner ruling
  2026-10-03). The byte copy (`kg:materialize <subscription> <subgraph>`) is
  unchanged and keeps its five gates. See
  [`kg-subscription`](kg-subscription.md)
  §"metadata mode".
- A subgraph manifest that lists a child IRI but whose child file is missing is
  a dangling link. It is reported, never skipped.

## Payloads — heavy content by content address

**Contract (bean `f233`; owner ruling 2026-10-03).** The subgraph files are the
**skeleton**: topology and the metadata a search needs. Heavy content is the
**muscle**, and it lives outside the graph, one file per distinct body. No
generator emits a monolithic graph file that inlines bodies.

### Addressing

- **A payload's IRI is `<BASE_URL>/payload/sha256/<hex>`**, where `<hex>` is the
  lower-case hex SHA-256 of its bytes. Nothing else names it: no extension, no
  source path, no node id.
- **It is immutable.** The bytes at an IRI never change, because a change to
  the bytes is a change to the name. A consumer may cache a payload forever.
- Immutable is not "kept forever". A payload no node links to is an **orphan**:
  the gate fails on it and the generator removes it on write. An old IRI may
  therefore stop resolving once nothing references it; while it resolves, it
  resolves to the same bytes.
- **Identical bodies are one file**, linked from every node that has them.
- **The bytes are the source file verbatim.** A Markdown body keeps its front
  matter, and its relative links resolve against the node's own source path
  (`instructionsPath`), not against the payload IRI.

### The link

Every node with a payload carries one `payload` link, in **both** subgraph
files. In the index it sits on the pointer; in the hydrated file it sits on the
whole node, in place of the body:

```json
"payload": { "@id": "<BASE_URL>/payload/sha256/<hex>", "sha256": "<hex>", "bytes": 12653 }
```

`sha256` and `bytes` let a consumer verify a fetch, and decide whether to make
it, without a second request. `sha256` is the IRI's last segment by
construction, and the schema checks it.

### The media type is in a sidecar

`<hex>.json` beside `<hex>` carries `$schema: cat-harness-payload/v1`,
`sha256`, `bytes` and `mediaType`. It is a sidecar rather than an extension for
two reasons:

- the ruled IRI has no extension, and `<hex>.md` would be a second address for
  one payload;
- GitHub Pages types a file by its extension, so an extensionless payload is
  served as `application/octet-stream` whatever it holds.

A consumer holding only the IRI appends `.json`. The media type is not also on
the link, because one fact gets one place. It comes from the source file's
extension through a declared table; an undeclared extension is a problem, never
a guess.

### What is heavy

Decided from measurement on 2026-10-03, over kg-export's graph for this
instance. The graph held 3,120 nodes and 2.5 MB of metadata, and no literal
field was over 4.6 KB. The graph therefore inlined no body already, so "heavy"
means what its pointers name:

| node | field | files | bytes | heavy? |
|---|---|---|---|---|
| Skill | `instructionsPath` (.md) | 300 | 3.0 MB | **yes** — the instruction body |
| Asset | `path` (.md; an image would be too) | 3 | 12 KB | **yes** |
| Process / Decision | `sourcePath` (.bpmn / .dmn) | 78 / 10 | 1.5 MB / 58 KB | not yet — the topology is already graph nodes, and the XML is its own graph's source |
| Schema | `module` (.ts) | 161 | 2.5 MB | no — code, not content |

No deep provenance is in the graph today, so none moves. The table that decides
this is `HEAVY_POINTERS` in `schemas/subgraph-manifest.ts`, and adding a row
there is the whole change to make a field heavy.

### Building and checking

- `bun run subgraph:jsonld` writes the payloads to `docs/payload/sha256/` in
  the same run as the subgraph files, from the same graph.
- The docs workflows copy that directory into the site **verbatim**. It is
  excluded from Jekyll, which would render a body's front matter and Liquid,
  and then the served bytes would not hash to their name.
- `subgraph:jsonld:check` is the gate. It fails on any of these:
  - a stale or stray file;
  - a payload no node references;
  - a node whose payload is missing;
  - bytes that do not hash to their name;
  - a payload without its sidecar, or a sidecar without its payload.
- The schema is `PayloadLinkSchema` and `PayloadSidecarSchema` in
  `schemas/subgraph-manifest.ts`.

## Per-slice SQLite — a named subgraph as one file a browser mounts

**Contract (bean `q8ar`; owner ruling 2026-10-03: the official SQLite WASM
build with an OPFS VFS, pilot slice `beans`).** A large graph needs search on
the client, and a static host cannot run a query. So CI flattens one slice into
a relational schema and publishes it as `<slice>.<sha256>.sqlite3`, and the
browser opens that file as it is. There is nothing to parse, because SQLite reads its
B-tree pages on demand. This is the **skeleton** of `f233` in a second
encoding. It never replaces the JSON-LD files above; it sits beside them for
the consumer that has to search.

**One builder, one definition per slice.** `scripts/gen-slice-sqlite.ts` is the
`slice-sqlite` Tool; its procedure is the `slice-sqlite-publish` process. Each
slice is one `SliceDef` in its `SLICES` table: the DDL, each stored table's
columns and row order, the one FTS5 index and the rows it covers, where the
payloads live, the `search` block the page reads, and a `load` that turns the
source into rows. The engine (build, `VACUUM INTO`, digest, manifest,
`--check`) names no slice. Adding a slice is adding a definition, **never a
copy of the builder**.

### The four pilots, measured

Measured 2026-10-03 in this checkout (`bun run slice:sqlite -- --out <scratch>`;
browser figures from `slice-sqlite.e2e.ts` in Chromium on loopback, first open
including download and sha256 verification):

| slice | source | file | source as published | rows | payloads | build | first open |
|---|---|---|---|---|---|---|---|
| `beans` | `beans/defs/` | 2.83 MB | 4.82 MB of bean files | 723 beans, 84 edges | 723 bean files, at deploy | 0.26 s | ~190 ms |
| `todos` | `assets/todos/index.json` | 0.07 MB | 18 KB of JSON | 3 todos, 12 relations | 3 todo files, at deploy | 0.22 s | ~110 ms |
| `library` | `assets/library/index.json` + `entries/<id>.json` | 2.48 MB | 3.59 MB of JSON | 64 entries, 3,557 blocks | 64 entry files, at deploy | 0.23 s | ~165 ms |
| `kg` | the whole-repo KG export | 3.40 MB | 3.03 MB of JSON-LD | 3,121 nodes, 12,835 edges | 303, already committed | 4.8 s | ~180 ms |

**All four are under the ~5 MB budget**, so all four shipped. The whole-repo
slice is the **no-body variant**: nodes, edges, and an FTS5 over names,
titles, summaries and descriptions, with bodies as payload pointers. It is the
one slice larger than its JSON source, because it adds a full-text index the
JSON does not have; it stays under budget because it stores IRIs as fragments
of the document (`skill/todo-manager`, with `<doc>#` in `meta.base`). The
budget is `SIZE_BUDGET_BYTES`, **reported** in the manifest as `overBudget` and
not gated: the beans slice grows every session, and a gate would turn every
open PR red on the day it crossed the line, for a change nobody made. Over
budget means stop and report (the process's budget gateway), not ship.

### What a slice file holds

- **One table per node type, one row per node.** Columns are the fields a
  search filters or sorts on. Each has a B-tree index where a query needs one.
  A JSON-valued field stays a JSON column and is read through JSON1
  (`json_each`), rather than becoming another stored table.
- **One stored table per relation, never two.** When a relation can be
  declared from either side, as a bean's `blocking:` and `blocked_by:` can, the
  table has a `declared_on` column saying which side declared each edge, and
  the two directions are **views** over it. Two tables for one relation are two
  answers that can disagree. When a relation is declared on one side only, a
  `declared_on` column could hold one value, so it is left out (`todos`,
  `library`). When the relations are many and share one shape, they share ONE
  table keyed by `rel`: the `kg` slice's 36 `@id`-typed terms are rows of
  `edges (src, rel, dst)`, with `incoming` and `dangling` as views, because 36
  tables of one shape would be 36 places to change it.
- **An FTS5 index over the searchable text.** It is CONTENTLESS
  (`content=''`), so it indexes text without storing it. It keeps **full
  detail**, because positions are what make a phrase query work. Both the
  official WASM build and `bun:sqlite` compile with `ENABLE_FTS5` (measured
  2026-10-03: 3.53.4 and 3.53.0).
- **No heavy content.** A row carries `payload_sha256`, a pointer to the
  payload at `<BASE_URL>/payload/sha256/<hex>` (§"Payloads"). The client fetches
  the payload when a result is opened. Measured on beans, the same 717 rows
  take 7.85 MB with the bodies stored and 2.82 MB without them; the bodies were
  4.58 MB of the larger file. **What the payload is, is a per-slice decision**:
  a bean's or a todo's source file verbatim; for the library, the PUBLISHED
  `entries/<id>.json`, one payload per entry that every one of its blocks
  points at, never the section files under `library/`, because a withheld
  entry (bean `cw35`) publishes no verbatim text and the published entry is
  what already applied that rule; for `kg`, the KG's own committed payloads,
  from the same `planPayloads` call the subgraph files use. A row with nothing
  heavy has a `NULL` pointer, never an invented one.
- **A `meta` table and `PRAGMA user_version`** carry the schema version. No
  timestamp and no commit go in the file.

### The manifest beside it

`<slice>.sqlite3.json`, `$schema: folio-slice-sqlite/v1`, carries:

- `file`, the database's content-addressed name (§"Content-addressed file,
  fixed-name manifest");
- `sha256` and `bytes` of the file;
- `contentDigest`, a sha256 over the canonical row dump;
- the row count of each table;
- `schemaVersion`, `sqliteVersion` and `pageSize`;
- `fts5`: the index's table, the table whose rows it covers, and its columns;
- `payloadPath`, and `payloads`: whether they are written at deploy or
  already published, how many, how many bytes;
- any `duplicateIds` the source holds, and any other source `findings` in
  words (a todo with no source file, an entry file the index does not list),
  so a gap is reported rather than silently dropped;
- `overBudget`;
- `search`: the query, the alias, the column a typed query degrades to, and
  what a payload is, which the one search page reads (§"The search page").

`assets/slices/index.json` (`folio-slice-index/v1`) lists every slice built
into a directory.

There are two digests because there are two questions. `sha256` asks whether
these are the bytes that were promised; it is what the client verifies a
download against and keys its cache by. `contentDigest` asks whether this is
the same data, and it stays equal across a SQLite upgrade that changes the
file's bytes. The header records the writing library's version at offset 96.

### Content-addressed file, fixed-name manifest

**Bean `wixl`, 2026-10-03.** The database was published at `<slice>.sqlite3`,
one path across builds. Behind a CDN with any TTL a client could fetch a fresh
manifest and a stale database, fail the sha256 check, and fall back: safe for
correctness, unsafe for availability. So the database is now
**`assets/slices/<slice>.<sha256>.sqlite3`**, the full lower-case hex of its
bytes, and the manifest's `file` names it. A fresh manifest names a file no
cache has seen. A stale manifest names an older file whose bytes still hash to
what that manifest promises, so the worst case is an older but
self-consistent database, or a 404 the page reports.

**Why not `payload/sha256/<hex>`.** §"Payloads" is the muscle: a node's body,
the source file verbatim, linked from a node's `payload` and kept only while
something links to it. A slice file is the skeleton in a second encoding. It
is derived and SQLite-version dependent, and no node links to it, so under the
payload tree's own orphan rule it would be an orphan. It would also need a
`<hex>.json` sidecar for a media type that its extension already gives. What
the scheme does take from §"Payloads" is the property that matters,
**immutable, not kept forever**. It also takes the full hex rather than a
prefix, so the name's hash segment is `sha256` by construction and can be
checked against it. Beside its manifest, `file` stays a sibling name that the
client resolves against the manifest's URL.

**The manifest stays at the fixed `<slice>.sqlite3.json`** because it is the
one file that says which build is current, and the page finds it by slice
name. It needs a **short TTL**. The client's `no-store` bypasses only the
browser cache; a CDN keeps the manifest for the host's TTL, and GitHub Pages
sends `max-age=600`, which a repository cannot change. With content addressing
that TTL bounds availability, not correctness.

**Rotation.** A build writes only the current file and removes any other
`<slice>.<hex>.sqlite3` of the same slice from `--out`, along with the legacy
`<slice>.sqlite3` (`rotateSliceFiles`). Nothing else in the directory is
touched. On `gh-pages` nothing piles up. `docs-site.yml` publishes as a full
replace and restores each `STAGING/` preview as it was. `feature-staging.yml`
empties `STAGING/<slug>/` before copying the build in, and
`staging-rotate.ts` caps the number of previews. **What a CDN can still
hold:**

- for one TTL, a stale manifest together with the older file it names;
- an older file that nothing now names, until it expires;
- a stale manifest whose file the origin no longer serves. The client reports
  this case as a 404 with "reload", never as an empty result.

The branch's git history keeps old blobs, as it always did when one path
changed bytes.

### Deterministic, proved

Rows go in sorted by key, the page size is fixed, and the published file is
`VACUUM INTO` a fresh path, so no free page or insertion history leaks in. The
gate builds twice and requires one sha256. Measured 2026-10-03: two separate
processes gave one sha256 for each of the four slices, and the gate re-proves
it on every run.

### Built at deploy, not committed — when the source moves on most merges

A slice of a corpus that every session writes, which `beans/` is, is **not
committed**. A committed binary would be stale against every merge ref, so a
content gate would be red on every open PR. It would also grow the clone on
every edit. This is the same reasoning that checks `assets/beans/index.json`
only for existence. The deploy builds each slice from the tree it publishes,
one line per slice in `docs-site.yml` and `feature-staging.yml`, straight into
`_site/assets/slices/`, and writes the deploy payloads into
`_site/payload/sha256/`.

**The other three are built at deploy too**, although their sources are
committed generated files that a session does not write by hand. The todo
index, the library index and entries, and the KG export are regenerated on
most merges, so the same staleness applies one step removed. And a committed
binary's sha256 is stable for one SQLite version only, so a content gate over
it would go red on a Bun upgrade that changed no data. A slice whose source
truly does not move may still be committed and gated like any generated file;
none of the four pilots is that slice.

Deploy payloads never go into the committed `docs/payload/`. Its orphan audit
admits KG nodes only, and beans, todos and library entries are not KG nodes
(§"Adding a node type").

The gate (`bun run slice:sqlite:check`, or `--check --slice <name>` for one)
therefore checks, for every slice:

- the builder runs, and a source it cannot read is could-not-determine, red;
- two builds give one sha256;
- the row digest read back **from the file** equals the one computed
  independently from the source, so a dropped or truncated row fails;
- an FTS5 phrase query finds a known row, and a slice with no row to probe is
  red rather than an empty green;
- the payloads pass `auditPayloadTree`; for `kg`, every pointer names a
  payload the committed tree holds;
- the manifest's `file` is the content-addressed name of the file the build
  wrote.

### The client — download, OPFS, mount, with a fallback

`docs/assets/js/slice-sqlite.js` gives `openSlice(manifestUrl)` →
`{ mode, info, query(sql, params) }`:

1. Fetch the manifest with `no-store`.
2. Look in OPFS for `/<slice>-<sha256>.sqlite3`. A hit opens with **no
   download**. A new build has a new name, which is the whole invalidation
   story.
3. On a miss, download the file **by the manifest's `file`** as an
   ArrayBuffer. **Refuse** it if its sha256 is not the manifest's. That is a
   `SliceIntegrityError`, which no fallback retries: the same URL would give
   the same answer. The page shows it ("the manifest and the database
   disagree … Refused") and marks `data-slice-error="integrity"`. Import it
   into the pool and unlink older builds of that slice.
4. Open it. `info.contentAddressed` is false only for a pre-`wixl` manifest
   that names a fixed path.

**The VFS is `opfs-sahpool`, in a Worker** (`slice-sqlite-worker.js`), not the
`opfs` VFS. That one needs SharedArrayBuffer, which needs COOP/COEP headers,
and GitHub Pages cannot send them. When there is no Worker or no OPFS, the
verified bytes are opened **in memory** with `sqlite3_deserialize`. That is no
parse either, but nothing is persisted. The mode actually used is reported,
never assumed.

The WASM build is **vendored** from the pinned `@sqlite.org/sqlite-wasm`
devDependency, at 1.51 MB (`bun run slice:sqlite:vendor`, gated by
`:vendor:check`). The reason: jsDelivr is unreachable from some builders, and
a reader's search should depend on no host but the site's own.

Measured in Chromium against a plain static server with no COOP/COEP: first
open, including download and verification, 110 to 190 ms per slice on
loopback (table above); reopen from OPFS about 85 ms, with no download.

### The search page — one page, the slice is a parameter

`docs/slices/search.html?slice=<name>`; with no `slice`, it lists what
`assets/slices/index.json` says was built. **One page rather than one per
slice**, because every per-slice fact the page needs is already in the
manifest's `search` block, which the builder writes from the same definition
that built the tables. A page per slice would be a second copy of those facts
for each slice, free to drift from the schema it queries; this page has no
slice-specific code that could. A payload is shown by what the manifest says
it is: `markdown` (front matter stripped), or `library-entry` (the block of
the published entry whose id the row names). The parameter is checked against
a name pattern before it becomes part of a path.

`beans/search.html`, the pilot's own page, is now a forwarding page to
`?slice=beans`, so a link to it still lands.

### Adding a slice

Follow the `slice-sqlite-publish` process. In short:

- Add one `SliceDef` to `SLICES` in `scripts/gen-slice-sqlite.ts`. Never copy
  the builder.
- Choose its heavy fields by the table in §"What is heavy". A heavy field is a
  `payload_sha256` column, never a stored column. Choose what the payload IS by
  what the site already publishes, and never publish through a payload what a
  withheld or private source keeps back.
- **Measure before wiring.** Build it to a scratch directory and read `bytes`.
  Over the ~5 MB budget, try the no-body variant first, then stop and report the
  measurement rather than ship it.
- Decide **committed or built at deploy** by the question above.
- Wire it: one deploy line per workflow, a unit test over a fixture and over
  the real source, and a search in `slice-sqlite.e2e.ts`. The manifest, the
  gate and the page come from the definition. A slice whose rows do not match
  its source must fail. It must never pass as whole (§"A partial graph must
  never pass for a whole one").

## Adding a node type

1. **Decide it is in this graph.** The `kg` graph holds skills, processes,
   roles, capabilities and the directory declaration. **Beans are not in it** —
   `beans/` is its own graph typology with its own nodes (`defs`, `workflows`), and
   folding the work plan into the KG re-merges exactly what was separated.
2. **Mint its `@id` with `makeIri`, and give it an `@type`.** Both are asserted
   by test. Never hand-build an IRI: `makeIri` is what keeps every node a
   fragment of the published document rather than an invented path.
3. **Report what you could not read**, in `problems[]`. Never `continue`
   silently past a parse failure.
4. **Say which edges it carries, and declare each one in the context** with
   `{"@type": "@id"}`. A node type that relates to nothing is a list and
   belongs in a list; an edge that is not declared is a string and might as
   well be one.
5. **Emit the nodes your edges point at.** Minting `performedBy` without
   emitting a Role node left all 328 of them dangling; minting
   `incoming`/`outgoing` without SequenceFlow nodes left sixty more. The
   export reports `danglingLinks` for exactly this, and the four that remain
   are data defects (bean `nup0`), not exporter bugs.

## Running it

```sh
bun run kg:export                        # → _kg/<stub>.jsonld   (gitignored)
bun run kg:schema                        # → _kg/<stub>.schema.json
bun run kg:export -- --base-url https://… --out path.jsonld
```

`--base-url` (or `KG_BASE_URL`) overrides the declaration's `canonicalUrl`.
`--scope instance|checkout` picks whose directories are read (see "Whose
nodes" above); the deploy says `instance` aloud.

The output is a **build artifact**, deliberately not committed: it is a
snapshot of a tree that changes every commit, so a committed copy is stale by
construction and invites the drift `5o3a` describes. CI regenerates it on every
publish.

> **Do not read `.claude/skills/registry.json` for this.** It is a runtime
> manifest, not the graph: measured 2026-09-18 it reported **23** skills
> against 126 on disk, because it reads only `.claude/skills/local/*.json`.
> Package skills appear in it as bare name lists with no instruction body, and
> processes, the graph-typology registry and the declaration are absent entirely.
> It is also uncommitted and published nowhere. The two coexist; only one is
> the graph.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [KG to public portal](../../processes/kg-to-portal.html) | Serialize to JSON-LD |
| [Build and publish a per-slice SQLite file](../../processes/slice-sqlite-publish.html) | Write the slice definition; Build it locally and measure the file; Report the measurement; ship nothing; Wire it: gate, deploy line, search, tests; Gate every slice: slice:sqlite:check; Build each slice into _site at deploy |

