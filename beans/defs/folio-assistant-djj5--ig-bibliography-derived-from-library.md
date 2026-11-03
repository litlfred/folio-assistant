---
# folio-assistant-djj5
$schema: bean/1.0.0
title: 'IG bibliographies derived from library/, not a hand-kept references/ directory'
status: todo
type: epic
priority: normal
created_at: 2026-11-03T05:32:31Z
updated_at: 2026-11-03T05:32:31Z
tags:
    - references
    - library
    - smart-base
---

Owner, 2026-11-03 (card, option 3): *"why is references/ required dir? any references that were ingested should be under library/."* Then: "sibling on 3".

## What is there now

- smart-trust, smart-trust-phw and smart-immunizations each declare a `references` directory (`folio-reference/v1` CSL-JSON, one `<key>.json` per cited work). smart-trust holds 28 entries. smart-trust-phw and smart-immunizations hold none, and their `references/` is not on disk, so `check:harness-dirs` fails ("declared and not on disk") on every re-pin train that takes their mains. Trains hold those two IGs at older pins until this is settled.
- smart-base's `check:ig-citations` checks each IG citation against that bibliography: the `references` directories plus Dublin Core records in a declared `catalogue`.
- `folio-assistant-core/schemas/reference.ts` (bean 63q4) already gives a reference a `catalogue` provenance: a reference can be projected from a catalogue's Dublin Core record (`dublinCoreToReference`) rather than written by hand.

## The question

An ingested source already lives under `library/<group>/<slug>/`, with its structure and metadata. Why keep a second, hand-kept citation record for it in `references/`?

## Done when

- [ ] A short proposal, put to the owner as a card before any code: derive each IG's bibliography (and `check:ig-citations`' entry set) from the `library/` entries it cites, keeping `references/` only for works that are not ingested, if at all. Say what CSL fields (volume, issue, pages) a library entry lacks and where they would come from.
- [ ] Once approved: the derivation, `check:ig-citations` reading it, and the three IG declarations changed to match. smart-trust-phw and smart-immunizations then no longer declare a directory they do not have.
- [ ] The next re-pin train takes both IGs at their mains again.

_2026-11-03T05:32:31Z_ — Filed by the drain session https://claude.ai/code/session_01EucfRqHzqzMjJkqcnKNkY5 on the owner's card (option 3); a sibling session picks it up.
