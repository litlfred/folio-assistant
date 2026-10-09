---
# folio-assistant-pebe
title: 'smart-base: pin smart-kg (L1/L2 ontology) as a subgraph; document kinds cite its classes'
status: completed
type: task
priority: normal
created_at: 2026-10-02T06:15:59Z
updated_at: 2026-10-09T17:10:48Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-02 (#1767): 'utilize https://github.com/litlfred/smart-kg for L1 related stuff' and '(perhaps subgraph in smart-base to help define l1 dth etc docs?)'; chose options 1+2.

smart-kg (fork of WorldHealthOrganization/smart-kg) is a T-Box only: L1 (16 classes), L2 DAK components (13), L2-BPMN, L2-DMN, L3. Owner 2026-09-23 (bean wg7r): 'dont want smart-kg here yet, that is its own repo already' — so it is REFERENCED by pin, never copied.

## Done when
- [x] smart-base declares an external-schema subgraph with a pin record for smart-kg at a commit
- [x] a derived snapshot of the L1+L2 class ids, written by a pin script from a checkout at that commit, never by hand
- [x] document-kind sections can name the classes they instantiate (modelledBy), and smart-base:document-kinds:check fails on a term not in the pin and on an unresolved extends
- [x] l1.json and dth.json use it

## Status check 2026-10-06 (evidence, re-derived on a fresh checkout)

- Items 1–2: `smart-base/external-schemas/who-smart-kg.json` pins litlfred/smart-kg @ `66a9b13`, declared as `smart-base-external-schemas` in `smart-base/smart-base.json`; `who-smart-kg.terms.json` is the derived snapshot (`pin-smart-kg.ts`).
- Item 3, measured: `gen-document-kinds.ts --check` is green as committed; with `sgkg-l1#noSuchClass` injected into dth.json it exits 1 with *section "personas" is modelledBy "sgkg-l1#noSuchClass", which the pinned smart-kg snapshot does not declare*. Unresolved `extends` is checked at `gen-document-kinds.ts:60`. A malformed term is refused earlier by the schema (`<system>#<code>`).
- Item 4 stays open: dth.json cites 7 classes, l1-guideline.json 6, **l1.json 0** (and dak.json 0, which is not in this item).
- Pin freshness: litlfred/smart-kg HEAD and WorldHealthOrganization/smart-kg HEAD are both `66a9b13` today, so the pin is current.
- Note: the check needs the `bootstrap` / `bootstrap-tools` submodules; on a checkout without them it exits 1 on *Cannot find module ../../bootstrap-tools/scripts/check-closure.js* before reading any kind.


## Closed 2026-10-09 (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
https://github.com/litlfred/smart-base/pull/16 merged (c4f8abe): l1.json's five sections carry modelledBy (4× `sgkg-l1#publication-section`, references `sgkg-l1#citation`); dth.json already cited 7. `gen-document-kinds.ts --check` green in a composed root, exits 1 on an injected `sgkg-l1#noSuchClass`; its test 17 pass.

Noted, not acted on: the triage reported the smart-kg pin (66a9b13) lagging the fork's own `kg/` L1 3.0 work (3f5e477). Moving the pin is `pin-smart-kg.ts` from a checkout at the new commit — a separate change, owned by ioa4's L1 work.
