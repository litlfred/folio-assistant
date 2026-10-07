---
# folio-assistant-zaui
title: 'CERTIFICATION family in qa-attestations/v1: where test-plan-execution files a signed certification'
status: todo
type: task
created_at: 2026-10-02T05:48:39Z
updated_at: 2026-10-02T05:48:39Z
parent: folio-assistant-3fva
---

Follow-up from 3o5b (owner, 2026-10-02: open a bean). test-plan-execution.bpmn's A_FileCertification names the attestations graph as its destination, but qa-attestations/v1 has no certification family, so the filing step has nowhere to write.

## Do
- add a `certification` family to qa-attestations/v1 (schema + store paths under test/attestations/certification/)
- the filing step writes it; corrupt store → UNKNOWN and the write is refused, as for the other families
- qa:attestations:migrate:check and audit:coverage cover the new family

## Done when
- [ ] a filed certification round-trips through the store in a test
- [ ] kg:audit / audit:coverage report the family as judged, not typed-only
