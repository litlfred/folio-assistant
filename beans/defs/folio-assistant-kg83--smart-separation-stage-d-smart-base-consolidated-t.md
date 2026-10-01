---
# folio-assistant-kg83
title: 'SMART-* SEPARATION stage D: smart-base consolidated — theme, chrome re-key, retire smart-l1/smart-dak, DAK code into smart-base, L1/DAK kinds'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T16:38:40Z
updated_at: 2026-10-01T16:38:57Z
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
- [ ] CI green on the stage D PR
