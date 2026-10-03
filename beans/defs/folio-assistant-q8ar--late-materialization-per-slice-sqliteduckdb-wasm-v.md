---
# folio-assistant-q8ar
title: 'LATE MATERIALIZATION: per-slice SQLite/DuckDB WASM via OPFS on gh-pages; pilots beans, todos, library, whole repo; who-iris CDN'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-03T11:17:43Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02 ("bean up #2"): a client (browser running Oxigraph or SQLite via WebAssembly) ingests a large KG but only selectively materializes heavy subgraphs or assets when needed — a Late Materialization (lazy loading) architecture, so the client never downloads gigabytes of static JSON-LD from GitHub Pages. Binary database formats: Oxigraph WASM loads text serializations into memory, so for static hosts the binary win is SQLite WASM or DuckDB-Wasm. "Direct OPFS mount": CI converts JSON-LD subgraphs into a flattened relational schema and runs the SQLite CLI to build `<slice>.sqlite3` (B-tree and JSON indexes), published to gh-pages; the client downloads it as an ArrayBuffer and writes it via the official SQLite WASM OPFS driver, which mounts it with zero parsing. Do it per KG slice; the user picks the slice. "who-iris will get really big … need client side searching. add to who-iris docs on CDN proposal and generalize."

## Done when
- [ ] process + skill + tool written for building a per-slice SQLite (and/or DuckDB) artefact from a named subgraph's skeleton, with its schema documented
- [ ] pilots, each measured (build time, file size vs JSON-LD, first-query latency in Chromium): `beans`, `todos`, `library/`, the whole repo
- [x] client loader: download → OPFS → mount, with a fallback when OPFS is unavailable
- [x] who-iris CDN proposal updated with this design, generalized to any slice (coordinate with l9v6 / xies / 7dek)
- [x] heavy payloads stay lazy: the SQLite slice holds the skeleton and pointers, payloads fetched on demand



## Owner ruling 2026-10-03 — engine and pilot slice
Selected SQLite (official SQLite WASM build, OPFS VFS), pilot slice = beans. Rejected: SQLite/library, DuckDB-Wasm/beans, defer.

_2026-10-03T11:17:41Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Progress 2026-10-03 — beans pilot built

Measured: 717 beans, 4.58 MB of bodies; the published `assets/beans/index.json` is 676,187 bytes and holds 711 items, with previews only. The slice with bodies stored was 7.85 MB, which is over the 5 MB stop line. The coordinator decided to keep bodies OUT and make them `/payload/sha256/<hex>` payloads (f233). Result: `beans.sqlite3` is **2,822,144 bytes**. It uses a contentless FTS5 with full detail, so phrase search works. The build is deterministic (two builds give one sha256) and takes about 0.3 s. Chromium on a static host with no COOP/COEP: about 200 ms to download, verify and mount into `opfs-sahpool`, about 90 ms to reopen from OPFS, and the in-memory fallback is tested. The binary is built at deploy and not committed (`slice:sqlite:check`). The WASM build is vendored at 1.51 MB. The contract is in kg-export §"Per-slice SQLite". The who-iris `kg-to-portal` page has a section.

Still open: box 1 (a BPMN process and a Tool node; the script and the skill exist); box 2 (the `todos`, `library/` and whole-repo pilots); coordinating box 4 with l9v6 / xies / 7dek.
