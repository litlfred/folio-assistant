---
# folio-assistant-yh6u
title: 'RECORDS ARE REAL JSON-LD: tabular.jsonld and contents.jsonld carry no @context, and 392 figure narratives use undeclared keys'
status: in-progress
type: bug
created_at: 2026-09-23T11:55:23Z
updated_at: 2026-09-23T11:55:23Z
parent: folio-assistant-slw1
---

Found while closing `792y`.

## What is wrong

- `folio-tabular-records/v1` (`tabular.jsonld`, written by `tabular-records.py`) and `folio-archive-contents/v1` (`contents.jsonld`, written by `archive-contents.py`) are named `.jsonld` and carry an `@id`, but have NO `@context`. A JSON-LD processor drops every key.
- Measured 2026-09-23 over the 2,926 committed content-context documents: 8 keys are undeclared — all inside the `narrative` object of 392 figure blocks (`narrative`, `state`, `drafted_by`, `drafted_at`, `file`, `id`, `model`, `session`). Every agent-drafted figure narrative is silently dropped as linked data.

## Decision (owner, 2026-09-23): option 3, real JSON-LD for both

Chosen over renaming to `.json` (option 1/2). Design:
- `@context`: the published content context, by URL.
- `$schema` -> `dcterms:conformsTo`; `format` -> `dcterms:format`; counts typed `xsd:integer`; `header_vocabulary` a set.
- Our nested structures (`narrative`, `sheets`, `entries`, `source`, `archive`) typed `@json`: verbatim, NULLS PRESERVED — the three-state rule needs `narrative.text: null` and `rows: null` to survive.
- `narrative` as `@json` also fixes the 392 figure blocks.

## Todo

- [x] declare the terms in CONTENT_CONTEXT; regenerate ns/content/v1.jsonld
- [x] both Python writers emit `@context`; a test pins the Python constant to CONTENT_CONTEXT_URL
- [x] schemas accept `@context` (optional — folio repos hold files written before this)
- [x] gate: every plain key in a content-context document is a declared term (skipping inside `@json` values); corpus at 0
- [x] skills updated (library-ingestion, kg-export; Tool node `context-prefixes`);
- [x] bun run gates green (135/135); issue #1078; PR opened

## Found on the way

- `file` on figure blocks was an 8th undeclared key, OUTSIDE the narrative. Declared as a LITERAL: it is a block-relative path, and coerced to `@id` it would resolve against `@base` to a location the image is not at.
- `text` on prose blocks has exactly that defect today — bean `589f`, not fixed here.

## Done when

Every key in every committed content-context document is a declared term, and both writers emit documents a JSON-LD processor keeps whole.
