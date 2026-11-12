---
# folio-assistant-w3xx
$schema: bean/1.0.0
title: 'Memory: S-CI3 (2026-11-01): which derive:publish writers write different bytes every run, fixes (fhir-harness#257, cat-harness-tools#1231), and how to measur...'
status: completed
type: task
priority: low
created_at: 2026-11-01T08:42:51Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `nondeterministic-writers-s-ci3.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: S-CI3 (2026-11-01): which derive:publish writers write different bytes every run, fixes (fhir-harness#257, cat-harness-tools#1231), and how to measure locally


Thread "Stop nondeterministic writers forcing rebuilds" (cmsg_017WNUkNK8kdDziPK58Pv6G92SF6sxJ4HGu4ndyuT9brUk), sibling S-CI3 of folio-assistant-7w1o. Issue cat-harness-tools#1230.

Measured 2026-11-01 with 3 local `bun run cat derive:publish --no-cache` runs on one fa checkout (sha1 snapshot of every file between runs):
- Every run: IG sidecars `<ig>/fhir-artifact-index/sidecars/*.jsonld` (generatedAt = clock, ig-api-gen.ts) and package.tgz + index.json bytes (plain tar). Fix fhir-harness#257 (AST manifest generatedAt; reproducible GNU tar + gzip -n).
- Every run: bean workflow pages + cat-harness/docs/cat-harness/state.jsonld (state-visualizer NOW = instant). Fix in cat-harness-tools#1231: start of UTC day.
- site/index.html: site:viz reads gh-pages live, by design.
- Order effects (only when a folder is already filled): uml overview of docs/, auto-docs index, skill-instructions, KG *.hydrated.jsonld, harness.json, published-graphs.md. Not fixed yet.
- #1231 also makes the skip log name every changed read, not only the first (previews showed "." / ".git changed").

How: shallow-clone fa, `bash .github/mount-from-lock.sh --root .`, bun install, state:mount, ig-index:build, smart:pages, smart:pages:publish, then derive:publish. Untraced run ~15 min here; under strace ~10x slower (don't). Actions artifact/cache downloads are blocked by the proxy. Force-push is refused by the classifier: merge instead.
2026-11-01 09:2xZ: merged tools#1231 (1f83c17) and fhir-harness#257 (69af94d) in the 07:27Z window. Re-pins left to the open fa re-pin PRs (#2864 tools, #2869 fhir-harness); coordinator asked to relay. Next: measure a main deploy after the re-pins.
