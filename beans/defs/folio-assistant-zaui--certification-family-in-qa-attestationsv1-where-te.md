---
# folio-assistant-zaui
title: 'CERTIFICATION family in qa-attestations/v1: where test-plan-execution files a signed certification'
status: completed
type: task
created_at: 2026-10-02T05:48:39Z
updated_at: 2026-10-09T13:48:00Z
parent: folio-assistant-3fva
---

Follow-up from 3o5b (owner, 2026-10-02: open a bean). test-plan-execution.bpmn's A_FileCertification names the attestations graph as its destination, but qa-attestations/v1 has no certification family, so the filing step has nowhere to write.

## Do
- add a `certification` family to qa-attestations/v1 (schema + store paths under test/attestations/certification/)
- the filing step writes it; corrupt store → UNKNOWN and the write is refused, as for the other families
- qa:attestations:migrate:check and audit:coverage cover the new family

## Done when
- [x] a filed certification round-trips through the store in a test
- [x] kg:audit / audit:coverage report the family as judged, not typed-only

## Closed 2026-10-09

- Branch: `claude/zaui-certification-family` on `git@github.com:litlfred/cat-harness.git`.
- Commit: `a8b8b83ba0888d837bb9bcb25bde026724233fa3` ("feat(attestations): add certification family to qa-attestations/v1 (folio-assistant-zaui)")
- Changes in cat-harness:
  - Added `"certification"` to `ATTESTATION_FAMILIES`.
  - Added `BaseAttestationsSchema` alias, `CertificationSignerSchema`, `CertificationSignatureSchema`, `CertificationEntrySchema`, and `CertificationAttestationsSchema` extending `BaseAttestationsSchema`.
  - Added `CertificationAttestationsSchema` to `QaAttestationsSchema` discriminated union.
  - Added path helpers and routing: `certificationPath`, `certificationAttestationsHome`.
  - Added `readCertificationAttestations`, `writeCertificationAttestations`, and `fileCertification` with corrupt/unknown store detection and write refusal.
  - Added standalone root fallback in `schemas/graph-typology-registry.ts` so `validators/` (including `validators/qa-attestations.json`) resolve properly in worktrees/standalone checkouts.
  - Added comprehensive test suite in `schemas/qa-attestations.test.ts` covering:
    - schema validation
    - verdict/decision requirement
    - `certificationPath` routing under `<attestationsHome>/certification/`
    - store round-trip for filed certifications and entry appending
    - corrupt store refusal (`state: "corrupt"`)
    - non-directory store root refusal (`state: "unknown"`)
- Verification:
  - `bun test schemas/qa-attestations.test.ts`: 20 pass, 0 fail.
  - `bun test scripts/tests/qa-attestations-writers.test.ts`: 13 pass, 0 fail.
  - `bun run typecheck`: clean (0 errors).
