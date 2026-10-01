---
# folio-assistant-2ae2
title: 'Readers: docs site, feature staging, review heat map and MCP tools fetch QA from qa-reports'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:55Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, proposal §4 items 3.3 and 3.4. Blocked on the qa-store bean. Can be dispatched in parallel with the gates bean.

- the `assets/qa/` copy in `docs-site.yml:609` and `feature-staging.yml:1089`
- the badges (`head_custom.html`, `docs/qa/index.html`)
- `publish-block-qa.ts`, `review-heat.ts` and `gen-review-page.ts`
- MCP: lsi output (`tools/index.ts`), `src/tools/degradation.ts` and `src/qa-agent-write.ts`. Agent verdicts are attestations, so they follow D2.

Verify by building `preview:site` and looking at a badge and the heat map (`rendered-verification`).

## Done when
- [ ] the badges and heat map render identically from the branch; screenshots are sent before and after
- [ ] the MCP tools return the same results with `test/results/` absent locally
