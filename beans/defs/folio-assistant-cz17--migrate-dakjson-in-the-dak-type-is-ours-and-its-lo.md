---
# folio-assistant-cz17
title: 'Migrate dak.json in: the DAK type is ours, and its Logical Model is pending upstream'
status: todo
type: task
created_at: 2026-09-18T21:36:56Z
updated_at: 2026-09-18T21:36:56Z
---


## The correction this starts from

`dak.json` is **ours**, as part of L2 in `smart-base` — not a third-party file
we merely read. An earlier design note in bean `79t3` listed it alongside
`sushi-config.yaml` as "not ours to rename"; that is wrong for `dak.json` and
still right for `sushi-config.yaml`, whose name the SUSHI tool owns.

So `dak.json` is a marker we migrate **in**, not around.

## Landed now — the placeholder

`schemas/dak.ts` + `schemas/dak.test.ts` (11 tests). It models what is settled
and refuses to model what is not:

- `DAK_MARKER_FILENAME = "dak.json"` — presence at a repo root declares the
  repo a DAK, the same way `cat-harness.json` declares a harness instance.
- `DAK_TYPE` → `http://smart.who.int/base/StructureDefinition/DAK`, WHO's own
  logical model, via the existing `SMART_BASE_NS`.
- Identity and publication: `name`, `canonicalUrl`, `publicationUrl`,
  `previewUrl`, plus `title`/`description` from `kgNodeLabelShape`.
- The nine components: **cardinality enforced, element shape not**. Each is
  `0..* <Name>Source` in `smart-base`'s `input/fsh/models/DAK.fsh`; the array
  is final, the element is pending, so the element is `unknown` and carried
  through byte-identical.
- **Passthrough.** Unknown keys survive a parse-and-write round trip. A
  placeholder that dropped fields it had not learned about would destroy data
  from a real DAK on the first tool that read and rewrote one.
- The component shape is BUILT from `DAK_COMPONENT_FIELDS` in
  `schemas/block-kinds.ts`, not restated, so the two cannot drift.
- `populatedComponents` keeps three states apart: absent, declared-and-empty,
  and populated. "Nobody has said" is not "somebody said none".

## Blocked on upstream

**WHO's DAK Logical Model is not final in FHIR.** Until it is, the element
shape of a component is unknowable and any `<Name>Source` type written here
would be a second, weaker, drifting copy of a specification about to exist —
the argument `schemas/dak-blocks.ts` already makes about
`ValueSet.compose.include`.

`scripts/tests/dak-blocks.test.ts` already checks the nine field names against
a real `DAK.fsh` when `SMART_BASE_HOME` points at a checkout, and reports
`n/a` — never a pass — when it does not. Extend that same pattern to the
element shape when the LM lands; do not invent it early.

## Still to do

1. **Fill in the element shape** once the LM is final, replacing `unknown` and
   turning the passthrough from a safety net into a narrowing choice.
2. **Wire `dak` into the type registry** so a repo carrying `dak.json` is
   recognised as a DAK instance — blocked on bean `79t3`'s two open questions
   (the marker naming convention, and precedence when two markers disagree).
3. **Formalise `sushi` and `ig`** as the other two content types a
   `smart-*` repo declares. `ig` is half-there: `l3-fhir` exists as a
   translation content type with `fsh` and `fhir-json` formats, but nothing
   declares an IG **instance**.
4. **Migrate the real repos** — `smart-base` and the `smart-*` DAKs — and
   update the skills that still describe `dak.json` as somebody else's file:
   `skills/folio-core/directory-conventions.md` §Naming cites it as an external
   model rather than as ours.

## Done when

A repository carrying `dak.json` is recognised as a DAK instance by the same
machinery that recognises a harness instance; the nine components resolve to
real typed content rather than `unknown`; and no consumer reading and
rewriting a real `dak.json` loses a field.
