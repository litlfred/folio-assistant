---
# folio-assistant-djj5
$schema: bean/1.0.0
title: 'IG bibliographies derived from library/, not a hand-kept references/ directory'
status: in-progress
type: epic
priority: normal
created_at: 2026-11-03T05:32:31Z
updated_at: 2026-11-03T06:17:07Z
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

_2026-11-03T05:35:56Z_ — Claimed by https://claude.ai/code/session_01EucfRodNcVYWoFyT9Zwyb3. Proposal put to the owner as a card (no code yet). Findings at the mains: phw and immz now HOLD `references/` (5 and 10 entries, all `authored`), so the "declared and not on disk" failure may already be gone at their mains; smart-trust holds 27 `.json` entries (28 files with the README), none of them ingested in any library. folio-assistant-core's bibliography page already reads `library/` (`libraryItemToReference`, provenance `library`); smart-base's `check:ig-citations` reads only `references` and `catalogue`. 5 of the 42 IG entries name works who-iris already holds (9789240010567-eng, 9789241548960-eng ×3, the IMMZ DAK 10665/380303).

_2026-11-03T05:42:02Z_ — Owner decided (card): **approach 2, "Library + catalogue only"**: an ingested work is cited from its `library/` entry; a work that is not ingested is a metadata-only `catalogue/records/<slug>.dc.json` record; `references/` is retired in all three IGs. **smart-trust's 27 entries: "Convert to catalogue"** (phw's 5 and immz's 10 likewise, minus the who-iris-held works, which are cited from who-iris). Plan: (a) core: `dublinCoreToReference` reads `dc.relation.ispartof` / `dc.citation.volume|issue|spage|epage`; a library entry with a catalogue record is projected from that record; no `ingestedAt` publication date. (b) smart-base: `check:ig-citations` reads `library` (own and `--with` layers) and `catalogue`, not `references`. (c) content PRs (owner OK): CSL→DC conversion of each IG's entries and removal of the `references` declaration.

_2026-11-03T05:44:52Z_ — Owner asked where a non-ingested work lives ("uploads/ or catalog only... what is URL of catalogue? and relation to library?"), and decided (card): **"Catalogue + uploads/ copy"**. A non-ingested cited work = a `catalogue/nodes/item-<slug>.json` in state `referenced` (no `libraryId`) with `metadataRef` → `catalogue/records/<slug>.dc.json`, PLUS a capture in `uploads/` queued for later ingestion; citations resolve through the record only. Answered: the catalogue has no page of its own (no visualiser covers `catalogue` alone); each record renders on the KG Bibliography as `#ref-<slug>`; a reference's IRI is `references/<key>` under the folio base (cat-harness-tools `resolveReferenceKey`) and stays unchanged. Open per capture: its licence; a capture is recorded with its role, as who-iris does.

_2026-11-03T05:47:38Z_ — Step (a) up: litlfred/folio-assistant-core#628 (DC ↔ CSL keeps container/volume/issue/pages via `dc.relation.ispartof`, `dc.citation.*`; CSL-spelled `dc.type` kept; `contributor.editor`; no `ingestedAt` publication date). 680 tests pass in the index checkout. Step (b), smart-base `check:ig-citations` reading `library` + `catalogue`, is BLOCKED: this session was refused push access to litlfred/smart-base (add_repo denied by the session's permission classifier); it has a read-only clone at db7f311.

_2026-11-03T05:49:36Z_ — Owner granted smart-base access (card: "Grant smart-base"). Step (b) up: branch `claude/djj5-ig-citations-library` on litlfred/smart-base — `check:ig-citations` reads `library` entries (slug key; manifest `sourceUrl`/`meta.doi`; ISBN in slug); a library alone is not adoption; `references` still read until the content PRs retire it. 10 tests pass; the check on the three IG mains gives 0 findings before and after. Next: step (c), the content PRs (owner OK needed).

_2026-11-03T05:50:41Z_ — smart-base#298 opened and watched. Owner decided (card): content work is **one PR per IG**, records and `uploads/` copies together (the declaration change waits on the licence checks). Starting with smart-trust-phw (5 entries).

_2026-11-03T05:54:22Z_ — Content PR 1/3 up, awaiting owner OK: litlfred/smart-trust-phw#30. 5 entries → `catalogue/records/<key>.dc.json` (keys kept) + referenced item nodes + `uploads/<key>/intake.json`; `references` declaration dropped, `smart-trust-phw-uploads` declared. No capture bytes committed: a CC link on a WHO product page is the publication's licence, not the page's, so it is recorded as evidence, not taken as permission. `check:ig-citations` (smart-base#298 branch): 0 findings; `check-catalogue`: clean. The converter is in this session's scratchpad (references-to-catalogue.ts); smart-trust (27) and smart-immunizations (10) next.

_2026-11-03T05:59:21Z_ — Content PRs 2/3 and 3/3 up, awaiting owner OK: litlfred/smart-immunizations#111 (10 entries; new `smart-immunizations-catalogue`, `smart-immunizations-uploads` declared; IMMZ DAK node carries handle 10665/380303) and litlfred/smart-trust#139 (27 entries; `smart-trust-uploads` declared). core#628 also gained `publisher-place`, `accessed`, `version`, `status` ↔ `dc.publisher.place`, `dc.date.accessed`, `dc.citation.version|status` (681 tests), because smart-trust's entries carry them. smart-trust captures: 7 captured (no bytes committed), 15 refused by this session's network policy (proxy CONNECT 403), 3 refused by host, 2 no URL; each intake records it. All three IGs: `check:ig-citations` 0 findings from catalogue alone; `check-catalogue` clean. Re-pin consequence: folio-assistant `index.config.json` override for smart-trust lists `references`; drain session told.

_2026-11-03T06:00:51Z_ — Owner approved (card, option 1 "Approve all once green"): smart-trust-phw#30, smart-immunizations#111 and smart-trust#139 merge once CI is green, with no copy bytes committed; licences and the 15 network-blocked smart-trust captures are handled later, one by one. None touches subscriptions/.

_2026-11-03T06:17:07Z_ — smart-trust-phw#30 CI: one new failure, `readme:subgraphs:check` (catalogue/README.md stale, uploads/ had none). Fixed on all three content PRs by regenerating those two READMEs (phw 621f1ad, immz 089e370, smart-trust e1c4459). smart-trust main already has 6 stale READMEs in other directories; the branch leaves those 5 untouched (not this change).
