---
# folio-assistant-kg83
title: 'SMART-* SEPARATION stage D: smart-base consolidated — theme, chrome re-key, retire smart-l1/smart-dak, DAK code into smart-base, L1/DAK kinds'
status: completed
type: task
priority: normal
created_at: 2026-10-01T16:38:40Z
updated_at: 2026-10-04T07:07:45Z
parent: folio-assistant-n3ni
---

Stage D of cat-harness/docs/proposals/smart-separation-2026-10-01.md (#1767). Owner 2026-10-01: go ahead with stage D, pause merge of #1783; stacked on stage C.

Owner decisions (2026-10-01, structured questions):
- Old layers: retire smart-l1 and smart-dak; KEEP smart-ig (the IG-publication layer the DAK feeds). smart-trust / smart-immunizations keep needs: smart-ig.
- Q4 chrome: re-key chrome.json to the template (who.template.root), shipped with the smart-base harness.
- DAK code: dak.ts, dak-blocks.ts, dak-content-type.ts all into smart-base; partition rule updated.

## Done when
- [x] D1 WHO theme (smart-trust/themes, id who-smart-ig) moves to smart-base/themes; declarations and references follow
- [x] D2 chrome.json re-keyed to who.template.root; IG banners still draw their own identity; tests follow
- [x] D3 smart-l1/ and smart-dak/ retired (owner OK); root needs, hardcoded lists (4 places) and docs follow
- [x] D4 dak.ts + dak-content-type.ts (+ tests) into smart-base/schemas; no upward import from core. dak-blocks.ts stays in core: owner chose the split (2026-10-01) — bean 1335 builds the extension point it needs
- [x] D5 scoped OUT of this PR (owner, 2026-10-01: "own PR after #1795"): L1 and DAK document kinds with visualizers are bean qvxh, a stacked PR with a design note first; partly blocked on bean 1335
- [x] D6 l3-fhir-authoring input generalised to a source model; smart-base supplies the L2->L3 specialisation
- [x] CI green on the stage D PR

## Summary of Changes

Closed 2026-10-04 on evidence, by the wm63 session. Stage D landed as #1795, together with #1811 and #1830 (train #1869). Every gating check on #1795's head was green: Repository gates, TypeScript, E2E, Skill-registration, Python/Lean imports, .jsonld sync. D5 was scoped out to bean qvxh by the owner, so it is not part of this closure.
