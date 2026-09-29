---
# folio-assistant-cz17
title: 'Migrate dak.json in: the DAK type is ours, and its Logical Model is pending upstream'
status: todo
type: task
created_at: 2026-09-18T21:36:56Z
updated_at: 2026-09-19T06:55:21Z
parent: folio-assistant-0lmb
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

- **waits on:** WHO's DAK Logical Model being final in FHIR — an external standards body
- **since:** 2026-09-20
- **expires:** 2026-09-29 — a REVIEW date, not a takeover date; see the handoff
- **handoff:** do NOT take this over on expiry. Re-ask whether the Logical Model has landed; if it has not, move the date out again and say so. Writing a `<Name>Source` type before it exists is the drifting second copy this bean was opened to prevent.


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

_2026-09-19T06:55:21Z_ — USER STORIES BELONG TO THIS BEAN, DEFERRED HERE DELIBERATELY BY THE OWNER, 2026-09-19: 'do not adopt SGUserStory now. bean for later as part of bean to get datamodel for DAK. we can relate them later.' The finding arrived while designing bootstrap/ (bean x3bd) and is recorded in full there; this is its home, because it is a DAK data-model question and not a bootstrap one.

WHAT WAS FOUND, so this bean does not have to re-derive it. Measured 2026-09-19 against a fresh shallow clone of WorldHealthOrganization/smart-base. (1) input/fsh/extensions/SGUserStory.fsh EXISTS and is two fields: `extension contains SGString named capability 1..1` and `SGString named benefit 1..1`, described as 'As a Actor I want to capability so that benefit'. It names no actor because it is an EXTENSION attached to something that already has one — attaching rather than declaring is what makes two fields sufficient. (2) It attaches to SGRequirements (input/resources/StructureDefinition-SGRequirements.json), which profiles FHIR Requirements and adds exactly three extensions: SGTask, Satisfies, SGUserStory. Base FHIR Requirements supplies `actor` (0..* canonical to ActorDefinition) and `statement` (key, label, conformance, requirement, satisfiedBy). So role, task, satisfies and story are one resource, and none of it needed a new type. (3) smart-base MODELS A SKILL AS A REQUIREMENTS INSTANCE — input/fsh/actors/SGAuthoring.Skills.*.fsh (ReviewAndApproveContent, L2Authoring, L3Authoring, ContentReview, Translation, Publication, ProjectManagement), each with actor pointing at an SGAuthoring.Persona.*, extension[task] codings, one extension[userstory], and numbered statements. OUR Skill is the instruction body and our Role carries skills[]; these are compatible but NOT the same node, and that mismatch is the thing most likely to bite an import.

AND WE HAVE ALREADY REBUILT MOST OF SGRequirements WITHOUT THE LABEL. skills/requirements/*.json here — seven files, agent-workflow.json at the root of the lattice — carry { id, title, description, actors[], statements[{ key, label, conformance, requirement, satisfiedBy[{kind, ref}] }] }. That is FHIR Requirements field for field, conformance codes included, arrived at independently. WHAT IS MISSING IS EXACTLY THE TWO EXTENSIONS: no task, no user story. So adopting later is two optional fields on a schema that already exists, not a new node kind, directory, builder, viewer or QA family.

THE DECISION DEFERRED, in the owner's words 'we can relate them later': whether to adopt SGUserStory's IRI (http://smart.who.int/base/StructureDefinition/SGUserStory) or mint a folio term and assert an equivalence. Adopting makes a DAK folio's stories literally the same objects as ours; minting keeps the harness free of a WHO dependency, which is the direction rule enforced everywhere else in this repo. Note that this bean has already taken the ADOPT side once, for a different object and with a stated reason — DAK_TYPE points at http://smart.who.int/base/StructureDefinition/DAK via SMART_BASE_NS, because the DAK logical model is WHO's. Whether the same argument carries to a user story is the open question: a DAK is WHO's concept, a user story is not.

WORTH LIFTING WHENEVER THIS IS PICKED UP, independent of the IRI decision: input/fsh/models/UserScenario.fsh writes `description[x] 1..1 string or uri` — the markdown inline OR a URI to a markdown file relative to the repository root. That is 'brief in the schema, rich in the docs' made STRUCTURAL rather than editorial, and it is the same problem the folio README split (generated markers vs authored prose) solves a different way.
