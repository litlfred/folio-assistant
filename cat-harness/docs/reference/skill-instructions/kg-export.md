---
layout: default
title: 'KG export'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/kg-export.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/kg-export.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/kg-export.md){: .fa-edit-source }

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

Four questions, in this order. The worked call for each term is in
`buildContext()`, beside the term it justifies.

1. **Does the fact belong in the graph at all?** Five of the thirty-four were
   DENORMALISED copies of links already present — `implementsSkillNames`,
   `satisfiesSkillNames`, `graphKinds`, `packagePaths`, `laneName`. Removed
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
   `.bpmn` path on a Process and `bpmn-lane` on a lane-derived Role, so it is
   `sourcePath` and `sourceKind`. Heterogeneous SHAPE under one relation is a
   different case — `install` is a command string from a Capability and a
   dispatch object from a Tool, and stays one term typed `@json`, because
   declaring a container term alone keeps the outer key and drops every inner
   one.

**No `canonicalUrl` and no `--base-url` → no absolute IRIs**, reported in
`problems[]` rather than papered over. A fabricated absolute base is the same
failure as a fabricated link.

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

`UNPUBLISHED_GRAPH_KINDS` in `schemas/cat-harness.ts` is the one list, read by
every emitter, so two filters cannot disagree about what is excluded.

**Three emitters had to be filtered, and the third was found only because the
first two were not enough:**

| emitter | what leaked |
|---|---|
| graph kinds | the `fsh-guts` GraphKind node |
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

Graph kinds are **nodes**, not just TypeScript. Follow `holdsGraph` from a
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
[`crdm-requirements-workflow`](../crdm/crdm-requirements-workflow.md) §"Consumer burden
is a requirement".

**Vocabulary nodes get no `alternateOf`.** Graph kinds are minted under the
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
  `<folio:skill ref="…"/>`, so the export can say which process step is
  implemented by which skill.
- **activity → role.** A BPMN lane is the role that performs the step.
- **skill → package**, and a skill's **two facets**: its instruction body
  (`<name>.md`) and its I/O contract (`schemas/skills/<name>/`).

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

## Adding a node type

1. **Decide it is in this graph.** The `kg` graph holds skills, processes,
   roles, capabilities and the directory declaration. **Beans are not in it** —
   `beans/` is its own graph kind with its own nodes (`defs`, `workflows`), and
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

The output is a **build artifact**, deliberately not committed: it is a
snapshot of a tree that changes every commit, so a committed copy is stale by
construction and invites the drift `5o3a` describes. CI regenerates it on every
publish.

> **Do not read `.claude/skills/registry.json` for this.** It is a runtime
> manifest, not the graph: measured 2026-09-18 it reported **23** skills
> against 126 on disk, because it reads only `.claude/skills/local/*.json`.
> Package skills appear in it as bare name lists with no instruction body, and
> processes, the graph-kind registry and the declaration are absent entirely.
> It is also uncommitted and published nowhere. The two coexist; only one is
> the graph.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [KG to public portal](../../processes/kg-to-portal.html) | Serialize to JSON-LD |

