---
# folio-assistant-nr5p
$schema: bean/1.0.0
title: 'Declare smart-trust-phw as a harness instance and mount it (PCF1)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T17:00:00Z
parent: folio-assistant-negd
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: litlfred/smart-trust-phw, folio-assistant. Depends on: —.

## Done when
- `mount:remote:check` reports phw `mounted`; its artefact index builds.

## Progress (2026-10-30)

- **PR (`litlfred/smart-trust-phw`)**: https://github.com/litlfred/smart-trust-phw/pull/4 (`feat/pcf1-pcf3-harness-and-ihe-deps`, head `9d78dac501a6aae9e428e84b6d58de80d2488d4f`)
- **PR (`litlfred/folio-assistant`)**: https://github.com/litlfred/folio-assistant/pull/2761 (`feat/nr5p-mount-smart-trust-phw`, head `3694751de6`)
- **AST cache branch seeded**: `cat/fhir-harness/fhir-ast/smart.who.int.trust-phw` on `litlfred/smart-trust-phw` (61 resources, 103 edges, valid for `9d78dac501a6aae9e428e84b6d58de80d2488d4f`).
- **Verification**:
  - `bun run cat mount:remote:check` in `folio-assistant` reports `smart-trust-phw` `mounted` (2 directories verified).
  - `bun run cat ig-index:build -- --only smart-trust-phw` builds `smart-trust-phw/fhir-artifact-index/index.json` (61 resources, 44 bound DAK API sidecars), `menu.json` (5 groups), `package.tgz` (61 resources), and `releases.json`.
  - `bun run cat smart-trust-phw:pages` renders 372 IG pages under `smart-trust-phw/docs/`, and `bun run cat smart-base:document-kinds` writes `smart-trust-phw/document-kinds/dak.coverage.smart-trust-phw.json`.
- 2026-10-30 ~17:00Z: [smart-trust-phw#4](https://github.com/litlfred/smart-trust-phw/pull/4) merged as 20682ab, after merging main in to combine AGENTS.md with [#3](https://github.com/litlfred/smart-trust-phw/pull/3). Merge window (owner, 2026-10-30 11:13Z, extended to ~19:38Z). Its red check was the main side, which has no harness until this PR.
- Still open: [folio-assistant#2761](https://github.com/litlfred/folio-assistant/pull/2761) pins phw at 9d78dac; it must re-pin to 20682ab (phw main). Re-pin handed to the "CI, render and merge speed" thread.
