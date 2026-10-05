---
title: "SMART document kinds: L1 and DAK"
kind: proposal
issue: 1767
summary: >-
  Stage D5 of the smart-* separation. L1 and DAK stop being harness layers and
  become DOCUMENT KINDS inside smart-base — a declared structure of sections,
  fixed (DAK: the ten components) or semi-fixed (L1) — with a viewer for each.
  The mechanism is generic and names no WHO; the two kinds are smart-base's
  data. Bean qvxh; the DTH subtype is bean 5blc.
---

# SMART document kinds: L1 and DAK

Owner, 2026-10-01 (#1767), reframing `smart-l1` and `smart-dak`:

> *"what they really need to be are sub-document types/kinds/visualizer for
> them. smart-L1 is like a L1 document that was fully computable from
> smart-base assets (and maybe some other things like PICO, cochrane, etc),
> semi fixed structure … similarly DAK is a publication type w/ the 10
> components, fixed structure."*

Then: retire `smart-l1/` and `smart-dak/`, keep `smart-ig/` (stage D3), and
D5 as its own PR. Later the same day, the owner added the Digital
Transformation Handbook as a specific kind of L1 document *"that uses the
Reference Architecture and DIIG concepts"* (bean `5blc`).

## What was measured before designing

- **A content PROFILE is the wrong mechanism.** `CONTENT_PROFILES =
  ["document", "paper"]` is a compile-time union in core
  (`cat-harness/schemas/block-kinds.ts`), and profiles say which BLOCK KINDS a
  folio may contain. A DAK is not "a folio that may contain kinds X"; it is a
  publication whose STRUCTURE is fixed. And a `dak` profile would be core naming
  DAK again — the coupling bean `1335` exists to remove.
- **The chapter-profile registry is not it either**: it is the paper's q-regime
  policy, specific to one folio.
- **The ten components exist once already**: `DAK_COMPONENTS` in core's
  `block-kinds.ts` (moving with bean `1335`), and `dak.ts` (now smart-base)
  reads a `dak.config.json` by them.
- **Nothing exists for L1.** smart-base's `library/` holds 8 WHO publications
  (DIIG 9789240010567, the primary-health-care DTH 9789240093362, Mehl 2021 on
  SMART Guidelines, …). Which sections an L1 document has is not written down
  anywhere in this repository yet.

## The design

### 1. A generic `document-kind` graph typology (core, names no WHO)

A harness may declare **document kinds**: named structures a document authored
with that harness follows. One schema, `folio-document-kind/v1`:

| field | meaning |
|---|---|
| `id`, `title` | the kind |
| `structure` | `fixed` (every section required, no others) or `semi-fixed` (required sections, others allowed) |
| `extends` | an optional parent kind — a DTH extends L1 |
| `sections[]` | `{ id, title, required, description, computedFrom? }` — `computedFrom` names the declared graphs a section is derived from (e.g. `library`), so "computable from smart-base assets" is a checkable claim |
| `sources[]` | where the structure itself comes from — a library entry and section — so a kind is never invented |

It is a graph typology like `themes` or `voices`: declared in an instance's
`<instance>.json`, validated by `check:kind-validators`, rendered by a viewer
Tool. **Core knows that document kinds exist; it never knows which.**

### 2. The two kinds are smart-base's data (`smart-base/document-kinds/`)

- **`dak.json`** — `structure: fixed`, ten sections, one per DAK component.
  **Generated** from `DAK_COMPONENTS` by a script with a `:check` gate, so the
  ten are stated once. Sources: the WHO DAK guidance already cited at
  `DAK_COMPONENTS`.
- **`l1.json`** — `structure: semi-fixed`. Its required sections are **the open
  question below**; they are read from a source, not assumed.
- **`dth.json`** — `extends: l1`, adding the Reference Architecture and DIIG
  sections the handbooks use. Bean `5blc`, after the handbooks are ingested
  (bean `tyo0`).

### 3. The viewers

- **Per kind**: `/smart-base/document-kinds/<kind>/` — the structure, each
  section's description, `computedFrom`, and sources.
- **A DAK view of every ingested IG** — computed, not authored: each
  artefact in an IG's `fhir-artifact-index` is assigned to the DAK component it
  realises by its FHIR resource type (`ActorDefinition` → personas,
  `Requirements` → requirements, `PlanDefinition`/`Library` → decision support,
  `Measure` → indicators, logical models → core data elements, …). An artefact
  no rule places is shown as **unplaced**, never dropped. The mapping is WHO
  knowledge, so it is smart-base's, beside the kind.

### 4. What validates a document against its kind

Deferred until a real L1 or DAK document is authored here — a checker with no
subject is the `dh4f` shape. The schema makes it possible; the first folio that
declares a kind brings the check.

## Questions for the owner

1. **L1's required sections — from which source?** Options: the SMART
   Guidelines paper (Mehl 2021, in the library) on what L1 is; a WHO guideline
   handbook's chapter structure (recommendations, evidence, PICO, GRADE); or
   the DTH structure, with plain L1 as its generalisation.
2. **The DAK view's resource-type → component mapping** — computed as above,
   with unplaced artefacts shown. OK, or should an IG's own `dak.config.json`
   be the only source of component membership?

## Decided

Owner, 2026-10-01:

- **Q1 → all three sources.** L1's required sections are drawn from the SMART
  Guidelines paper (Mehl 2021), the WHO guideline-development handbook, and the
  DTHs' shared structure, and **each section records which of them it comes
  from** in `sources[]`. The handbook and the DTHs are ingested first (bean
  `tyo0`), so `l1.json` lands in D5d.
- **Q2 → computed from resource type**, with every artefact no rule places shown
  as unplaced.

### D5d, 2026-10-02

- **Three L1 kinds, not two.** Mehl 2021 defines L1 as *"traditional guidelines
  and guidance"*, and the evidence agrees: the WHO guideline handbook (§12.1
  "Guideline format") and the three DTHs share only a frame — introduction, how
  it was developed, contributors, references, annexes. A DTH has no
  recommendations, no PICO and no GRADE. So `l1` is that frame, and
  `l1-guideline` and `dth` each `extends: l1` with their own body. A `dth` that
  extended a guideline-shaped `l1` would have required recommendations no DTH
  has.
- **smart-kg is pinned, not copied** (owner: *"utilize
  https://github.com/litlfred/smart-kg for L1 related stuff"*, *"perhaps
  subgraph in smart-base"*; and 2026-09-23, bean `wg7r`, *"that is its own repo
  already"*). `smart-base/external-schemas/who-smart-kg.json` pins a commit;
  `who-smart-kg.terms.json` holds its L1 and L2 class ids, derived by
  `smart-base/scripts/pin-smart-kg.ts`. A section names what it instantiates
  with `modelledBy` (`sgkg-l1#recommendation`), and
  `smart-base:document-kinds:check` fails on a term not in the pin, an
  `extends` that names no kind, a loop, or a child redeclaring its parent's
  section. Bean `pebe`; feeding smart-kg instance documents is bean `8pzh`.
- **A finding the mapping surfaced:** guideline sections map onto smart-kg
  **L1** classes, DTH sections onto **L2** (DAK) classes — persona, user
  scenario, business process, data element, requirements. A DTH states for a
  health-system area what a DAK states for a guideline.
- **Where a DTH sits in the DIIG.** The primary health care DTH places itself
  in DIIG Phase 5, *"Determining health content requirements"*; the Reference
  Architecture's Figure 1 puts the supply chain and product catalogue DTHs in
  Phase 7 and itself across Phases 1–4. No ingested DTH cites the Reference
  Architecture; `dth`'s `architecture` section cites it (Figure 3.2) as the
  owner's rule requires. `smart-base/methodologies/diig.md` models the DIIG's
  nine chapters and not these seven phases — recorded, not changed here.

## Staging

| step | what |
|---|---|
| D5a | this note; the `document-kind` schema + graph typology + registry entry in core |
| D5b | `smart-base/document-kinds/dak.json` generated from `DAK_COMPONENTS` + its gate; the per-kind viewer |
| D5c | the DAK view of each ingested IG (smart-trust, smart-base, smart-immunizations) |
| D5d | `l1.json`, `l1-guideline.json`, `dth.json`, authored from the sources; the smart-kg pin (bean `pebe`) |
