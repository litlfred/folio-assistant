---
name: voice-who-digital-transformation-handbook
description: >
  Write and review digital transformation handbook prose in the DTHs' own register — 9 rules, each citing the handbook section it was read from.
allowed-tools: Read Grep Glob
---

# WHO Digital Transformation Handbook

The register of WHO's Digital Transformation Handbooks (DTHs): the guidance
publications that take one area of a health system from paper to digital within
the DIIG process. Derived rule by rule from the three DTHs and the draft DPI-H
Reference Architecture ingested in `smart-base/library/`; every rule cites the
section it was read from.

## What this file is, against the rules beside it

`voice.json` in this directory carries the RULES — each with the publication,
section and verbatim quote it was read from. **This file does not restate
them**: a rule written here as prose beside the same rule written there as data
is one fact in two places, and the prose copy is the one carrying no citation.
To know what the rules are, read `voice.json`, or run `bun run check:voices`.

What this file is for is how to USE them.

## Why this voice exists beside `who-digital-health`

`who-digital-health` is the vocabulary of the **classification** — what a
digital health intervention is, and how CDISAH names itself. This voice is the
vocabulary of the **handbooks** that apply it to one area of a health system:
the sequence a digitalisation goes through, the systems and data it builds, and
the architecture it should sit in. They overlap on purpose, and where they
would disagree the conflict is recorded rather than resolved here (below).

The `dth` document kind (added by #1830) is the
STRUCTURE of a DTH; this voice is its LANGUAGE. A section can follow the kind
and still read wrong.

## Authoring

**Read the `counterintuitive` rules before you draft.** Each carries a
`commonError` naming the instinct it corrects, and those instincts are the
ones most often wrong in practice. Read them in `voice.json` rather than from a
summary here: a pair restated in this file would have no pattern behind it.

## Two rules rest on a DRAFT

The DPI-H Reference Architecture in the library is **DRAFT V1.0, for public
comment**. The two rules read from it say so in their description, and the
draft is internally inconsistent in places (it expands DPI-H two ways). When
the published edition is ingested, re-check those two rules against it before
upholding a finding on them.

## Review and QC

**A finding against this voice is upheld by opening the cited section, never by
trusting the rule's wording.** Every rule names `{ libraryId, sectionId, pages,
quote }` and resolves into `smart-base/library/`, and `check:voices` refuses a
rule whose citation does not resolve.

## What this voice does not do

**It does not settle what to call the people a health system serves.** The
primary health care DTH says *health service user*, the draft Reference
Architecture says *client*, and `who-digital-health` upholds CDISAH's *Persons*.
A rule for it was drafted and held back: one group under three labels across
three WHO texts is the owner's call, not a voice's (bean `5blc`).

**It does not police ordinary English.** Each terminology rule is scoped by its
`context`; applying a handbook term outside the handbook's subject is how a
controlled vocabulary becomes a shibboleth.
