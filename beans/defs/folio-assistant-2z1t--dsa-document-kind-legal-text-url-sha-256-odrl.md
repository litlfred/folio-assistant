---
# folio-assistant-2z1t
$schema: bean/1.0.0
title: 'dsa document kind: legal text URL + SHA-256, ODRL Agreement, DCAT record, hash check (DSA B3)'
status: todo
type: feature
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-10-30T14:45:00Z
parent: folio-assistant-negd
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

In `folio-assistant-core` (content vocabulary). **Existing specs only (owner, 2026-10-30 14:39Z):** the kind defines no fields of its own. Its `nodeSchemas` are `external` references (supported by `cat-harness/schemas/kg/kind-validator.ts`) to ODRL 2.2 (`Agreement`), DCAT 3 (`dcat:Resource`, `dcat:Distribution` with `dcat:downloadURL` and `spdx:checksum`) and DCMI Terms (`dcterms:source` from Agreement to distribution). The only new code is the hash check. Validate against official JSON-LD contexts or published JSON Schemas, never a hand-written copy. Detail: `existing-schemas-options.md`. Versioned: a new version gets a new hash. One worked example (fictional unless the owner names a real public DSA, open question (i)). Depends on B1.

## Done when
- The check passes on the example and fails on a one-byte change to the legal text.
- The Agreement's `dcterms:source` must name the same distribution whose `spdx:checksum` is checked.
- No field is defined that is not in ODRL 2.2, DCAT 3 or DCMI Terms.
