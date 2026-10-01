---
# folio-assistant-h3tx
title: 'PHASE P4: the Publisher invoked for AST + QA only; a release still cut from a full build and saying so'
status: todo
type: feature
created_at: 2026-10-01T12:32:21Z
updated_at: 2026-10-01T12:32:21Z
parent: folio-assistant-uhkv
blocked_by:
    - folio-assistant-a9tx
---

Phase P4 of `ig-publisher-reduction` (approved 2026-09-30 as written). Opened in the 2026-10-01 phased-transition review.

**Exit criterion:** a release is still cut from a full build, and the artefact **says which** it came from.

**Blocked by `a9tx`** (P3's prerequisite: AST measurements on a real IG; needs `packages.fhir.org`, unreachable from these sessions). Nothing to build before P3 lands, so this entry exists so that the phase has a home.

## Done when
- [ ] staging builds from the cached AST; releases from a full build
- [ ] every published artefact records which kind of build it came from
