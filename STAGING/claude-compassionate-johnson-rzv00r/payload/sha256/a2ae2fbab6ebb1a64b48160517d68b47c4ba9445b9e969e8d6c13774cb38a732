---
# folio-assistant-mkao
title: 'LIBRARY VIEWER LEAK: withheld who-iris entries still published verbatim text and covers via /assets/library/'
status: completed
type: bug
priority: high
created_at: 2026-09-24T19:22:42Z
updated_at: 2026-09-24T20:42:03Z
parent: folio-assistant-kupb
---

Found by the 2026-09-24 channel audit after cw35 (#1300) excluded refused items from the site mount.

The platform library viewer (gen-library-viz.ts) reads library entries directly and publishes them under /assets/library/, bypassing the mount's withheld.json:
- entries/9789241548960-eng.json: ~124k chars of verbatim prose excerpts
- entries/who-pub-tps-931.json: ~65k chars
- avatars/who-iris/{both}.png: byte-identical to the withheld covers

Owner ruling: "2. Fix, keep summaries" — a withheld entry keeps our summaries and figure narratives, loses verbatim excerpts and its cover.

## Done when
- [x] One shared reader (scripts/lib/withheld.ts) used by mount AND viewer
- [x] Withheld entry: flagged `withheld`, no avatar, no prose excerpt; summaries + figure narratives kept
- [x] Orphan avatar copies pruned by the generator, a finding under --check
- [x] Tests (library-withheld.test.ts)
- [x] Verified on gh-pages after deploy: both entry files carry no excerpt and both avatars 404

## Summary of Changes

Merged in #1323 (`f9aabb0`), and verified live on gh-pages `77ea255`:
- `scripts/lib/withheld.ts` is now the one `withheld.json` reader, shared by the site mount and the library viewer.
- Withheld library entries are flagged `withheld`. They carry no avatar and no verbatim prose excerpt, but keep their summaries and figure narratives (owner: "Fix, keep summaries").
- `gen-library-viz.ts` prunes orphan avatar copies; under `--check` they are reported as a finding.
- Live result: the Handbook entry has 0 prose excerpts (1,527 chars of figure narrative remain), TPS-931 has 0 characters of text, and both refused covers are absent. Issue #1316 stays open for the owner to close.
