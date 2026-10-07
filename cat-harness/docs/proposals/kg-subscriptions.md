---
title: "KG subscriptions"
kind: proposal
issue: 1719
summary: >-
  A folio or harness SUBSCRIBES to an external Knowledge Graph (a repository
  that meets bootstrap's schema requirements and declares at least one
  harness), then walks each of its subgraphs, assets and harnesses from
  referenced to materialised, one item at a time and through the same five
  gates as every other materialisation. Also covers the list of known
  substrates, a visualizer, and the MVP inside the folio separation.
---

# KG subscriptions

Owner, 2026-09-30 (issue #1719): *"a way for a folio instance (or cat-harness
in general) to "subscribe" to external KGs … they can choose to materialize
some or all subgraphs … an asset reference … they can choose to materialize
locally … instantiate one or more harnesses … so then harness appears in their
navbar."* Follow-up: *"work towards subscriptions in cat-harness. need
visualizer."*

## The claim this proposal makes

**A subscription is not a new mechanism. It is the relation that joins five
pieces this repository already has and has never connected.** Everything it
needs to *do* already exists; what is missing is a declared relation to hold
the choices, and a view that shows them.

| piece | what it already is | what a subscription uses it for |
|---|---|---|
| `remoteGraphs` (`schemas/cat-harness.ts`) | a graph "known but not held"; declared nowhere, and its one reader filters it out | the **referenced** state of a subscribed subgraph |
| `associatedHarnesses` (#1146, #1158) | a harness "referenced, never loaded"; one use, `ihris` | the harnesses a subscribed KG uses, **before** any is instantiated |
| `MaterializationSchema` (`folio-assistant-core/schemas/materialization.ts`) | three states per node (unknown / referenced / materialized), five three-valued gates, fixity, expiry, upstream version | the **record** for every subgraph or asset copied locally |
| `Process_MaterializeRemote` (`large-datasets/processes/`, #476) | the shared process with five gates: size, restrictions, retention, source loss, purpose | the **only** way bytes arrive |
| `sync-remote-skills.ts` | pin a 40-character SHA, write byte-for-byte, record fixity, and `--check` it | the **pattern**, generalised from skills to subgraphs and assets |
| `harness-tiles.ts` | a harness is *instantiated* when `<name>.config.json` sits at the repository root, which puts it in the navbar's bottom region | what **instantiating** a subscribed harness means |
| `instanceRepositories()` (#1652) | instance ↔ `owner/repo`, with the planned home of every staged instance | where the **known substrates** come from |

### Why not a fifth relation beside needs, references, utilizes and associated

`needs` is fully loaded, with order, overlay and skill resolution.
`associatedHarnesses` is never loaded. A subscription sits **between** them and
moves: an item is referenced when you subscribe, and becomes materialised only
when you choose it. Modelling that as a new relation kind would give two
answers to "does this instance hold X": the relation and the materialisation
record. So the **state lives on the materialisation record**, and the
subscription holds only the choice and the pin.

## What is subscribed to

A **substrate** is an external repository that:

1. carries a root declaration meeting bootstrap's schema requirements
   (`bootstrap-tools/schemas/graph.ts`, `KnowledgeGraphDeclarationSchema`), and
2. declares **at least one** harness instance.

That is the owner's definition. It is checkable without cloning the whole
repository: the declaration file alone answers both points.

## The model

### The subscription (declared by the subscriber)

```jsonc
// in the subscriber's <instance>.json
"subscriptions": [
  {
    "id": "who-iris",
    "repository": "litlfred/who-iris",          // RepoFullName (#1652)
    "ref": "<40-char sha>",                     // pinned; a tag once releases exist
    "subgraphs": ["catalogue"],                 // CHOSEN for materialisation; everything else stays referenced
    "assets": { "policy": "on-demand" },        // none | on-demand | all — each copy still passes the gates
    "harnesses": ["who-iris"]                   // CHOSEN for instantiation
  }
]
```

- **`ref` is required, and it is a SHA.** That is the rule `sync-remote-skills`
  already enforces. An unpinned subscription is how two subscribers see two
  different graphs under one name.
- **Nothing in the entry records state.** Whether `catalogue` actually *is*
  materialised is answered by its `MaterializationSchema` record, which is the
  one place that already answers "do we hold these bytes".
- A subgraph **not** listed is referenced, not absent. The visualizer shows it,
  so a reader can see everything the substrate offers.

### The three verbs

| verb | what it does | what it writes | gate |
|---|---|---|---|
| **subscribe** | fetch the substrate's root declaration at `ref`; validate it as a substrate | the entry, plus a cached copy of the declaration | declaration conforms; ≥1 harness |
| **materialise** a subgraph or asset | run `Process_MaterializeRemote` on it | the bytes under a declared path, plus a `materialization.json` (fixity, provenance, gates, expiry) | the five gates; `check:materialized-fixity` |
| **instantiate** a harness | write `<harness>.config.json` and the harness's declared state directories | the config file, so the navbar shows it | `check:instance-render`; its `needs` are subscribed or local |

**Refresh is not re-subscribe.** Moving `ref` is `refresh-materialized`, which
exists already: what changed upstream, what changed locally, and what to do
when both did.

## Known substrates

The owner: *"cat-harness should list known substrates now and as part of
separation plans."*

One registry, generated rather than hand-kept wherever possible, with one row
per substrate:

| substrate | repository | status | source of the row |
|---|---|---|---|
| iHRIS | `litlfred/ihris` | **exists** | `associatedHarnesses` in `cat-harness.json` |
| WHO IRIS | `litlfred/who-iris` | **exists, empty**; the staged instance is `who-iris/` | `who-iris.json` → `repository` |
| WHO style guide | none; **merging into who-iris as a subgraph** | owner, 2026-09-30: *"who voices style guide is derivative KG content from who-iris, merge content into subgraph. including docs."* | not a separate substrate |
| WHO World Health Data Hub | none yet | proposed (owner, 2026-09-30) | hand-entered, `status: proposed` |
| every other staged instance | its planned `repository` | planned | `instanceRepositories()` |

**Derived where a fact already exists, hand-entered only where none does.**
Every staged instance already declares its planned `repository` (#1652), so
listing those by hand would create a second copy of a fact free to drift.
Only a substrate with no instance here (the Data Hub, or a third party) is
entered by hand, and it carries a `status`: `proposed`, `planned`, `exists` or
`published`.

The same registry is where the **`<stub>-tools` pairing** is recorded
(`kg-separation`: content repository plus tools repository). Per the owner on
2026-09-30, for who-iris: generic DSpace tools belong to the platform, and
IRIS-specific tools may stay in `who-iris/` for now, but must show as a
failing QA finding.

## The visualizer

*"need visualizer i guess."* One generated page, on the pattern of the
harness panel (`scripts/harness-panel.ts`), which already renders associated
harnesses as "Associated ↗ remote" with no network needed:

- **one card per subscription.** It shows the substrate, the pinned `ref` and
  how far that is behind upstream (from `refresh-materialized`), and then one
  row per subgraph, asset class and harness. Each row carries its state: 🔗
  referenced / ⬇ materialised / ? unknown / ⚠ stale / ✗ gate refused.
- **a "known substrates" table** listing everything the registry holds, with
  what subscribing to each would offer (its declared subgraphs and harnesses,
  read from the cached declaration).
- **could-not-determine is drawn, never hidden.** A substrate whose
  declaration was not fetched shows `?`, not an empty card (`dh4f`).

It is **generated**, gated by a `:check`, and has **no runtime network
dependency**. What the page shows is what was recorded at the last subscribe
or refresh.

## MVP — inside the folio separation

The separation is making exactly these substrates: `bootstrap` is out, and
`who-iris`, `cat-harness` and the others are staged. The MVP makes the parent
able to **consume** one of them the same way any subscriber would, instead of
by sibling directory. That is `kg-separation` stage 11 ("parent consumes,
additively") done by a general mechanism rather than one-off wiring.

| # | slice | done when |
|---|---|---|
| 1 | **Schema**: `subscriptions` on the declaration (strict items, `ref` a SHA, `repository` a `RepoFullName`); may not overlap `needs` or `associatedHarnesses` | Zod plus QA check; a malformed entry fails |
| 2 | **Known substrates** registry: derived rows plus hand rows with `status` | generated file plus `:check`; iHRIS and who-iris present |
| 3 | **Visualizer** page (read-only, generated) | renders the registry and every subscription; `?` for unknown |
| 4 | **subscribe** tool: fetch and validate a substrate's declaration at a pin (a sparse, shallow fetch of the root declaration only) | `bun run cat kg:subscribe <repo>@<sha>` records the entry and cached declaration; a non-substrate is refused with its reason |
| 5 | **materialise a subgraph**: `sync-remote-skills` generalised, through `Process_MaterializeRemote` | bytes plus `materialization.json`; `check:materialized-fixity` covers them |
| 6 | **materialise an asset on demand** | one `library/` asset fetched with its gates answered |
| 7 | **instantiate a harness** from a subscription | `<harness>.config.json` written; the navbar shows it; `check:instance-render` green |
| 8 | **process, skill, scenarios**: `subscribe-kg.bpmn` (calls `Process_MaterializeRemote`), a `kg-subscription` skill, stories and roles | registered (`skill:register`), and `kg:audit` shows its lanes bound |

**First real subscription: `litlfred/ihris`**, because it exists and is
already associated. **who-iris** follows once its repository is seeded, which
stage 10 holds until the owner says so (2026-09-30: "Hold").

Slices 1–3 need **no network and no new repository**, so they can land now.
Slices 4–7 need a reachable substrate. Slice 8 wraps them as a process.

## Decisions for the owner

These are asked, not settled; each has a default the work proceeds on.

1. **Where subscriptions are declared**: in `<instance>.json` (the default,
   beside `needs` and `associatedHarnesses`) or in `<instance>.config.json`
   (per-deployment, like `dependencies`). The argument for the declaration is
   that a subscription changes what the graph *contains*. The argument for the
   config is that two deployments of one folio may subscribe differently.
2. **What becomes of `associatedHarnesses`**: kept as the "referenced only"
   case (the default), or folded into `subscriptions` with no subgraphs chosen.
3. **Where the process lives**: `large-datasets` owns
   `Process_MaterializeRemote`. A `subscribe-kg` process that calls it belongs
   either there (the default) or in cat-harness, which would then need
   large-datasets. The direction rules make that a real question, not a
   preference (bean `cjvs`).

## What would change this proposal

- **A substrate that cannot be validated from its declaration alone.** For
  example, if bootstrap conformance needs more than the root file. Then
  subscribe must fetch more, and the no-network visualizer shows less.
- **`MaterializationSchema` proving the wrong record for a whole subgraph**,
  because it was built for single catalogue nodes and files. Then a subgraph
  record needs its own schema, extending the existing one rather than
  replacing it.
- **A second subscriber wanting two pins of one substrate at once.** Then `id`
  is not the substrate's name, and the entry needs a separate key.
