---
# folio-assistant-qvxh
title: SMART L1 and DAK as DOCUMENT KINDS with visualizers inside smart-base, not harnesses
status: in-progress
type: feature
priority: normal
created_at: 2026-10-01T08:37:53Z
updated_at: 2026-10-01T18:20:42Z
parent: folio-assistant-uhkv
---

Issue #1767; proposal cat-harness/docs/proposals/smart-separation-2026-10-01.md §Decided Q5.

Owner, 2026-10-01: "what they really need to be are sub-document types/kinds/visualizer for them. smart-L1 is like a L1 document that was fully computable from smart-base assets (and maybe some other things like PICO, cochrane, etc), semi fixed structure ... similarly DAK is a publication type w/ the 10 components, fixed structure."

So smart-l1/ and smart-dak/ (today: boilerplate + one kg-qa each, declaring no directories) stop being harnesses and become document kinds inside the smart-base harness.

Head start: cat-harness/schemas/dak.ts, dak-blocks.ts, dak-content-type.ts already exist (S-destined by the split plan).

## Done when
- [ ] L1 kind: semi-fixed structure declared; computed from smart-base library/ plus external evidence (PICO, Cochrane) — sources named, not assumed
- [x] DAK kind: the ten components as a fixed structure, GENERATED from DAK_COMPONENTS + DAK_CARDS (no second list); smart-base/document-kinds/dak.json, gated (#1811)
- [x] a visualizer for each kind: the generic document-kinds viewer (/cat-harness/document-kinds/<instance>/), with the DAK view of every ingested IG computed from resource type (#1811)
- [x] smart-l1/ and smart-dak/ retired with the owner's OK (stage D3, #1795); smart-ig kept, so needs: smart-ig stays
- [x] smart-ig's fate: owner kept it (2026-10-01) as the IG-publication layer

_2026-10-01_ — Started as stage D5 (owner: 'start D5 while CI runs'), branch claude/awesome-fermi-ua31th-stage-d5 stacked on #1795. Design note first: cat-harness/docs/proposals/smart-document-kinds-2026-10-01.md. Measured: a content profile is the wrong mechanism (CONTENT_PROFILES is a compile-time union in core, and profiles constrain block kinds, not structure). Proposed: a generic document-kind graph kind in core + smart-base's dak/l1 kinds as data + viewers. Two done-when items already closed by stage D (#1795): smart-l1/smart-dak retired (D3, owner OK); smart-ig kept (owner).

_2026-10-01T18:19:26Z_ — Claimed by claude/awesome-fermi-ua31th-stage-d5 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
