---
# folio-assistant-wixl
title: 'SLICE FILE CDN STALENESS: <slice>.sqlite3 is served from a fixed path, so a CDN can hand a client old bytes it then rejects on sha256 — content-address the slice file like payloads'
status: completed
type: task
priority: normal
created_at: 2026-10-03T15:51:14Z
updated_at: 2026-10-03T16:44:36Z
parent: folio-assistant-whlc
---

Found 2026-10-03 while writing the who-iris CDN section (q8ar box 4). `cat-harness/docs/assets/slices/<slice>.sqlite3` keeps one path across builds; only `<slice>.sqlite3.json` (the manifest, with sha256) changes meaningfully. Behind a CDN with any TTL the client can fetch a fresh manifest and a stale database, fail the sha256 check, and fall back — a correctness-safe but availability-unsafe design. Payloads (f233) already avoid this by content addressing.

## Done when
- [x] slice file published at a content-addressed path (e.g. `assets/slices/<slice>.<sha256>.sqlite3` or under `/payload/sha256/`), the manifest names it
- [x] the client fetches by the manifest's name, so a stale manifest at worst fetches an older but self-consistent database
- [x] old slice files are rotated (deploy-time build, so the deploy writes only the current one) — say what a CDN may still hold
- [x] e2e covers a manifest/db sha mismatch

## Summary of Changes

- `gen-slice-sqlite.ts` publishes each slice as `assets/slices/<slice>.<full sha256>.sqlite3`. The fixed-name `<slice>.sqlite3.json` manifest names it in `file`. This was chosen over `/payload/sha256/` because a slice file is skeleton and no node links to it, so the payload tree's orphan rule would reject it (header and `kg-export` §"Content-addressed file, fixed-name manifest"). `--check` gates that `file` is the content-addressed name of the file that was written.
- Rotation: `rotateSliceFiles` removes this slice's earlier builds and the legacy `<slice>.sqlite3` from `--out`. Nothing piles up on gh-pages: `docs-site.yml` is a full replace, `feature-staging.yml` empties `STAGING/<slug>/` before it writes, and `staging-rotate.ts` caps the number of previews. A CDN can still hold any of these:
  - a stale manifest together with the older file it names, for one TTL (Pages `max-age=600`). The pair is consistent.
  - an old file that nothing names, until it expires.
  - a stale manifest whose file is gone. The page reports a 404 and asks for a reload.
- Client: fetches the file the manifest names. A sha mismatch raises `SliceIntegrityError`, which no fallback retries. The page shows it and sets `data-slice-error="integrity"`.
- Tests:
  - builder: the file name is the hash, the manifest names it, one file is written, and rotation stays in scope.
  - e2e: the named file is the one downloaded, and a mismatch is refused visibly in both Worker+OPFS and in memory.
- The who-iris CDN section is updated and regenerated.
