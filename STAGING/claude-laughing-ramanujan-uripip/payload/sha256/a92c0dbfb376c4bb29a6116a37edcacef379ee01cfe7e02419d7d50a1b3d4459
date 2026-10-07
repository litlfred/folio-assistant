---
name: kg-subscription
description: >
  Subscribing a folio or harness to an external knowledge graph — a substrate —
  and walking its parts from referenced to materialised, one at a time and only
  through the shared materialisation gates. When to subscribe, what makes a
  repository a substrate, choosing subgraphs, assets and harnesses, the five
  gates, instantiating a harness so it reaches the navbar, moving the pin, and
  what never to do.
---

# Subscribing to a knowledge graph

Owner, 2026-09-30 (issue #1719): *"a way for a folio instance (or cat-harness
in general) to "subscribe" to external KGs … they can choose to materialize
some or all subgraphs … an asset reference … they can choose to materialize
locally … instantiate one or more harnesses … so then harness appears in their
navbar."*

**A subscription is not a new mechanism.** It is the relation that joins pieces
this repository already has: the materialisation record, the shared
`Process_MaterializeRemote`, the refresh, and the harness tile. This skill is
the walk between them; each piece keeps its own rules, and where this file and
one of them disagree, that one wins.

| | where |
|---|---|
| the process | [`subscribe-kg.bpmn`](../../../processes/library/subscribe-kg.bpmn) |
| the entry | `SubscriptionSchema` in `cat-harness/schemas/cat-harness.ts` |
| the held-bytes record | the `folio-materialization/v1` record (`MaterializationSchema`, owned by the content layer) |
| the gates | [`materialize-remote`](materialize-remote.md) and its process |
| the design | `cat-harness/docs/proposals/kg-subscriptions.md` (epic bean `fnx4`) |

## When to subscribe — and when not to

Subscribe when your graph **consumes** another repository's graph and you want
to hold some of it, or just to pin exactly which version you are reading.

| you want | relation |
|---|---|
| to load an instance fully, with its skills overlaid | `needs` |
| to point at a harness and never load it | `associatedHarnesses` |
| to consume a remote graph, holding **the parts you choose** | `subscriptions` |

A subscription sits between the other two and **moves**: every part starts
referenced and becomes materialised only when chosen and let through the gates.
The schema refuses an id that is also in `needs` or `associatedHarnesses`,
because two relations to one instance is two answers to "do we hold it".

## The substrate rule

You can subscribe only to a **substrate**: a repository whose root declaration

1. parses as bootstrap's `KnowledgeGraphDeclarationSchema`
   (`bootstrap-tools/schemas/graph.ts`), and
2. declares **at least one** harness instance.

Both are answered by the declaration file alone, so validate with a sparse,
shallow fetch of that one file — never a full clone. **"Could not fetch" is a
third answer, never "conforms".** A repository that fails either point is not
subscribed; record the reason and the pin you asked at, and write no entry.

Known substrates are derived from each staged instance's `repository` and
each associated harness, with hand rows (`knownSubstrates`, schema
`KnownSubstrateSchema`) only where no declaration names one. Start from that
registry before asking the person for a repository name; where it is not built
yet in your checkout (epic `fnx4` slice 2), the two derived sources are the
list.

## Pin, always

`ref` is a **full 40-character commit SHA**. Never a branch, never an
abbreviated SHA, never "latest". An unpinned subscription is how two
subscribers see two different graphs under one name, and the schema refuses
anything else — the same rule `sync-remote-skills.ts` already enforces for
remote skills. A tag replaces the SHA only once the substrate publishes
releases.

## The entry holds the choice, never the state

```jsonc
"subscriptions": [{
  "id": "who-iris",
  "repository": "litlfred/who-iris",
  "ref": "<40-char sha>",
  "subgraphs": ["catalogue"],          // CHOSEN; everything else stays referenced
  "assets": { "policy": "on-demand" }, // none | on-demand | all
  "harnesses": ["who-iris"]            // CHOSEN for instantiation
}]
```

Whether `catalogue` **is** held is answered by its materialisation record, not
by this list. Writing "materialised: true" on the entry would be a second
answer free to disagree with the record — so do not add one, and do not read
`subgraphs` as "what arrived". A subgraph not listed is **referenced, not
absent**: the visualizer still shows it.

## Choosing parts

Show the person **everything** the cached declaration offers — every subgraph,
asset class and harness, each with its state — before asking what to hold. A
reader who sees only what was chosen cannot tell "not offered" from "not
taken". Then follow
[`interaction-modality`](../../conduct/conduct-core/interaction-modality.md):
context, options, recommendation, question.

- **Subgraphs** — by the substrate's `directories[].id`. Choose the smallest set
  that serves the folio; each is a separate trip through the gates.
- **Assets** — `none`, `on-demand` (each asset through the gates when first
  asked for), or `all` (every referenced asset walked now). `on-demand` is the
  sensible default for a large binary library; `all` on a catalogue the size of
  IRIS is a size-gate refusal waiting to happen.
- **Harnesses** — only those whose `needs` are held here, locally or by another
  subscription. The process checks this **before** any byte moves and sends the
  choice back if not: subscribe the missing dependency first, or leave that
  harness referenced.

Choosing nothing is legitimate. A subscription with no parts chosen is a pinned
reference.

## Materialising: the five gates, via the shared process only

Every chosen subgraph or asset goes through **`Process_MaterializeRemote`**,
called — never re-implemented. Purpose first (working or archival), then the
five gates in order:

1. **size** — what fraction, and what the whole costs; refuse when you cannot tell
2. **restrictions** — "none known" is a state, not a green light
3. **copyright** — per bitstream, and separately for the derived work
4. **retention** — what expires this copy
5. **source loss** — what survives if the origin goes; only an archival copy discharges it

`unknown` on any gate keeps the part **referenced**. That is the process
working, not failing: record the refusing gate's basis and **continue with the
next part** — one part refused is not the subscription refused. The bytes that
do arrive carry a `materialization.json` with fixity, and
`check:materialized-fixity` covers them.

## A subgraph's nodes without its bytes: metadata mode

To know *what is in* a subgraph — every node of `skills/sdlc`, typed, labelled
and linked — you do not need its files. Ask for its published
`index.hydrated.jsonld` instead
([`kg-export`](../../kg/kg-core/kg-export.md) §"Named subgraphs"):

```sh
bun run kg:materialize --nodes <subscription> <subgraph-path>   # e.g. --nodes cat skills/sdlc
```

- It fetches **one file** at the pin,
  `<docs>/subgraph/<HARNESS>/<path>/index.hydrated.jsonld`. Here `<docs>` and
  `<HARNESS>` come from the cached declaration. The file is validated against
  `SubgraphHydratedSchema`, and its root `@id` must be the subgraph you asked
  for.
- It is held under `<snapshot dir>/<subscription>/nodes/<path>/`, beside a
  `nodes.json` record with its sha256. `kg:materialize:check` re-hashes it.
- **The root is refused.** A harness root publishes `index.jsonld` only, so
  read that for the child subgraph IRIs, then ask for a child.
- **Only `size` applies**, as a measured cap (`--max-bytes`). The four person
  gates guard copies of somebody else's *content*. This is published graph
  metadata, with every body left as a pointer, and it can be fetched again
  from the pin at any time. The reasoning is in the header of
  `folio-assistant-core/scripts/kg-materialize.ts`.
- **It is not a substitute for the byte copy.** When you need the files
  themselves, choose the subgraph and run it through the five gates above.

## Instantiating a harness

Write `<harness>.config.json` at the repository root, plus the state
directories the harness declares. That file is what
[`harness-tiles`](../../ui/ui-core/harness-tiles.md) reads as
**instantiated**, and it is what puts the harness in the navbar's bottom
region. `check:instance-render` must be green afterwards; a config that renders
nothing is a navbar entry pointing nowhere. A harness already instantiated at
this pin is skipped, not rewritten.

## Moving the pin is refresh, not re-subscribe

To move `ref`: validate the substrate at the new commit, then run every **held**
part through `Process_RefreshMaterialized` — what changed upstream, what changed
locally, what to do when both did; an archival copy is fixity-checked and never
re-fetched. **Only then** rewrite `ref` and re-cache the declaration. Moving the
ref first leaves the records of parts not yet refreshed describing a commit the
entry no longer names. Afterwards, review again: the new pin may offer subgraphs
the old one did not.

## Do not

- **Materialise without the gates.** No copying a subgraph by hand, no
  `git archive` into the tree, no "it's only a few files". Every byte arrives
  through `Process_MaterializeRemote`, or it is an unrecorded fork of upstream.
  Metadata mode (`--nodes`) is not an exception to this, because it copies
  none of the subgraph's bytes: only the graph description that the
  substrate publishes.
- **Subscribe unpinned.** No branch, no short SHA, no follow-latest.
- **Record state on the entry.** State lives on the materialisation record.
- **Treat a refused part as failure** and retry it with the gate relaxed. The
  refusal is the answer until the fact behind it changes.
- **Instantiate a harness whose `needs` are not held.** Subscribe them first.
- **Subscribe to a non-substrate** because its content looks useful. Without a
  conforming declaration there is nothing to pin subgraphs against — reference
  it instead.
- **Delete** a materialised part to "unsubscribe" it on your own initiative. It
  is a durable artefact; report what would go and wait
  ([`deletion-requires-confirmation`](../../conduct/conduct-core/deletion-requires-confirmation.md)).

## What exists and what does not yet

The entry schema and the known-substrates list exist. The subscribe, subgraph,
asset and instantiate **tools** are epic `fnx4`'s slices 4–7; until each lands,
perform its step by hand following the process, and never skip a step because
its tool is missing — least of all the gates.
