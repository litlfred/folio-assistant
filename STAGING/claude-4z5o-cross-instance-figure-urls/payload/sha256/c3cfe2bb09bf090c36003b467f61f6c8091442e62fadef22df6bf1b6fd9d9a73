---
# folio-assistant-pb3e
title: 'QA gate: instances declare needs and have a harness IRI (#1548)'
status: completed
type: task
priority: normal
created_at: 2026-09-30T08:48:21Z
updated_at: 2026-09-30T08:51:34Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: 'QA gates on harness declaration of dependences. harness instancess need IRI for harness.' Issue #1548; done on PR #1530, which it unblocks.

## Done when
- [x] check:instance-graph fails on an instance with no needs ([] stays legal)
- [x] check:instance-graph fails on an instance with no absolute harness IRI, or two sharing one — via kg-export's exportIdentity
- [x] exportIdentity: own canonicalUrl publishes at <canonicalUrl>/<stub>.jsonld (fhir-harness, smart-base double segment)
- [x] resolution-across-needs corpus half asserts the gated invariant

## Summary of Changes

- `check:instance-graph` now fails on an instance with no `needs`, with no
  absolute harness IRI, or sharing one with another instance. The IRI comes
  from `kg-export`'s own `exportIdentity`, injected rather than restated.
- `exportIdentity`: an instance with its own `canonicalUrl` publishes at
  `<canonicalUrl>/<stub>.jsonld`; the doubled segment on `fhir-harness` and
  `smart-base` is gone. No published document changes (neither is exported).
- `resolution-across-needs.test.ts`: the corpus half asserts the gated
  invariant; the constructed test still proves the `unknown` fallback.
- `associate-harness` skill states the rule.
- Tests: `instance-declaration-gate.test.ts`, 8. Calibrated: reverting the
  IRI fix fails 1, disabling the needs check fails 1.
