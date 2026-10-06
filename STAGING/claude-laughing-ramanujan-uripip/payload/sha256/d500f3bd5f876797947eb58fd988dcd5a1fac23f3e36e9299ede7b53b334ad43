---
# folio-assistant-7how
title: 'REGEN READS A STALE QA TREE: generators that read gitignored */test/results write wrong pages unless qa:working-copy ran first'
status: todo
type: bug
priority: high
created_at: 2026-10-06T09:15:31Z
updated_at: 2026-10-06T09:15:31Z
parent: folio-assistant-1xhc
---

Measured 2026-10-06 on #2267 (coordinator) and reported independently by session A, from #2268.

**What happens.** Since #2080 (5hox), the QA results tree is computed and not committed. Some generators read it from disk, at least `uml:overview` and `readme:subgraphs`. A container's local copy can be partial or stale. On #2267 only `kg-qa` was present, so `bun run regen` rewrote the QA overview without the `block-qa/v1` and `folio-test-run/v1` shapes. Locally it was green; CI, which runs `qa:working-copy` first, went red on `uml:overview:check` (10 files).

## Done when
- [ ] `bun run regen` either builds the QA working copy first, or refuses with a named remedy when it is absent or stale for HEAD. It never writes generated pages from a partial tree.
- [ ] A test with a partial results tree asserts that regen does not report the overview current.
- [ ] prepare-merge says it, if a manual step remains.
