---
# folio-assistant-bzwk
$schema: bean/1.0.0
title: 'LAYERING: core''s block kinds and voices name the ''paper'' content adapter, which only folio-assistant-sci declares; without sci BLOCK_KINDS is empty and no voice loads'
status: completed
type: bug
priority: high
created_at: 2026-10-11T05:50:58Z
updated_at: 2026-10-14T14:00:00Z
---

Found 2026-10-11 while moving litlfred/smart-ra onto remote mounts (bean n3h9).

## Measured
- Mounted closure: smart-base, fhir-harness, folio-assistant-core, cat-harness, cat-harness-tools, bootstrap, bootstrap-tools, each at its main of 2026-10-10. In it, `cat-harness-tools/content/pipeline/qa-sweep.ts folio` stops before sweeping with: `VoiceLoadError: voice technical-writer/voice.json: appliesTo.0: Invalid input`.
- The cause:
  - **Core** declares the block kinds (`folio-assistant-core/block-kinds/prose.json` and the rest, `adapter: "paper"`) and the voices that name them (`skills/voices/technical-writer/voice.json`, `appliesTo: [prose, …]`).
  - **folio-assistant-sci** declares the `paper` content adapter (`content-adapters/paper.json`, `typed: true`).
  - **cat-harness** keeps a discovered kind only if its adapter is a TYPED adapter it discovers (`schemas/block-kinds.ts`: `BLOCK_KIND_NODES`, `CONTENT_ADAPTERS`). With sci absent, `BLOCK_KINDS` is EMPTY and no voice loads.
- folio-assistant does not hit this because it mounts sci.

## Why it is a defect
A layer's kinds are not usable without a layer that does not sit beneath it: sci is not in core's `needs`. Any downstream mounting core without sci (every smart-* IG, who-iris, smart-ra) gets an empty block-kind vocabulary.

## Workaround in place
smart-ra#37 mounts folio-assistant-sci explicitly.

## Done when
- [x] the `paper` content adapter is declared where its block kinds are (core), or core's kinds name an adapter core declares, or core `needs` the layer that declares it. Owner to pick. — option B: core declares its own `document` adapter (folio-assistant-core `05f09d8`)
- [x] qa-sweep runs from a closure without folio-assistant-sci — smart-ra's `qa-sweep` check passed on litlfred/smart-ra#58 (2026-10-14 13:15Z) with no sci mount
- [x] smart-ra drops the sci mount — smart-ra's `index.lock.json` mounts no folio-assistant-sci (AGENTS.md: "no longer mounted… since bean bzwk")

## 2026-10-12 — owner ruling: option B (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)
Owner: *"B, multiple adapter for same assets ok"* (after proposing "mathpaper").
- **sci** declares an adapter `mathpaper` for its 7 formal-claim kinds (definition, theorem, lemma, proposition, corollary, conjecture, proof).
- **core** declares its own adapter for its 9 kinds (prose, example, remark, algorithm, simulator, equation, diagram, table, figure). Core then names nothing in sci.
- A folio may hold kinds of several adapters: a math paper uses core's and sci's.
- The name of core's adapter is still to be confirmed. Proposed: `folio` or `document`.
- Order:
  1. cat-harness accepts multi-adapter folios, and kinds of more than one typed adapter.
  2. core declares its adapter, and its kinds name it.
  3. sci renames `paper` to `mathpaper`.
  4. Folio configs and QA scoping follow.
  5. The sci mounts in smart-ra and who-iris can go.

## 2026-10-12 — names and companions decided (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)
Owner: *"1 document, 2 drop"*.
- Core's adapter is `document`. Its 10 kinds: prose, example, remark, algorithm, simulator, equation, diagram, table, figure, recommendation.
- It takes companion roles md and ts only, with NO lean. Only `mathpaper` kinds carry a `.lean` sibling. Existing folios with a lean companion on a document kind must be checked before step 3.
- The class adapters (contentType document / paper) are unchanged.
- The six-step PR plan (subagent research, 2026-10-12) is in the session. Step 1 makes cat-harness adapter-generic: ContentAdapter becomes a string, ADAPTER_BLOCK_KINDS is derived, the criterionAdapters default is every typed adapter, and a temporary `paper` alias is added.

## Summary of Changes

Done by the 2026-10-12 work above (core's `document` adapter, smart-ra unmounting sci); closed during the 2026-10-14 bean drain with the evidence ticked in place (session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs).
