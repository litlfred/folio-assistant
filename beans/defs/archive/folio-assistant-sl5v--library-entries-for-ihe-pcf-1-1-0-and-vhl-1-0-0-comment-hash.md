---
# folio-assistant-sl5v
$schema: bean/1.0.0
title: 'Library entries for IHE PCF 1.1.0 and VHL 1.0.0-comment (hashed, Dublin Core, CC BY 4.0) (PCF2)'
status: completed
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T17:58:00Z
parent: folio-assistant-negd
blocked_by:
    - folio-assistant-nr5p
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: smart-trust-phw `library/`. Depends on: PCF1.

## Done when
- `check:materialized-fixity` green; one changed byte fails it.

## Implementation & Verification (2026-10-30)

- **PR:** [`litlfred/smart-trust-phw#5`](https://github.com/litlfred/smart-trust-phw/pull/5) (branch `feat/pcf2-pcf4-library-and-bpmn`, stacked on `litlfred/smart-trust-phw#4` / `feat/pcf1-pcf3-harness-and-ihe-deps`, commit `b5b9aed`).
- **Delivered:**
  - `library/ihe-iti-pcf-1-1-0/`: Materialized L1 specification snapshot (`ihe-iti-pcf-1-1-0.md`, SHA-256 `c0b86193d6ac3abb2addfdf6bdc4c8bbf8397f168546e4e14b7cc8ad16af3822`, 11,771 bytes; `structure.json`, SHA-256 `d0b731d52651f33bc4b7f82f4e13f8e93cdcfcf770ab0cd141b88a7d6d5be870`, 5,000 bytes; 12 `sections/*.md` + `*.jsonld`; 12 `blocks/prose-*.jsonld`; `manifest.jsonld`; `keywords.json`; `images.json`; `licence.json` under `CC-BY-4.0`; `README.md`).
  - `library/ihe-iti-vhl-1-0-0-comment/`: Materialized L1 specification snapshot (`ihe-iti-vhl-1-0-0-comment.md`, SHA-256 `e2775b089a9739c2556b172da928c4bece433d9d2ab7be01c8754705e17026cc`, 9,893 bytes; `structure.json`, SHA-256 `35bf3e5cc55462fd29a4f38ffea64ddba0e469601fc5e87a4e26ce6292a00656`, 4,544 bytes; 10 `sections/*.md` + `*.jsonld`; 10 `blocks/prose-*.jsonld`; `manifest.jsonld`; `keywords.json`; `images.json`; `licence.json` under `CC-BY-4.0`; `README.md`).
  - `catalogue/`: `catalogue/catalogue.json` (`folio-catalogue/v1`), `catalogue/records/ihe-iti-pcf-1-1-0.dc.json` and `catalogue/records/ihe-iti-vhl-1-0-0-comment.dc.json` (`folio-dublin-core/v1` qualified Dublin Core records), `catalogue/nodes/item-ihe-iti-pcf-1-1-0.json` and `catalogue/nodes/item-ihe-iti-vhl-1-0-0-comment.json` (`folio-catalogue-node/v1` with SHA-256 `fixity` and CC BY 4.0 publication gate verdicts), and `catalogue/README.md`.
  - `smart-trust-phw.json`: Declared `library` (`path: "library/"`, `graphTypologies: ["library"]`) and `smart-trust-phw-catalogue` (`path: "catalogue/"`, `graphTypologies: ["catalogue"]`).
- **Verification:**
  - `bun run folio-assistant-core/scripts/check-materialized-fixity.ts` → `materialized artefacts: 6 — 4 verified, 2 covered by their parts, 0 edited in place, 0 missing, 0 unverifiable` (`exit 0`).
  - Falsification test (1-byte mutation of `library/ihe-iti-pcf-1-1-0/ihe-iti-pcf-1-1-0.md`) → `::error::materialized content was edited in place: library/ihe-iti-pcf-1-1-0/ihe-iti-pcf-1-1-0.md` (`exit 1`); restored and re-verified (`exit 0`).
  - `bun run folio-assistant-core/scripts/check-catalogue.ts .` → `✓ every node validates; every metadataRef, libraryId, localPath and parent path resolves` (`exit 0`).
  - `bun run cat-harness-tools/scripts/check-l1-complete.ts library/ihe-iti-pcf-1-1-0 library/ihe-iti-vhl-1-0-0-comment` → all 14 L1 completeness checks pass for both entries (`exit 0`).
- 2026-10-30 ~17:57Z: [smart-trust-phw#5](https://github.com/litlfred/smart-trust-phw/pull/5) merged as 9165534 (merge window to ~19:38Z).
- Correction ~18:36Z: #5 merged into #4's feature branch, not main. Re-landed on main as [smart-trust-phw#6](https://github.com/litlfred/smart-trust-phw/pull/6), squash 1ae05a8.
