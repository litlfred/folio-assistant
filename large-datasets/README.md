# large-datasets

**Taking a subset of a corpus you will never hold** — and publishing artifacts
too big for the site that describes them.

## Why this is its own subgraph

[`materialize-remote`](../folio-assistant-core/schemas/materialization.ts)
answers *"may we take this, and what does holding it cost"* — five gates, three
states. It does **not** answer the question before it:

> How do you enumerate a corpus, and how do you ask it for a *part*?

Every source answers differently and none of it is guessable. Without a declared
descriptor, an agent asked for "the WPRO style guides" has to be told the API by
a human every single time, and that answer is written down nowhere.

It belongs to neither neighbour: `folio-assist-core` is the **content** layer
and this is about sources the instance will never hold; `cat-harness` is about
the harness. It is the third thing.

## Two worked descriptors, and the second is the point

One example is a special case with an interface drawn round it. These two are
deliberately far apart:

| | [WHO IRIS](sources/who-iris.json) | [Lean mathlib](sources/lean-mathlib.json) |
|---|---|---|
| a node is | a repository item | a declaration |
| enumerate by | paged REST over communities | the module graph |
| subset by | collection, handle, MeSH subject | **import closure** |
| identifiers | UUID, Handle, govdoc — **three** | fully-qualified name — **one** |
| subset self-contained? | **yes** | **no** |

**That last row is what a single-example design misses.** An IRIS item stands
alone: fetch it and you have it. A mathlib declaration does not — ask for one
and get one, and you have something that does not compile. The failure surfaces
at *build* time, long after the subset was chosen. So a source with
`subsetIsSelfContained: false` must be closed over its dependencies **before**
the five gates are asked, because the size being gated is the closure's, not the
request's.

Neither descriptor was exercised live. `iris.who.int` is egress-blocked from
this environment (403 at the proxy — the same block bean `r1lz` recorded on
2026-09-19), and no mathlib checkout exists here. So mathlib's `totalNodes` is
**absent rather than estimated**, `enumerationCost()` returns `undefined` for
it, and a size gate handed that must refuse. The third state doing its job on
the second example, not a gap in it.

## Artifact stores: the host is a declaration

> using ghpages as CDN is a tool choice, other tools possible like cloudflare

So the pipeline step is *"publish a large artifact"* and **how** is a property
of the instance. A GitHub Release is one implementation of three
(`github-release`, `object-store`, `site-tree`). An instance that has declared
no store makes the publish step **refuse** — it never falls back, because a
fallback would publish somebody's data to a host they did not choose. Same
third-state rule `publication.host` already follows.

### Why a large artifact needs somewhere else to go

Measured on this repository, 2026-09-20 (`test/health/results/`):

| | bytes | |
|---|---|---|
| 7 staging previews | 304,159,961 | ~43.5 MB each |
| warning threshold | 104,857,600 | the owner's instruction, 2026-09-19 |
| GitHub Pages limit | 1,073,741,824 | documented |

The previews are already **2.9× the warning**. A 53 MB search index — the
measured floor for full IRIS at title-and-url only — cannot sit beside them.

### Staging builds no index, and that is correctness

Not a saving; the saving is incidental. A release-built index served on staging
returns hits for pages that have since changed — a **wrong pass, believed**,
which is the failure named in `readme-sections`, `repo-partition` and
`ci-health` alike. Absent is honest, stale is not, and the page must **say**
search is unavailable there: silence reads as "no results".

## Why lunr cannot be the answer at scale

just-the-docs uses lunr.js, which loads the whole index and builds an **in-memory
inverted index** in the browser. For a materialized full IRIS (~265k items,
bounded from 1,057,223 files at ~3–4 files per item):

- title + url only: ~53 MB on disk → **~150–500 MB in memory**
- with content excerpts: hundreds of MB → **multiple GB**

Packaging does not help: it moves the failure from *cannot publish* to *tab
crashes on first search*, which is worse because it fails at the reader. What
scales is indexing **only what is materialized**, with a separate
**prefix-sharded identifier lookup** for everything else — ~50 KB in memory at a
time regardless of corpus size.

That lookup is built: [`id-lookup/`](id-lookup/) holds the client and the
generated who-iris index, `bun run id-lookup` writes it and `id-lookup:check`
gates it. It is measured at full IRIS scale in bean `4pm8` (a reader downloads
one shard of about 14 KB per lookup).
