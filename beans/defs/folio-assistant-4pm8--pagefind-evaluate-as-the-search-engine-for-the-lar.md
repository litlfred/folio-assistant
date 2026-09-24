---
# folio-assistant-4pm8
title: 'PAGEFIND: evaluate as the search engine for the large-datasets subgraph'
status: todo
type: task
priority: normal
created_at: 2026-09-20T09:21:09Z
updated_at: 2026-09-24T19:30:00Z
parent: folio-assistant-5a3l
---

Owner, 2026-09-20: '4 bean up. for now give requrements/constraings/issues/pros/cons/otpons here only for analysis/discussion./ not durable.'

So this bean is the TRACKING ITEM and deliberately not the analysis. The requirements, constraints, pros, cons and options were given in chat for discussion and are explicitly NOT to be written into the repository yet. Recording that instruction here matters: the next agent finding a thin bean on a topic this size should know the thinness is a decision, not an omission.

WHY IT IS ON THE TABLE AT ALL. just-the-docs uses lunr.js, which loads the whole index and builds an in-memory inverted index in the browser. For a materialized full IRIS (~265k items, bounded from 1,057,223 files at ~3-4 files per item) that is ~53 MB on disk at title-and-url only, and roughly 150-500 MB in browser memory; with the theme's default content excerpts it is multiple GB. Packaging does not help — it moves the failure from 'cannot publish' to 'tab crashes on first search', which is worse because it fails at the reader rather than at the build.

DECIDED ALREADY, and this bean does not revisit it: search indexes ONLY materialized content (lunr), plus a prefix-sharded identifier lookup for referenced nodes, with delegation to the source as the fallback wherever `canDelegateSearch` says it is possible. Pagefind is a candidate to REPLACE the first two, not to sit beside them.

THE ONE CONSTRAINT THAT IS NOT NEGOTIABLE: the owner scoped the docs pipeline to 'no extensions. no fancy. no js (if possible)'. Pagefind is an extension and it is JavaScript. It is admissible ONLY inside the large-datasets subgraph, which is where the complicated stuff was explicitly scoped to live, and it must never become a dependency of the plain `docs` rendering.

## Done when
A decision is recorded with its basis — adopt, or decline and say what carries the case instead. Not before the prefix-sharded lookup has been built and MEASURED, since the whole question is whether that measurement leaves a gap.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `5a3l`.** PAGEFIND is a search-ENGINE choice. Which engine serves a large-datasets subgraph is a deployment/topology question, not a question about the IRIS catalogue.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.

---

## 2026-09-24: the prefix-sharded lookup is BUILT and MEASURED

Owner, 2026-09-24, on this bean: **"Build the sharded lookup first."** The
Done-when above says the decision waits on this measurement. The measurement
is below. The decision is still the owner's, so this bean stays `todo`.

As the note at the top of this bean records, the requirements, pros, cons
and options are NOT written here. This section holds only what was built and
what was measured, with the method.

### What was built

All of it is inside `large-datasets/`. The plain docs pipeline loads none of it.

| | |
|---|---|
| `large-datasets/schemas/id-lookup.ts` | the shape (manifest + shards), the 64 KiB shard budget and its basis, the prefix-length chooser and a deterministic build |
| `large-datasets/scripts/gen-id-lookup.ts` | `bun run id-lookup` / `id-lookup:check`. It indexes every who-iris catalogue node whose own `materialization.state` is `referenced`. `--check` compares byte for byte in both directions (changed, missing, stale shard). It is gated in `code-quality-gates.yml` |
| `large-datasets/id-lookup/lookup.js` | the client: a plain ES module with no dependencies, about 110 lines. It fetches `manifest.json` once, then one shard per lookup, and keeps the last 8 shards |
| `large-datasets/id-lookup/index.html` | a one-form page over it |
| `large-datasets/id-lookup/who-iris/` | the generated index for the real corpus |
| `large-datasets/scripts/bench-id-lookup.ts` | the measurement method below, reproducible |
| `large-datasets/schemas/id-lookup.test.ts`, `cat-harness/test/id-lookup.e2e.ts` | the tests: every referenced id resolves, including in Chromium; no shard is over budget; `--check` catches staleness; vacuity guards. Mutation-tested by hand: 7 code mutations and 2 CLI mutations, each red |

**The shape.** An id `kind/local` lives in namespace `kind`, in the shard
`kind/p<first N chars of local>.json`. N is chosen **per namespace from the
ids present**: it is the smallest N at which no shard exceeds 64 KiB. It is
not fixed in advance.

**What it answers.** An identifier, or an identifier prefix at least N
characters long, gets the node's title and the URL where the source holds it.
It does not search titles or text. That is the scope decided above:
full-text search covers materialised content only.

### Measurements

**Corpus A, real: this checkout.** who-iris has 13 catalogue nodes. 10 are
`referenced` (8 communities, 2 collections) and 3 are materialised. That is
all the IRIS data held here, because `iris.who.int` is egress-blocked from
this environment.

| | |
|---|---|
| index on disk | 1,952 bytes in 3 files (manifest 349, 2 shards 280 and 1,323) |
| prefix length | 0 for both namespaces: at 10 nodes the chooser correctly picks one shard each |
| build | 34 ms |
| lookup in Chromium | all 10 resolve, one shard request each (`id-lookup.e2e.ts`) |

**Corpus B, SYNTHETIC at full IRIS scale. This is an extrapolation and is
labelled as one.** The 10 real nodes plus 273,559 synthetic items. 273,559 is
the item count that `iris.who.int/home` states (`catalogue.json`).

- **Ids:** `item/<uuid v4>` from a seeded generator. DSpace 7 mints random v4
  UUIDs, so uniform hex is the real shape of the ids.
- **URLs:** `https://iris.who.int/items/<uuid>`.
- **Titles:** runs of consecutive words cut from the text of the three WHO
  publications who-iris holds, 20 to 180 characters long, with a mean of
  99.9. That is deliberately longer than the 37-character mean of the three
  real item titles. Size scales linearly with title length at the measured
  bytes per entry.
- **Command:** `bun run large-datasets/scripts/bench-id-lookup.ts --browser`,
  4-core container, Chromium 1194 headless, served by a local `Bun.serve`.
  The server does no gzip, so throttled transfers are raw bytes.

| measure | value |
|---|---|
| total index on disk | **58,955,130 B** (56.2 MiB) raw; 21,342,290 B gzip -9 |
| bytes per entry | 215.5 |
| shard count | **4,098** (4,096 `item`, 1 `community`, 1 `collection`) |
| prefix length chosen | `item` 3 hex chars; `community`, `collection` 0 |
| shard size, raw | **p50 14,329 B; p95 17,357 B; max 20,971 B** (budget 65,536) |
| shard size, gzip | p50 5,195 B; p95 6,217 B; max 7,380 B |
| manifest | 49,537 B raw; 9,473 B gzip (fetched once per page) |
| **bytes fetched per lookup** | **one shard: p50 14.3 KB raw / 5.2 KB gzip**; plus the manifest on the first lookup only |
| build time (in memory, 273,569 entries) | **3.5 s** |
| lookup latency, Chromium, unthrottled loopback, 200 cold lookups on distinct shards | open (manifest) 9.6 ms; lookup **p50 2.4 ms, p95 4.0 ms, max 10.3 ms**; 200/200 found |
| same, slow-4G profile (150 ms RTT, 1.6 Mbit/s, CDP) | open 575 ms; lookup **p50 222 ms, p95 236 ms, max 249 ms** |
| JS heap (CDP `JSHeapUsedSize` after forced GC) | blank page 0.62 MB; after opening 0.82 MB; after 200 lookups 1.03 MB. **About 0.4 MB is attributable to the lookup** |

**lunr on the SAME synthetic corpus, for comparison.** Measured with lunr
2.3.9 in the same Chromium. It was a one-off script run outside the
repository, and lunr is not a dependency here. It used just-the-docs' own
builder settings (`ref id`; `title` boost 200, `content` boost 2, `relUrl`;
`metadataWhitelist: position`):

| | on disk | build in browser | JS heap after build | one query |
|---|---|---|---|---|
| title + url only (the bean's own "title-and-url" basis) | **52,930,679 B**; 18.0 MB gzip | **11.5 s** | **466 MB** | 39 ms |
| just-the-docs' `search-data.json` shape (`doc`, `title`, `content: ""`, `url`, `relUrl`), no excerpts | 106,793,174 B; 22.3 MB gzip | 31.7 s | **1,787 MB** | 41 ms |

These confirm the estimate at the top of this bean. The estimate was 53 MB
on disk and 150 to 500 MB in memory; the measurement is 52.9 MB and 466 MB,
at the top of that range. With the theme's own record shape, the measured
heap passes 1.7 GB before any content excerpt is added.

**Side by side at full IRIS scale, measured.** For a lookup, the sharded
index downloads about 14 KB and holds about 0.4 MB of heap. lunr downloads
52.9 MB (or 106.8 MB) and holds 466 MB (or 1.79 GB). The sharded index's
total bytes on disk are about the same as lunr's minimal one (59.0 MB against
52.9 MB). A reader downloads 1/4,098 of it per lookup.

**One more measured fact, because it bears on the fallback.**
`canDelegateSearch` on the committed descriptors returns `ok: false` for both
sources. For `who-iris` it is `availability: blocked`, and for `lean-mathlib`
it is `availability: unknown`. So delegation to the source is not available
for either one today. For a referenced node, the lookup is the only route a
reader has, and it answers identifiers, not titles.
