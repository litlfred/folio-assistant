---
# folio-assistant-q8ar
title: 'LATE MATERIALIZATION: per-slice SQLite/DuckDB WASM via OPFS on gh-pages; pilots beans, todos, library, whole repo; who-iris CDN'
status: in-progress
type: feature
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-03T11:17:41Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02 ("bean up #2"): a client (browser running Oxigraph or SQLite via WebAssembly) ingests a large KG but only selectively materializes heavy subgraphs or assets when needed — a Late Materialization (lazy loading) architecture, so the client never downloads gigabytes of static JSON-LD from GitHub Pages. Binary database formats: Oxigraph WASM loads text serializations into memory, so for static hosts the binary win is SQLite WASM or DuckDB-Wasm. "Direct OPFS mount": CI converts JSON-LD subgraphs into a flattened relational schema and runs the SQLite CLI to build `<slice>.sqlite3` (B-tree and JSON indexes), published to gh-pages; the client downloads it as an ArrayBuffer and writes it via the official SQLite WASM OPFS driver, which mounts it with zero parsing. Do it per KG slice; the user picks the slice. "who-iris will get really big … need client side searching. add to who-iris docs on CDN proposal and generalize."

## Done when
- [ ] process + skill + tool written for building a per-slice SQLite (and/or DuckDB) artefact from a named subgraph's skeleton, with its schema documented
- [ ] pilots, each measured (build time, file size vs JSON-LD, first-query latency in Chromium): `beans`, `todos`, `library/`, the whole repo
- [ ] client loader: download → OPFS → mount, with a fallback when OPFS is unavailable
- [ ] who-iris CDN proposal updated with this design, generalized to any slice (coordinate with l9v6 / xies / 7dek)
- [ ] heavy payloads stay lazy: the SQLite slice holds the skeleton and pointers, payloads fetched on demand

_2026-10-03T11:17:41Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
