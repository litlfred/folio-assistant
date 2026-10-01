---
# folio-assistant-jcet
title: 'STANDARDS MISMATCHES the W3C methodology nodes recorded: PROV_CONTEXT IRI, JSON-LD @base in an external context, ODRL conflict default'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-01T12:32:06Z
updated_at: 2026-10-01T15:57:39Z
parent: folio-assistant-scfh
---

Found while writing the three W3C methodology nodes (bean 6306, PR #1769), each quoted against the HELD spec in cat-harness/library/. None is fixed: each needs a decision, not a mechanical edit.

1. **PROV_CONTEXT** (cat-harness/schemas/prov.ts:29) = "http://www.w3.org/ns/prov-o". That IRI is the PROV-O OWL ontology document; the namespace is http://www.w3.org/ns/prov# and W3C's JSON-LD context is http://www.w3.org/ns/prov.jsonld. Nothing imports the constant today. Decide what it NAMES, then rename or re-value it. Also: provDocument (scripts/prov-qaqc.ts) does not coerce prov:agent / prov:hadRole / prov:hadPlan to @id, so a JSON-LD processor reads them as strings; ProvActivitySchema allows actedOnBehalfOf on an Activity (spec domain: prov:Agent).
2. **@base in an external context.** schemas/jsonld.ts sets @base inside the published context; JSON-LD 1.1 §4.1.3 (held: library/w3c-2020-json-ld-1-1/sections/sec-033-413-base-iri.md): "@base will be ignored if used in external contexts". If documents reference the context by URL, relative @ids resolve against each document's own location. Verify with publish-verify before deciding.
3. **ODRL conflict default** is odrl:prohibit (schemas/odrl.ts FOLIO_DEFAULT_CONFLICT); ODRL 2.2 §2.10 says a policy with no conflict property defaults to invalid. Also: target optional (ODRL requires it), circular inheritFrom tolerated (§2.9 MUST NOT), cross-policy any-deny-wins vs ODRL's void. These are permission-policy choices; the methodology node odrl-policies.md lists each departure.

## Done when
- [ ] PROV_CONTEXT decided and fixed; @id coercion for the three object properties
- [ ] @base verified against a real resolution; moved or documented
- [ ] Owner ruling on the ODRL conflict default (keep prohibit as a stated profile departure, or follow §2.10)


## 2026-10-01 — @base measured (item 2)
Emitted .jsonld reference the context BY URL ("@context": "https://litlfred.github.io/folio-assistant/ns/content/v1.jsonld"), i.e. the external case. Expanding {"@id": "papers/x/blocks/def-foo"} with jsonld.js 8.3.3, the published context served by a local documentLoader and the document loaded from https://example.org/somewhere/else/: the @id resolves to https://litlfred.github.io/folio/papers/x/blocks/def-foo — the SAME as with the context inline. So jsonld.js applies @base from a remote context, which the held JSON-LD 1.1 text (§4.1.3) says is ignored. Our IRIs are correct today only through that processor's behaviour; a strictly conforming 1.1 processor would resolve relative @ids against each document's own URL. Not a live defect in this repo's pipeline; a portability defect for any consumer. Options: emit absolute @ids, or put @base in each document (or an embedded context) rather than in the remote one.

_2026-10-01T15:57:39Z_ — Claimed by claude/fervent-brahmagupta-rbwhzm — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
