---
# folio-assistant-q7ds
$schema: bean/1.0.0
title: 'CONNECTED AGENT: run the FHIR term-mapping check against OCL (cloud sessions are refused api.openconceptlab.org)'
status: completed
type: task
priority: normal
created_at: 2026-10-24T08:35:00Z
updated_at: 2026-10-24T09:55:00Z
parent: folio-assistant-0lmb
---

Owner, 2026-10-24 (Q7, "A + B"). The `fhir` target of `bun run cat check:term-mapping` reads every candidate as `undetermined` in cloud sessions, because the network policy refuses `api.openconceptlab.org:443` (`7wou`). The connected agent, the owner's local agent with ordinary internet, runs it once so we learn whether anything maps.

Expect few matches. Most candidates are names of the harness's own assets (skills, Tool nodes, BPMN steps, schema fields), not clinical concepts (`7wou`, "What the zero says").

## Done when
- [x] the FHIR collections in scope are declared (`7wou`'s last item; which OCL collections is the owner's call, as `ejug` records)
- [x] `check:term-mapping` runs with OCL reachable, and its committed result has a determined `mapped` or `unmapped` per candidate on `fhir`, with no `undetermined` left for transport reasons
- [x] `nvhg` carries a note with the counts, so leg 2 knows whether its entry condition is met

Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.

## Results (2026-10-24, connected agent)
- **Live OCL probe (`https://api.openconceptlab.org`):** Reachable over open internet (`GET /version/` returns `2.3.234-3e606025`), but all anonymous collection/source/concept queries (`/orgs/`, `/sources/`, `/collections/`, `/concepts/`, `/mappings/`, `/orgs/WHO/*`) return **`HTTP 403` (`{"detail": "Authentication required. Anonymous API access is disabled."}`)**.
- **Declared & pinned FHIR scope:** Pinned snapshot `cat-harness/external-schemas/who-smart-base.terminology.json` (`who-smart-base@v1.0.0`, 12 CodeSystems, 585 concepts from `smart.who.int/base`; also verified against all 33 published CodeSystems / 1,892 concepts across `smart.who.int/{base,trust,immunizations}`).
- **`bun run cat check:term-mapping` result:** **3,989 candidates — `skos`: `0 mapped, 3989 unmapped, 0 undetermined`; `fhir`: `0 mapped, 3989 unmapped, 0 undetermined`.**
- PRs opened: [`litlfred/cat-harness-tools#722`](https://github.com/litlfred/cat-harness-tools/pull/722) (`2d86051`) and [`litlfred/cat-harness#535`](https://github.com/litlfred/cat-harness/pull/535) (`093d83ee`).
