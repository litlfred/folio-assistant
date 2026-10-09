---
# folio-assistant-7x5n
title: 'SEPARATION ARC: one workplan consolidating five stalled sessions'' GOAL 1 work (S0–S8)'
status: in-progress
type: epic
priority: high
created_at: 2026-10-01T08:14:10Z
updated_at: 2026-10-09T15:15:00Z
parent: folio-assistant-vuip
---

Consolidates the handovers of five stalled sessions (iirv, w2gr/9umr, cjvs/vke6, fnx4/eayu, d33q) into one arc. Plan, status bars, gap analysis (G1–G14), migration checklist and delegation rules: cat-harness/docs/proposals/separation-arc-2026-10-01.md. Stories S0–S8 are children; each story points at the existing beans it absorbs and owns no new code of its own.

Strategy adopted from sibling bean n3ni (smart-* -> litlfred/smart-*): push generic code down, seed staged dir into litlfred/<name> on a branch with one PR per repo, folio-assistant consumes it (submodule if imported, subscription if read), cut over only on owner OK.

## Done when
- [ ] S0–S8 completed
- [ ] status bars in the plan page reflect the final measurement


## Owner ruling 2026-10-01: merge green PRs
"yes you may merge green PRs". A PR in this arc may be merged when every CI job on its current head is green (read per job) and it is mergeable. Not before green.

## Owner rulings 2026-10-09
Recorded by session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb; tracked in litlfred/folio-assistant#2521.

1. **Standalone ratchet → option (c).** Tests that check the INDEX repository's own workflows move into the index repo beside the files they check, rather than lengthening cat-harness's `standalone-baseline.json`. With it: entries whose only change is their error text are re-keyed; state-graph tests report *not applicable* when cat-harness stands alone, never as a pass in the composed checkout.
2. **Withheld-viewer test → option (b).** `library-withheld-viewer.e2e.ts` serves its own test-only withheld entry. who-iris withholds nothing since the owner cleared every entry on 2026-10-08 (gate basis: "special development authorization for WHO staff in development environment").
3. **README CI badges → option (a).** The rendered root README carries none.
4. **Decision log.** Owner rulings in this arc are appended here as dated sections, through a reviewed PR.

Applied earlier the same day: `beans/` and `todos/` branch-mounted and `.gitignore`d; root README/AGENTS are rendered files (`index:render`); `uploads/` is a directory subgraph; visualiser PRs merge when green; `merge when green and ready` covers repos without PR CI, verified locally.
