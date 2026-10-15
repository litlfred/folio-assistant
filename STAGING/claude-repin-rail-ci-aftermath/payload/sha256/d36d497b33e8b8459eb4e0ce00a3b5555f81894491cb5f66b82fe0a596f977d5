---
# folio-assistant-1gf7
$schema: bean/1.0.0
title: 'ASSESS: open standards for requirements, and methodologies that fit the bootstrap Requirement'
status: completed
type: task
created_at: 2026-09-23T19:34:01Z
updated_at: 2026-10-09T18:43:00Z
parent: folio-assistant-2upx
---

Issue #1164. Owner, 2026-09-23, choosing markdown front matter for requirement documents: '1 for now. need bean to assess open stds for requirements/methodologies that fit in'.

The bootstrap Requirement is deliberately free of outside concepts. This bean asks which open standards a harness could MAP it to or from, in a layer above bootstrap, and at what cost.

## Done when
- [x] a survey of open requirements standards and notations (interchange formats, statement templates, quality models), each with licence, maturity and fit to the bootstrap fields
- [x] a recommendation: which to map in which layer, and whether the markdown front-matter format should change
- [x] nothing adopted into bootstrap — any mapping lives above it, per the no-outside-concept rule

## Closed 2026-10-09

- **Branch**: `claude/1gf7-requirements-standards-assessment`
- **Commit**: `f66e2e5c4d009f48b8db3206893abad7ef580514`
- **Methodology**: Authored `methodologies/requirements-standards-assessment.md` conforming to `folio-methodology/v1`, surveying:
  - Interchange formats: ReqIF 1.2 (OMG / ISO 17506), OSLC-RM 2.1 (OASIS).
  - Statement templates & grammars: EARS (5 patterns: Ubiquitous, Event-driven, State-driven, Unwanted behavior, Optional features), ISO/IEC/IEEE 29148:2018 (Clause 5.2.4 & Clause 6.4 verification quartet), IEEE Std 830-1998 (superseded).
  - Quality models: ISO/IEC 25010:2011/2023 (product quality characteristics for NFR categories), INCOSE Guide for Writing Requirements (singularity, verifiability, lint rules).
- **Decoupling & Recommendations**:
  - The bootstrap Requirement schema and Markdown front-matter format remain lean, self-contained, and zero-dependency (no outside concepts).
  - Higher harness layers (`cat-harness`, `folio-assistant-core`) provide bidirectional projection adapters (ReqIF, OSLC-RM) and authoring linters (EARS syntax, ISO 25010 NFR categories).
- **SDLC Skills**:
  - Created `skills/sdlc/sdlc-core/specification-management.md` and registered in `package-manifest.json`.
  - Cross-referenced in `skills/sdlc/crdm/crdm-requirements-template.md`, `skills/sdlc/spec-kit/spec-kit.md`, and `skills/sdlc/sdlc-core/coordinate.md`.
- **Test Evidence**:
  - `bun test scripts/tests/requirements-standards-assessment.test.ts` — 10 pass, 0 fail (76 assertions covering front-matter conformance, bootstrap schema decoupling, ReqIF SpecObject round-trip, EARS pattern classification, ISO 29148 verification mapping, and ISO 25010 NFR validation).
  - `bun scripts/check-methodology-evidence.ts` — 23 methodology nodes valid, exit 0.
  - `bun run typecheck` — clean typecheck, exit 0.
