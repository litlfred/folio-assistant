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

### 1. A generic `document-kind` graph kind (core, names no WHO)

A harness may declare **document kinds**: named structures a document authored
with that harness follows. One schema, `folio-document-kind/v1`:

| field | meaning |
|---|---|
| `id`, `title` | the kind |
| `structure` | `fixed` (every section required, no others) or `semi-fixed` (required sections, others allowed) |
| `extends` | an optional parent kind — a DTH extends L1 |
| `sections[]` | `{ id, title, required, description, computedFrom? }` — `computedFrom` names the declared graphs a section is derived from (e.g. `library`), so "computable from smart-base assets" is a checkable claim |
| `sources[]` | where the structure itself comes from — a library entry and section — so a kind is never invented |

It is a graph kind like `themes` or `voices`: declared in an instance's
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

## Staging

| step | what |
|---|---|
| D5a | this note; the `document-kind` schema + graph kind + registry entry in core |
| D5b | `smart-base/document-kinds/dak.json` generated from `DAK_COMPONENTS` + its gate; the per-kind viewer |
| D5c | the DAK view of each ingested IG (smart-trust, smart-base, smart-immunizations) |
| D5d | `l1.json` once Q1 is answered; `dth.json` with bean `5blc` |
