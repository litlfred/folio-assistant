---
# folio-assistant-589f
title: 'TEXT LINKS RESOLVE WRONG: `text` is coerced to @id, so ../sections/x.md resolves against @base, not the block'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T11:57:40Z
updated_at: 2026-09-23T13:24:28Z
parent: folio-assistant-zzmr
---

Found by `yh6u` while declaring `file` (2026-09-23).

## What is wrong

`CONTENT_CONTEXT` declares `text: {"@id": "folio-assistant-core:text", "@type": "@id"}`. Prose blocks write `text: "../sections/sec-001-introduction.md"` — a path RELATIVE TO THE BLOCK. Under `@id` coercion a JSON-LD processor resolves it against the context's `@base` (`https://litlfred.github.io/folio/`), giving `https://litlfred.github.io/sections/sec-001-introduction.md` — which is not where the file is. Every prose block's `text` link is a well-formed IRI that dereferences to nothing.

`yh6u` declared the sibling `file` (a figure's image path) as a LITERAL for exactly this reason, per kg-export's rule that a path stays a literal. It did not change `text`, which has many consumers.

## Options (the owner's call)

1. Make `text` a literal too — honest, loses nothing a processor currently gets right.
2. Emit `text` as an absolute IRI minted by the generator (the block's own IRI + the relative path), keeping it a link.
3. Emit `@base` per document equal to the block's own directory — invasive; changes every relative `@id`.

## Decision (owner, 2026-09-23): literal now + an upgrade rule — for the least drift

Asked which option is best for long-term management, the owner chose literals
with a recorded trigger over minting IRIs now (nothing serves the files at a
declared URL, so any link would be a promise nothing keeps) or a per-document
`@base` (a large migration, and a silent failure wherever one is omitted).

Measured: `text` carries a path on 1,323 committed blocks (1,174 `../…`, 149
bare `x.md`); every other `@id` term holds node ids only. `leanSource` has the
same declaration and no committed values yet.

## Todo

- [x] `text` and `leanSource` declared literals (context only — nothing regenerated, no reader changes)
- [x] gate `checkPathsAreNotLinks` in `check:context-emission`: a file path under any `@id` term fails; falsified by restoring the old declaration
- [x] the upgrade rule recorded in `schemas/jsonld.ts` and skill `kg-export`
- [x] bun run gates green (135/135); issue #1084; PR opened

## Done when

A prose block's `text`, expanded by a JSON-LD processor, names the section file's real location — or is a literal that does not pretend to.

## Summary of Changes

PR #1085, merged on the owner's "merge it" (2026-09-23). Issue #1084.

- `text` and `leanSource` declared LITERALS in `CONTENT_CONTEXT`: their values are document-relative paths, and under `@id` a processor resolved them against `@base` — `../sections/x.md` became a link to nowhere on all 1,323 committed prose blocks. Context-only: nothing regenerated, no reader changed.
- The owner's upgrade rule, chosen for the least drift, recorded in `schemas/jsonld.ts` and skill `kg-export`: these become absolute IRIs minted by the one block-IRI function when, and only when, the files are served at a URL an instance declares.
- New gate `checkPathsAreNotLinks` in `check:context-emission`: a file path under any `@id` term fails. Falsified by restoring the old declaration.
