---
# folio-assistant-wixl
title: 'SLICE FILE CDN STALENESS: <slice>.sqlite3 is served from a fixed path, so a CDN can hand a client old bytes it then rejects on sha256 — content-address the slice file like payloads'
status: todo
type: task
created_at: 2026-10-03T15:51:14Z
updated_at: 2026-10-03T15:51:14Z
parent: folio-assistant-whlc
---

Found 2026-10-03 while writing the who-iris CDN section (q8ar box 4). `cat-harness/docs/assets/slices/<slice>.sqlite3` keeps one path across builds; only `<slice>.sqlite3.json` (the manifest, with sha256) changes meaningfully. Behind a CDN with any TTL the client can fetch a fresh manifest and a stale database, fail the sha256 check, and fall back — a correctness-safe but availability-unsafe design. Payloads (f233) already avoid this by content addressing.

## Done when
- [ ] slice file published at a content-addressed path (e.g. `assets/slices/<slice>.<sha256>.sqlite3` or under `/payload/sha256/`), the manifest names it
- [ ] the client fetches by the manifest's name, so a stale manifest at worst fetches an older but self-consistent database
- [ ] old slice files are rotated (deploy-time build, so the deploy writes only the current one) — say what a CDN may still hold
- [ ] e2e covers a manifest/db sha mismatch
