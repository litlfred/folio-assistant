---
# folio-assistant-2z1t
$schema: bean/1.0.0
title: 'dsa document kind: legal text URL + SHA-256, ODRL Agreement, DCAT record, hash check (DSA B3)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-10-30T15:31:00Z
parent: folio-assistant-negd
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

In `folio-assistant-core` (content vocabulary). **Existing specs only (owner, 2026-10-30 14:39Z):** the kind defines no fields of its own. Its `nodeSchemas` are `external` references (supported by `cat-harness/schemas/kg/kind-validator.ts`) to ODRL 2.2 (`Agreement`), DCAT 3 (`dcat:Resource`, `dcat:Distribution` with `dcat:downloadURL` and `spdx:checksum`) and DCMI Terms (`dcterms:source` from Agreement to distribution). The only new code is the hash check. Validate against official JSON-LD contexts or published JSON Schemas, never a hand-written copy. Detail: `existing-schemas-options.md`. Versioned: a new version gets a new hash. One worked example (fictional unless the owner names a real public DSA, open question (i)). Depends on B1.

## Skills for the gap steps (owner, 2026-10-30 15:30Z)
The life-cycle diagram `folio-assistant-core/processes/content/dsa-document-lifecycle.bpmn` (core#245) marks these as manual "Gap:" steps. B3 turns them into skills in folio-assistant-core, and the diagram then names them:
- P2.2: compute and record the SHA-256 of the legal text, as DCAT 3 `spdx:checksum`.
- P2.3: make the ODRL Agreement cite the text with `dcterms:source`, naming that distribution.
- P2.4–5: write the DCAT 3 `dcat:Resource` / `dcat:Distribution` record and link versions. (`filing-dublin-core` covers DCMI terms only.)
- P14.5: set the catalogue status when an agreement is amended, renewed, terminated or expires.

## Done when
- The check passes on the example and fails on a one-byte change to the legal text.
- The Agreement's `dcterms:source` must name the same distribution whose `spdx:checksum` is checked.
- No field is defined that is not in ODRL 2.2, DCAT 3 or DCMI Terms.
- The four gap steps above name the new skills in dsa-document-lifecycle.bpmn, and `check:workflow-refs` passes.
