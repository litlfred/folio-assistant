---
# folio-assistant-huiu
title: 'DUBLIN CORE: a .ts record type in cat-harness, fully worked for the three IRIS examples'
status: todo
type: task
priority: high
created_at: 2026-09-20T08:01:40Z
updated_at: 2026-09-20T08:01:40Z
parent: folio-assistant-kupb
---

Owner: 'break up working bits (like .ts record for dublin core) etc. fully worked for the three examples.'

WHERE IT LIVES IS THE DECISION, and it is not who-iris. Dublin Core is an ISO standard (15836) and DSpace is a platform; neither is WHO-specific. Owner, same message: 'mionimal tools in who specific stuff.' So `schemas/dublin-core.ts` is a cat-harness node and `who-iris/` holds the three RECORDS plus a skill saying how IRIS uses it.

QUALIFIED, not simple. The measured record uses element.qualifier form throughout (`dc.date.accessioned`, `dc.identifier.govdoc`, `dc.subject.mesh`, `dc.description.abstract`), REPEATS four elements (two accessioned, two available, two uri, two mesh) and carries a per-field LANGUAGE qualifier. A flat Record<string,string> loses all three facts. The type must be repeatable-valued and language-tagged or it cannot round-trip the one record we actually have.

## Done when
- `schemas/dublin-core.ts` exists, `@graphNode schema`, with a Zod schema and a JSON-LD projection.
- All three library entries carry a worked record that validates.
- A test asserts the two-`dc.identifier.uri` and two-`dc.subject.mesh` cases round-trip.
