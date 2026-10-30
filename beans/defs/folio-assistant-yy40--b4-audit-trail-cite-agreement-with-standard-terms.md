---
# folio-assistant-yy40
$schema: bean/1.0.0
title: 'B4 audit trail: cite agreement with standard terms (prov:used + DCAT spdx:checksum + VC id)'
status: todo
type: task
priority: normal
created_at: 2026-10-30T19:20:41Z
updated_at: 2026-10-30T19:20:41Z
parent: folio-assistant-negd
---

Owner card 2026-10-30 19:16Z: "Merge, fix by bean". litlfred/cat-harness#753 (beans `3z44`, `2egb`) lands as is, ported to litlfred/cat-harness-tools#975 because bean `8lcl` moved `schemas/` there. This bean then replaces the fields #753 invented with existing open standards. Issue: litlfred/folio-assistant#2702.

Background: `/mnt/project-files/dsa-analysis/existing-schemas-options.md` (the table "Existing specs that cover each piece") and `missing-building-blocks-workplan.md` (B3, B4, B5), same folder.

## What changes
In `cat-harness-tools/schemas/content/prov.ts`, `schemas/kg/prov-jsonld.ts` and their consumers (`src/workflow/prov-record.ts`, `src/workflow/instance.ts`, `scripts/prov-qaqc.ts`, all from #919):

- **Agreement:** remove `cat-harness:agreement` / `ProvAgreementRefSchema` `{url, sha256, grant}`. The decision record names the agreement as a `prov:used` entity. That entity points at the DCAT 3 `dcat:Distribution` of the legal text and its `spdx:checksum`, the same distribution the B3 `dsa` kind records (bean `2z1t`) and the ODRL Agreement's `dcterms:source` names.
- **Grant:** remove `cat-harness:grant`. The record cites the grant by its W3C VC Data Model 2.0 credential `id` (B5), for example as a further `prov:used` entity. No grant fields of our own.
- **Hash chain:** keep `previousHash` / `recordHash` and `verifyProvHashChain`, but label them clearly as a **local extension**, in the schema docs, the JSON-LD context and the skill or README that describes the log. No open standard defines a hash-chained PROV log.
- The Consent citation from `2egb` (`id` + `versionId`) is out of scope unless it carries invented fields too. If it does, record that here instead of changing it.

## Done when
- [ ] No invented agreement or grant fields remain: no `cat-harness:agreement`, `cat-harness:grant` or `ProvAgreementRefSchema`. The agreement is cited through `prov:used` → DCAT distribution + `spdx:checksum`, and the grant by VC 2.0 credential id.
- [ ] `previousHash` / `recordHash` are documented as a local extension wherever they are defined.
- [ ] Tests pass: `schemas/content/prov.test.ts`, `scripts/tests/prov-record.test.ts` and `scripts/tests/prov-qaqc.test.ts`, updated to the new shape.
