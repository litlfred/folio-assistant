---
# folio-assistant-bjl8
$schema: bean/1.0.0
title: 'Pin ihe.iti.pcf 1.1.0 and ihe.iti.vhl 1.0.0-comment in phw sushi-config; reference by canonical URL only (PCF3)'
status: completed
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T17:00:00Z
parent: folio-assistant-negd
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: smart-trust-phw. Depends on: —.

## Done when
- SUSHI (0 errors) and IG build pass with the deps, or the R4-in-R5 failure is reported as could-not-determine with its message.

## Progress (2026-10-30)

- **PR (`litlfred/smart-trust-phw`)**: https://github.com/litlfred/smart-trust-phw/pull/4 (`feat/pcf1-pcf3-harness-and-ihe-deps`, head `9d78dac501a6aae9e428e84b6d58de80d2488d4f`)
- **Changes**:
  - Pinned `ihe.iti.pcf` (`1.1.0`, `https://profiles.ihe.net/ITI/PCF/ImplementationGuide/ihe.iti.pcf`, `id: IHE_ITI_PCF`) and `ihe.iti.vhl` (`1.0.0-comment`, `https://profiles.ihe.net/ITI/VHL/ImplementationGuide/ihe.iti.vhl`, `id: IHE_ITI_VHL`) under `dependencies:` in `sushi-config.yaml`.
  - Added canonical URL aliases in `input/fsh/Aliases.fsh` for IHE PCF 1.1.0 and IHE VHL 1.0.0-comment profiles, actors, operations, and value sets; referenced by canonical URL only (no `Parent:` inheritance across R4/R5).
  - Updated `input/fsh/actors/actors.fsh`, `input/pagecontent/system-actors.md`, and `input/pagecontent/dependencies.md` to reference canonical `https://profiles.ihe.net/ITI/VHL/index.html` and `https://profiles.ihe.net/ITI/PCF/index.html`.
- **Verification**:
  - `sushi .`: **0 Errors, 7 Warnings** (loads `ihe.iti.pcf#1.1.0` with 18 resources and `ihe.iti.vhl#1.0.0-comment` with 37 resources).
  - IG Publisher + `AstExportCli`: completes with exit 0 (61 resources, 103 edges; no R4-in-R5 conformance failure).
- 2026-10-30 ~17:00Z: [smart-trust-phw#4](https://github.com/litlfred/smart-trust-phw/pull/4) merged as 20682ab, after merging main in to combine AGENTS.md with [#3](https://github.com/litlfred/smart-trust-phw/pull/3). Merge window (owner, 2026-10-30 11:13Z, extended to ~19:38Z). Its red check was the main side, which has no harness until this PR.
