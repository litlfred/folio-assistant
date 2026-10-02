---
# folio-assistant-yh6u
title: 'RECORDS ARE REAL JSON-LD: tabular.jsonld and contents.jsonld carry no @context, and 392 figure narratives use undeclared keys'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T11:55:23Z
updated_at: 2026-09-23T12:13:09Z
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

## Summary of Changes

PR #1079, merged on the owner's "merge it" (2026-09-23). Issue #1078.

- `tabular.jsonld` and `contents.jsonld` are real JSON-LD: both Python arms emit the published content `@context`, from one shared `scripts/_content_context.py` pinned to `CONTENT_CONTEXT_URL` by a test. The schemas accept an optional `@context` (older folio records) and reject any other.
- `CONTENT_CONTEXT` declares every key those records write: queryable facts as real terms (`dcterms:conformsTo`, `dcterms:format`, integer counts, `header_vocabulary` as a set, `headers` as a list); our nested structures (`narrative`, `sheets`, `entries`, technical metadata) as `@json`, so their three-state nulls survive.
- The same declarations fixed **392 committed figure blocks** whose narratives were being dropped; `file` declared as a LITERAL (block-relative path).
- New gate `checkDeclaredKeys` in `check:context-emission`: every plain key in a content-context document is a declared term. 2,926 documents, 0 undeclared. Falsified both ways.
- Skills `library-ingestion` and `kg-export`; Tool node `context-prefixes`.

Filed, not fixed: `589f` — `text` on prose blocks resolves against `@base` to the wrong location.
