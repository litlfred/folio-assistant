---
# folio-assistant-q7ds
$schema: bean/1.0.0
title: 'CONNECTED AGENT: run the FHIR term-mapping check against OCL (cloud sessions are refused api.openconceptlab.org)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-24T08:35:00Z
updated_at: 2026-10-24T10:43:15Z
parent: folio-assistant-0lmb
---

Owner, 2026-10-24 (Q7, "A + B"). The `fhir` target of `bun run cat check:term-mapping` reads every candidate as `undetermined` in cloud sessions, because the network policy refuses `api.openconceptlab.org:443` (`7wou`). The connected agent, the owner's local agent with ordinary internet, runs it once so we learn whether anything maps.

Expect few matches. Most candidates are names of the harness's own assets (skills, Tool nodes, BPMN steps, schema fields), not clinical concepts (`7wou`, "What the zero says").

## Done when
- [ ] the FHIR collections in scope are declared (`7wou`'s last item; which OCL collections is the owner's call, as `ejug` records)
- [ ] `check:term-mapping` runs with OCL reachable, and its committed result has a determined `mapped` or `unmapped` per candidate on `fhir`, with no `undetermined` left for transport reasons
- [ ] `nvhg` carries a note with the counts, so leg 2 knows whether its entry condition is met

Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.
