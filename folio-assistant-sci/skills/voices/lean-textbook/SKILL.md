---
name: voice-lean-textbook
description: >
  Narrate a Lean library as a textbook — 9 rules, each citing the mathlib source it was read from; use with the milnor voice.
allowed-tools: Read Grep Glob
---

# Lean library as a mathematics textbook

The voice for a folio whose content is a **narration of a formal Lean library**:
a mathlib top-level library (or any Lake package) read as the knowledge graph it
already is, linearised into chapters and sections, and written as a textbook.
It is used **together with** [`milnor`](../milnor/SKILL.md): every Milnor
hallmark applies, and these rules add what narrating a formal library needs.

## What this skill is, against the rules beside it

`voice.json` carries the RULES, each with the mathlib file and verbatim quote it
was read from. This file does not restate them; it says how to use them.

## Authoring

1. Start from the outline that Tool `lean-library-ingest` writes
   (`scripts/lean-library-ingest.ts`): it is the linearisation, and every
   section already names its source module. Reorder only with a reason the
   import graph cannot see, and record the reason in the outline.
2. For each section, read the module docstring first, then the declaration
   docstrings, then the formal statements. The docstrings are provenance for
   the prose; the formal statements are what the prose must agree with.
3. Read the two `counterintuitive` rules before drafting: identifiers belong in
   source lines, and implementation belongs in formalisation asides.

## Review and QC

A finding is upheld by opening the cited file at the cited revision. Round-trip
QA for this voice is the `lean-narrative-roundtrip` check described in
[`lean-library-ingestion`](../../lean/lean-library-ingestion.md): every stated
result resolves to a declaration, and every main declaration is stated.

## Translation

The English narration is the source text for every translation. A source
document in another language (Bourbaki in French, the agrégation syllabus that
`docs/undergrad.yaml` was gathered from) is cited in its own language and is
the source language for any text drawn from it.
