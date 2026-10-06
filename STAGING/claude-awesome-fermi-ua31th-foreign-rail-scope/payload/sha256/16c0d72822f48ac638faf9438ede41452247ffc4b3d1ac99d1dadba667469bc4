---
name: library-ingestion
description: >
  The BASIC ingestion flow every asset takes: an upload is accepted, its
  metadata goes into the knowledge graph, and the asset lands in
  `library/<slug>/` if it is materialized. The two entry points (a drop in
  `uploads/`, or materializing an asset a remote graph lists), what happens to
  the upload afterwards, and why content-type methods refine this flow from
  above rather than living in it. Command: `bun run ingest`.
graph-typologies:
  - library
  - uploads
---

# Library ingestion — the basic flow

`uploads/` and `library/` are two stages of **one** pipeline. `uploads/` is the
incoming queue — raw files as dropped, **not L1 and not greppable as corpus**.
`library/<slug>/` is where an ingested asset lives, and every knowledge-graph
reference to a source resolves *through* it. **Why that bites:** the
corpus-grep checklist searches `library/` only, so a file still in `uploads/`
makes a *clean grep* mean "nobody has done this" when the source is right
there. That is how a held result gets re-derived.

## The flow — four steps, and no content-type decision

Owner, 2026-09-30 (placement ruling 3): *"only basic doc ingestion high level
workflow in cat-harness. very little process context assumed. just that the
uploaded asset has extracted metadata inserted into KG and asset in library/
(if materialized)."* `processes/library/document-ingestion.bpmn`
(`Process_Ingestion`) is that flow, executable:

1. **Accept** — the bytes reach the declared `uploads/` queue by a declared
   route ([`upload-routes`](upload-routes.md); names per
   [`upload-naming`](upload-naming.md); arrival noticed by
   [`uploads-watch`](uploads-watch.md)).
2. **Extract metadata into the KG** — [`asset-extraction`](asset-extraction.md):
   a container's INDEX goes in, its contents do not unless asked for.
3. **Materialized?** — the state vocabulary is `schemas/materialization-state.ts`
   (placement PR5): `referenced`, `materialized` or `unknown`, with no default.
4. **Place in `library/<slug>/`** — this skill. A `referenced` asset is still
   catalogued: its record says where the bytes are and that we hold none.

The flow **calls no subprocess and decides nothing about content type.** Which
reader a PDF needs, what a complete L1 entry holds, how images or datasets are
described — those are **refinements**, and they live in a layer above this
one. The mechanism is inversion: a higher-layer process CALLS
`Process_Ingestion` as its first step and continues with its own work. Nothing
here names a refinement, because there is no BPMN extension point in the
corpus and a harness process naming a higher one would be an upward edge.
`methodology-from-source.bpmn`'s `Call_Ingest` is a harness caller of the same
flow.

## TWO entry points, and this said "one" until 2026-09-20

Owner, that day: *"things can enter library through `uploads/` → `library/`
document ingestion or through retrieval / materialization of asset known
through listed external KG in one of the dependent harnesses"*.

| | **drop** | **materialize** |
|---|---|---|
| the source is | a file somebody put in `uploads/` | an asset listed in a remote graph a dependency declares |
| decided first | how it is read (a refinement's choice) | the five gates, and a purpose |
| entry | `bun run ingest uploads/FILE` | `materialize-remote.bpmn` |

**Neither is a shortcut past the other.** A materialized asset still arrives as
bytes that have to be read, so it re-enters at exactly the point a dropped file
does. Materialization adds what happens *before* there is a file: may we hold
it, what does holding it cost, for what purpose, and what if the source goes
away.

**Entry one** is `bun run ingest uploads/FILE` (`--dry-run` says what it would
do, and why). **Entry two** starts from `remoteGraphs` in an instance's
declaration (`schemas/cat-harness.ts`, `RemoteGraph`): assets listed there are
`referenced` — we know they exist and where, and hold none.
`materialize-remote.bpmn` asks **purpose** (`working` or `archival`), then the
five gates, then fetches; the asset lands in `library/` with its provenance
and fixity, and a refusal leaves the node `referenced` rather than failing.
**A reference is not a fetch**: the KG viewer follows a remote graph to show
its hierarchy without materialising anything — navigable without being held.

### Who owns which half, and why it is not arbitrary

Owner, 2026-09-20: *"some in cat-harness, some in folio-asst-core (and further
down dep tree)"*.

- **This layer owns the basic flow and the reading CODE** — the `pdf-*` rungs,
  `ingest-document.ts`, `notebook-structure.ts`. Reading bytes is platform
  work, and the owner's standing instruction is that **OCR stays here**. The
  method that chooses among them is a refinement above (placement PR6). The
  flow itself cannot move up: `uploads` and `library` are graph typologies this
  layer declares, and a flow above would make the harness's own `library`
  writable only from a layer above it — a wrong-direction dependency, and
  after the split (issue #223) a circular one (bean `zlmp`).
- **The remote half's gates belong to the content layer above.** PR5 moved
  only the state vocabulary down; the five gates, the purposes and the record
  binding them stay with the layer that owns content, because each gate is a
  decision about content. A harness that cannot hold content must not own the
  vocabulary for deciding to acquire it.
- **The `large-datasets` package owns the question before both**
  ([`skills/library/large-datasets/`](../large-datasets/materialize-remote.md),
  an instance of its own until bean `j7ql` dissolved it here): how to
  enumerate a corpus and ask it for a subset (`source-descriptor.ts`). Neither
  entry point can start until something says what is out there.
- **Further down the tree**, a dependency's declared `remoteGraphs` is what
  makes the second path reachable at all, inherited the way directories are.

## After ingestion the upload is RETIRED — never left, never deleted

Owner, 2026-09-29: *"no, uploads is archival copy"*, then *"archival (once
ingested into KG and put into a proper `library/` under a harness repo) then
it should be moved to `fsh-guts`."* Three places, and only `uploads/` is
temporary: **queued** `uploads/FILE`; **derived** `library/<slug>/`, which may
not hold the source bytes (`check:l1-complete` reports an unexpected child);
**archived** `fsh-guts/uploads/FILE` beside a `folio-fsh-guts/v1` sidecar whose
`movedFrom` and `movedOn` are load-bearing. **Never `rm`** an ingested upload:
it is the only working-tree copy of the source. `bun run check:uploads-retired`
finds unretired ones by **sha256 against every declared library**, never by
filename, and refuses rather than passes when no library records a hash. It
reports and never moves anything. **Rename an upload before its first
ingest** — the slug follows the name.

The full rule — why the library cannot be the destination, the sidecar
convention, the four-faced 2026-09-30 sweep, the blocking and advisory
families, the state after correction, and renaming — is in
[`library-ingestion/uploads-retirement.md`](library-ingestion/uploads-retirement.md).

## Related

- [`directory-conventions`](../../kg/kg-core/directory-conventions.md) — the graph typologies and who declares them; `uploads` and `library` are both declared by this layer
- [`content-acquisition`](content-acquisition.md) — accepting an offered resource, or asking for one, before this flow starts
- `processes/library/document-ingestion.bpmn` — the flow above, as `Process_Ingestion`
