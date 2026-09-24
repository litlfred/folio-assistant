---
# folio-assistant-mkao
title: 'LIBRARY VIEWER LEAK: withheld who-iris entries still published verbatim text and covers via /assets/library/'
status: in-progress
type: bug
priority: high
created_at: 2026-09-24T19:22:42Z
updated_at: 2026-09-24T19:22:42Z
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
- [ ] Verified on gh-pages after deploy: both entry files carry no excerpt and both avatars 404
