---
# folio-assistant-4pm8
title: 'PAGEFIND: evaluate as the search engine for the large-datasets subgraph'
status: completed
type: task
priority: normal
created_at: 2026-09-20T09:21:09Z
updated_at: 2026-09-25T00:00:00Z
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

### What was built (PR #1336, closed unmerged: see the decision below)

None of the files in this table is on main. The owner closed the PR (2026-09-25, *"Close it"*), so the code and the dev dependency went and the measurements stayed. The table records what produced the numbers.

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

---

## 2026-09-24: Pagefind PROTOTYPED and MEASURED on the same corpus

Owner, 2026-09-24, after the section above: **"Prototype Pagefind in
large-datasets"**. The work is to measure Pagefind on the same corpus,
inside `large-datasets/` only, so that the owner can decide from the numbers.
Issue #1334. As above, this section holds only what was built, what was
measured and the method. The requirements, pros, cons and options are not
written here.

### What was built

| | |
|---|---|
| `pagefind` 1.5.2 | a **dev dependency**, pinned exactly. MIT, as are its platform binaries (`@pagefind/<os>-<arch>`, which npm fetches as optional dependencies). Only `bench-pagefind.ts` uses it. |
| `large-datasets/scripts/bench-pagefind.ts` | `bun run pagefind:bench`: the method below, reproducible. `bun run pagefind:fixture` builds the fixture index for the page. |
| `large-datasets/pagefind/fixture.json` | 50 records: the 10 real referenced who-iris nodes, plus the first 40 synthetic items from the same generator and seed |
| `large-datasets/pagefind/index.html` | a one-form page that searches the fixture. The index is built into `large-datasets/pagefind/build/`, which is git-ignored: **no Pagefind output is committed** |
| `large-datasets/schemas/pagefind.test.ts` | the bench is deterministic given its seed, and its corpus is `bench-id-lookup.ts`'s entry for entry. The committed fixture is what the generator makes. The fixture index builds. An empty build is refused. |
| `cat-harness/test/pagefind.e2e.ts` | in Chromium, every fixture title finds its own node in the top 10, and **the page requests nothing outside `/large-datasets/`** |
| `cat-harness/scripts/tests/pagefind-guard.test.ts` | **no file under the docs site root (`cat-harness/docs/`) loads Pagefind**: no script, stylesheet or index file of its bundle, no `data-pagefind-*`, no UI constructor, no import, and no mention in the Jekyll build configuration. Prose that names it is allowed. |

The guard and the e2e request check were each mutation-tested by hand. Adding
`<script src="/pagefind/pagefind-ui.js">` to a docs page fails the guard, and
a stylesheet link outside `large-datasets/` in the prototype page fails the
e2e test.

### Method

- **Corpus:** exactly Corpus B above. That is the 10 real referenced nodes
  plus 273,559 synthetic items from `syntheticCorpus()` with its default
  seed: same ids, titles and urls, 273,569 records, mean title 99.9
  characters. **Synthetic at scale, so an extrapolation.**
- **Records:** one Pagefind custom record per node, with `content` = title,
  `meta.title` = title and `url` = the source URL. Pagefind indexes `meta`
  values as well as `content`. So the id is kept out of both, except in the
  `--index-ids` run, which puts it in `meta.id`.
- **Browser:** the same as the section above. Chromium 1194 headless via
  Playwright, a local `Bun.serve` with no content-encoding, and CDP's
  network cache disabled. The two profiles are unthrottled and slow 4G
  (150 ms RTT, 1.6 Mbit/s). Pagefind runs on the page's main thread through
  its own `noWorker` option, because CDP's throttle and byte counts apply to
  the page's requests and not to a Web Worker's. The files fetched are the
  same in both modes.
- **A query** is `search()` plus loading the top 10 results' data (title
  and url), because that is what a reader sees. **Bytes** are CDP's
  `encodedDataLength`, attributed to a query by waiting until every request
  it started has finished. The first query also counts the import and
  `init()`, because `init()` starts loading the meta file without awaiting
  it.
- **Queries:** 200 distinct synthetic items, picked with seed 99 (the pick
  `bench-id-lookup.ts` uses). Each is asked by **whole title** and by **three
  consecutive whole words** of its title. Then 20 of the items are asked by
  bare UUID and by full `item/<uuid>` id. That is 440 queries per profile,
  and **recall** is whether the item's own url is in the top 10.
- **Memory:** JS heap after a forced GC, as above, plus the resident set size
  of Chromium's renderer processes from `/proc`. Pagefind's index lives in
  WebAssembly memory, which the JS heap figure does not count.
- **Build:** a 4-core container. The Node API route adds records through the
  `pagefind` service and then calls `writeFiles`. The HTML route
  (`--via-html`) writes one minimal HTML page per node and calls
  `addDirectory`, which is the CLI's route.

### Measurements (Corpus B, synthetic: an extrapolation)

| measure | Pagefind |
|---|---|
| files a search can load | **274,053**: 273,567 fragments, 480 index chunks, 1 meta file, 2 wasm, 3 runtime. There are also 7 files of the optional prebuilt UI (418,109 B), which a search does not load. |
| on disk, as written | **73,082,233 B**. Pagefind gzips its own index, fragment, meta and wasm files. |
| uncompressed | **141,584,799 B**. As served with gzip: 73,020,362 B. |
| bytes per record | 267.1 as written |
| fragment size | p50 220 B; p95 262 B; max 294 B (one per record) |
| index chunk size | p50 16,015 B; p95 58,517 B; **max 444,195 B** |
| meta file | 1,586,324 B, loaded once per page |
| build, Node API custom records | **879.5 s** (784.4 s adding records + 95.1 s writing) |
| build, HTML pages + `addDirectory` | **109.3 s** (10.7 s indexing + 98.5 s writing), plus 14.5 s to write the 273,569 pages. The output is 63,831,247 B, because the local page urls are shorter than the source urls. |
| **first query** (import, init, meta, wasm, index chunks, 10 fragments) | **2,052,267 B in 24 requests**. It takes 338 ms unthrottled and **10,542 ms at slow 4G**. |
| each later query | **p50 3,841 B; p95 139,006 B; max 1,661,541 B**. That is p50 10 requests and max 25. Chunks already loaded are reused. |
| latency, unthrottled: whole title | p50 205.5 ms; p95 1,136 ms; **max 15,197 ms** |
| latency, unthrottled: three words | p50 125.8 ms; **p95 10,165 ms; max 31,555 ms** |
| latency, slow 4G: whole title | p50 720 ms; p95 3,731.5 ms; max 16,005 ms |
| latency, slow 4G: three words | p50 435.7 ms; p95 10,140 ms; max 31,024 ms |
| JS heap | blank page 0.62 MB; after init 0.80 MB; after 440 queries **5.82 MB** |
| renderer RSS | blank page 180.5 MB; after init 192.4 MB; after 440 queries **782.1 MB (+601.6 MB)** |

The latency tails are CPU time, not network time: they are about the same
unthrottled as at slow 4G. They come from queries whose words have large
index chunks.

**Recall (top 10, 200 items).**

| query | Pagefind | lunr 2.3.9 (one-off, see below) |
|---|---|---|
| whole title | **182 / 200** (0 with no hits) | 183 / 200 (3 with no hits) |
| three consecutive title words | **44 / 200** (0 with no hits) | 23 / 200 (3 with no hits) |

For all 200 three-word queries, more than 10 items in the corpus contain
every word of the query. So no engine can promise the item a top-10 place.
The synthetic titles are cut from only three publications, so they overlap
heavily. The lunr figures come from a one-off script outside the repository,
under bun rather than in a browser, with just-the-docs' title-and-url
settings and its query form (the tokens, and the tokens with a trailing
wildcard). lunr is not a dependency here.

**Identifiers in Pagefind.**

- With the id **not** indexed (the run above), a full-id query finds its
  item in the top 10 **0 / 20** times, and a bare-UUID query also finds it
  **0 / 20** times (3 of those 20 return no hits). Pagefind does not index
  urls.
- With `--index-ids` (the id in `meta.id`, 20 items per kind), a full
  `item/<uuid>` query finds its item **20 / 20** times, with p50 16.9 ms
  unthrottled. A **bare UUID finds it 3 / 20 times** (4 of the 20 return
  no hits). The index grows to **86,939,512 B** as written (+13.9 MB), or
  187,187,317 B uncompressed. The largest chunks grow to p95 156,995 B.
- **Records are keyed by URL.** A later record with the same URL silently
  replaces an earlier one, and no error is raised. Two real collections
  (`hq-publications`, `wpro-information-products`) share their community's
  source URL, so in the fixture they cannot be found by their own titles.
  At full scale, this leaves 273,567 fragments for 273,569 records.
  `pagefind.test.ts` and `pagefind.e2e.ts` assert this, so the day it stops
  being true will be noticed.

### Side by side at full IRIS scale (synthetic: an extrapolation)

| | sharded id lookup (#1322) | lunr, title + url (#1322) | Pagefind (this section) |
|---|---|---|---|
| searches titles | no | yes | yes |
| files | 4,098 shards + manifest | 1 | 274,053 |
| on disk | 58,955,130 B raw | 52,930,679 B raw | 141,584,799 B raw; 73,082,233 B as written |
| gzip | 21,342,290 B | 18.0 MB | 73,020,362 B |
| build | 3.5 s (in memory) | 11.5 s, **in the reader's browser** | 879.5 s via the Node API; 109.3 s via HTML pages (offline) |
| first lookup/query downloads | manifest 49,537 B + one shard (p50 14.3 KB) | the whole index, 52.9 MB | 2,052,267 B |
| each later one downloads | one shard, p50 14.3 KB | nothing | p50 3.8 KB; p95 139 KB; max 1.66 MB |
| memory | ~0.4 MB JS heap | 466 MB JS heap | 5.8 MB JS heap; **+601.6 MB renderer RSS** after 440 queries |
| latency, unthrottled | p50 2.4 ms; p95 4.0 ms; max 10.3 ms | 39 ms per query, after the 11.5 s build | title: p50 205.5 ms; p95 1,136 ms; max 15.2 s |
| latency, slow 4G | p50 222 ms; p95 236 ms; max 249 ms | not measured (computed: 52.9 MB at 1.6 Mbit/s is about 252 s to download) | title: p50 720 ms; p95 3.7 s; max 16.0 s; first query 10.5 s |
| title recall, top 10 | not applicable | 183 / 200 | 182 / 200 |
| full-id lookup | 200 / 200 | not measured in #1322 | 0 / 20 if ids are not indexed; 20 / 20 with `--index-ids` |

---

## 2026-09-25: DECIDED: decline Pagefind; accept the title-search gap

The owner decided this from the measurements above and in the previous section.

- **Title search over referenced nodes: *"Accept the gap"*.** Pagefind is declined. There is no title search for referenced nodes until `canDelegateSearch` opens for their source (today who-iris is `blocked` and lean-mathlib is `unknown`).
- **Identifier lookup is carried by the prefix-sharded lookup** (#1322, `large-datasets/id-lookup/`). The measurements showed no gap there.
- **PR #1336: *"Close it"*.** The prototype code and its `pagefind` dev dependency are not merged. Only the measurements are kept, in this bean.

That meets this bean's Done-when: a decision is recorded with its basis, and the bean says what carries the case instead. The pros, cons and options were given in chat, as the owner asked on 2026-09-20, and are not written here.
