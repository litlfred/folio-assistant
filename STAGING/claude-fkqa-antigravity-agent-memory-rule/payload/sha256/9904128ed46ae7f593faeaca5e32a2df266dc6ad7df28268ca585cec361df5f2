---
# folio-assistant-q8ar
title: 'LATE MATERIALIZATION: per-slice SQLite/DuckDB WASM via OPFS on gh-pages; pilots beans, todos, library, whole repo; who-iris CDN'
status: completed
type: feature
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-03T19:00:00Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02 ("bean up #2"): a client (browser running Oxigraph or SQLite via WebAssembly) ingests a large KG but only selectively materializes heavy subgraphs or assets when needed — a Late Materialization (lazy loading) architecture, so the client never downloads gigabytes of static JSON-LD from GitHub Pages. Binary database formats: Oxigraph WASM loads text serializations into memory, so for static hosts the binary win is SQLite WASM or DuckDB-Wasm. "Direct OPFS mount": CI converts JSON-LD subgraphs into a flattened relational schema and runs the SQLite CLI to build `<slice>.sqlite3` (B-tree and JSON indexes), published to gh-pages; the client downloads it as an ArrayBuffer and writes it via the official SQLite WASM OPFS driver, which mounts it with zero parsing. Do it per KG slice; the user picks the slice. "who-iris will get really big … need client side searching. add to who-iris docs on CDN proposal and generalize."

## Done when
- [x] process + skill + tool written for building a per-slice SQLite (and/or DuckDB) artefact from a named subgraph's skeleton, with its schema documented
- [x] pilots, each measured (build time, file size vs JSON-LD, first-query latency in Chromium): `beans`, `todos`, `library/`, the whole repo
- [x] client loader: download → OPFS → mount, with a fallback when OPFS is unavailable
- [x] who-iris CDN proposal updated with this design, generalized to any slice (coordinate with l9v6 / xies / 7dek)
- [x] heavy payloads stay lazy: the SQLite slice holds the skeleton and pointers, payloads fetched on demand

_2026-10-03T11:17:41Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-10-03_ — claude/nifty-faraday-8ql41p: boxes 1, 2, 3 and 5 ticked. Process `cat-harness/processes/kg/slice-sqlite-publish.bpmn` (measure BEFORE wiring, budget gateway, gate, deploy build, browser check); Tool `slice-sqlite` in `cat-harness/tools/index.ts`; contract in `kg-export` §"Per-slice SQLite". `gen-slice-sqlite.ts` is now one table-driven builder (`SLICES`: beans, todos, library, kg); one search page `docs/slices/search.html?slice=<name>`. Measured 2026-10-03 (file / source / build / first open in Chromium): beans 2.83 MB / 4.82 MB bean files / 0.26 s / ~190 ms; todos 0.07 MB / 18 KB / 0.22 s / ~110 ms; library 2.48 MB / 3.59 MB JSON / 0.23 s / ~165 ms; kg (no-body variant) 3.40 MB / 3.03 MB JSON-LD / 4.8 s / ~180 ms. All under the ~5 MB budget, so all four shipped. Box 4 (who-iris CDN proposal) not done — out of this session's scope.

_2026-10-03_ — claude/nifty-faraday-8ql41p: box 4 ticked; all five boxes done.

## Summary of Changes

- **Box 4, where it went.** No separate "who-iris CDN proposal" file exists. `l9v6` is the CDN-layer decision record and names no document; `7dek` names the platform's `render-kg-to-cdn` skill. The who-iris proposal is `who-iris/docs/kg-to-portal.html`: `xies` names it as the worked example, and the earlier "Searching it on the client" section is on it. That page is generated, so the section is in `who-iris/scripts/gen-iris-pages.ts` and the HTML is regenerated (`iris:pages`).
- **The section** ("Publishing a large graph: skeleton, payloads, one SQLite file per slice") replaces the earlier one. It covers the three published forms (subgraph JSON-LD, `/payload/sha256/` payloads, per-slice SQLite), the measured pilots, the ~5 MB budget, CDN caching per file, and how a client picks a slice. It cross-links `l9v6`, `7dek` and `xies`. Measured facts and recommendations are labelled separately. Recommendations, none built: split by subgraph (one slice per DSpace community or collection, plus a routing slice), and content-address the slice file. The estimate for IRIS as one slice is arithmetic on the pilots, not a measurement: about 60 to 214 times the budget.
- **Corrected, on the page.** The earlier section said only the manifest needs a short TTL. That is wrong behind a CDN. `<slice>.sqlite3` is published at a fixed path (`file` in the manifest), so a CDN that caches it longer than the manifest serves old bytes, and the client refuses them on the sha256 check.
- **This bean's opening text vs as built.** Reported here, and the text above is left unchanged: CI builds with `bun:sqlite`, not "the SQLite CLI"; JSON fields are JSON1 columns read through `json_each`, with no JSON index; DuckDB was not built.
