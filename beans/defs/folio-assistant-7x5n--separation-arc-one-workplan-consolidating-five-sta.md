---
# folio-assistant-7x5n
title: 'SEPARATION ARC: one workplan consolidating five stalled sessions'' GOAL 1 work (S0–S8)'
status: in-progress
type: epic
priority: high
created_at: 2026-10-01T08:14:10Z
updated_at: 2026-10-01T08:31:09Z
parent: folio-assistant-vuip
---

Consolidates the handovers of five stalled sessions (iirv, w2gr/9umr, cjvs/vke6, fnx4/eayu, d33q) into one arc. Plan, status bars, gap analysis (G1–G14), migration checklist and delegation rules: cat-harness/docs/proposals/separation-arc-2026-10-01.md. Stories S0–S8 are children; each story points at the existing beans it absorbs and owns no new code of its own.

Strategy adopted from sibling bean n3ni (smart-* -> litlfred/smart-*): push generic code down, seed staged dir into litlfred/<name> on a branch with one PR per repo, folio-assistant consumes it (submodule if imported, subscription if read), cut over only on owner OK.

## Done when
- [ ] S0–S8 completed
- [ ] status bars in the plan page reflect the final measurement


## Owner ruling 2026-10-01: merge green PRs
"yes you may merge green PRs". A PR in this arc may be merged when every CI job on its current head is green (read per job) and it is mergeable. Not before green.
