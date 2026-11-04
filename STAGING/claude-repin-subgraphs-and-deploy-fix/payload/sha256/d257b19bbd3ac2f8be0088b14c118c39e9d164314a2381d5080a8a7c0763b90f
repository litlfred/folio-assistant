---
# folio-assistant-djj5
$schema: bean/1.0.0
title: 'IG bibliographies derived from library/, not a hand-kept references/ directory'
status: in-progress
type: epic
priority: normal
created_at: 2026-11-03T05:32:31Z
updated_at: 2026-11-04T07:03:12Z
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

- [x] A short proposal, put to the owner as a card before any code: derive each IG's bibliography (and `check:ig-citations`' entry set) from the `library/` entries it cites, keeping `references/` only for works that are not ingested, if at all. Say what CSL fields (volume, issue, pages) a library entry lacks and where they would come from.
- [x] Once approved: the derivation, `check:ig-citations` reading it, and the three IG declarations changed to match. smart-trust-phw and smart-immunizations then no longer declare a directory they do not have.
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

_2026-11-03T06:44:07Z_ — **Merged:** folio-assistant-core#628; smart-trust-phw#30 (5bec992) and smart-trust#139 (388fcf3), green, on the owner's approval. smart-trust-phw no longer declares `references`. **Open:** smart-immunizations#111 is red on `translation:block-qa:check` (missing translations in the mounted platform `docs/`, not this diff); re-run once and commented. smart-base#298 is red on `check:reference-direction:check` (7 findings in mounted platform files against the recorded qa-reports baseline; passes locally on main and branch); the re-run failed the same way, so it is blocked on the platform repositories, not on smart-base.

_2026-11-03T06:51:37Z_ — Drain session confirms train fa#2923 takes smart-trust-phw and smart-immunizations at their mains (check:harness-dirs passes). smart-immunizations#111: main moved 3 commits (publish-qa.yml, `.gitignore` now ignores `/test/results/`, where the failing translation-qa sidecars live); merged main into the branch (65b6979), CI re-running. smart-base#298: red twice on `check:reference-direction:check`. smart-base main's own post-merge QA at db7f311 is red (dth-terms, processes:render), so no fresh baseline was published and PRs compare against qa-reports main/97d2e40; the 7 findings are in mounted platform files and come from platform moves since that baseline. Nothing merged depends on #298 (the IGs now cite catalogue records, which the check already reads). Owner asked whether to hold or merge.

_2026-11-03T07:07:10Z_ — Owner (card): "Merge now" → **smart-base#298 merged (c2922bb)** over the inherited `check:reference-direction` red. Then owner: "fix platform files". Finding: the 7 flagged references are already gone from the platform mains (cat-harness-tools 750d74c, bootstrap-tools aa25987, folio-assistant-core main: `figure-rebuild.md` no longer names who-iris or fhir-harness; the other five files name none of the flagged instances). They remain only at smart-base's pinned platform commits, and the standing re-pin consent is "All except smart-base", so the train does not move them. smart-immunizations#111: merged main (65b6979); new red `check:qa-reviewer-permission` is "could not determine" (QA corpus not restored in CI); passes locally on main and branch; re-run once, commented.

_2026-11-03T07:19:17Z_ — Owner (card): "Re-pin smart-base". Opened litlfred/smart-base#300: all 7 platform mounts re-pinned to their mains with consent recorded per pin; workflow refs move to the locked commits; ci.yml ghbuild caller kept. At the new pins `check-reference-direction --findings` reports none of the 7. Watching; merges on green (non-content).

_2026-11-03T07:41:35Z_ — **smart-base#300 merged (67f4edc)**, green: smart-base pins the platform mains, so the 7 reference-direction findings are gone. smart-immunizations#111 failed `check:qa-reviewer-permission` twice on 65b6979 ("could not determine": `cat-harness/test/results` absent in CI); it passes locally on main and the branch; the diff touches nothing that gate reads. Put to the owner.

_2026-11-03T08:33:16Z_ — Defect in smart-trust#139, found by folio-assistant#2924 (session_01EucfRp9ycxtZrrBKaipNy5): 20 intakes declared `files: []`, which the library graph rejects (viz-generators.test.ts, declaredFiles > 0). Fix: litlfred/smart-trust#140 removes them and records each failed attempt in its catalogue node; records and citations unchanged; checks clean. Content PR: owner asked.

_2026-11-03T09:23:29Z_ — Owner: "uploads/ only should exist in fol-asst… should have Tools"; then (card): **"instantiated harnesses can have an uploads/ but that is data store for that repo, not part of the KG"**. My djj5 declarations of `uploads/` as a KG directory (graph typology `uploads`) in the three IGs were wrong: they made folio-assistant mount them and tripped check:state-on-main. Fixes: smart-trust#140 (c85a5c4: declaration removed + 20 empty intakes), smart-trust-phw#31 (8f48b6a), smart-immunizations#111 (85f02ba). The intakes stay as repository data. who-iris still declares `who-iris-uploads` (predates djj5; left as is, noted for the owner). All three are content PRs awaiting owner OK.

_2026-11-03T11:07:39Z_ — Owner (card): merge #111, #140, #31 each when green. **smart-immunizations#111 merged (9675397)**. #140 and #31 CI running.

_2026-11-03T11:08:23Z_ — **smart-trust#140 merged (a094f18)** and **smart-trust-phw#31 merged (d0d0394)**, green, on the owner's OK. All djj5 PRs are merged: folio-assistant-core#628, smart-base#298, #300, smart-trust-phw#30, #31, smart-trust#139, #140, smart-immunizations#111. No IG declares `references` or `uploads`; bibliographies are catalogue records; `uploads/` is repository data (owner, 2026-11-03). Drain session given the merge commits for folio-assistant#2924. Remaining: the third "Done when" (the next re-pin train takes both IGs at their mains) is the drain session's; captures for the 18 failed and 7 unlicensed works wait on licences and network access, one by one.

_2026-11-03T11:34:46Z_ — folio-assistant#2924 (drain session) fails Feature Staging. (2) `check:duplicate-ids` on the combined bibliography: same key in two IG catalogues. Fixed in litlfred/folio-assistant-core#630 (per-page unique anchors; first keeps `ref-<key>`), watching, merges on green. (1) dead links `/smart-trust/en/folio-assistant-core/bibliography/` (1680) and `/smart-immunizations/...` (48): the IG pages link the bibliography relative to their own site root (check:ig-citations convention) and no writer builds a per-IG bibliography in the composed index site; smart-trust linked it at the old pin too, so not caused by djj5. Design question put to the owner.

_2026-11-03T11:51:23Z_ — Owner (card): **build a bibliography page per IG**. folio-assistant-core#630 (2734d7b) adds `bibliography:page --instance <name> --site <dir>`: the instance and the layers it needs, own = it, permalinks under `/<name>/`; measured on smart-trust: 166 refs, page at /smart-trust/en/folio-assistant-core/bibliography/, no repeated id. 22 tests pass. folio-assistant needs one feature-staging step per IG in `_ig-list.txt`, landing with the core re-pin; sent to the drain session for #2924.

_2026-11-03T12:15:50Z_ — **folio-assistant-core#630 merged (91dcc59)**, green: per-page unique bibliography anchors and `bibliography:page --instance`. The drain session (session_01EucfRp9ycxtZrrBKaipNy5) re-pins core in folio-assistant#2924 to it, with the per-IG bibliography step in feature-staging.yml and docs-site.yml (between the IG compose step and the Jekyll build). It confirmed the per-IG dead links were pre-existing and report-only; check:duplicate-ids was the gating failure.

_2026-11-03T12:47:39Z_ — Follow-ups found by the #2924 re-pin to core 91dcc59, opened by the drain session: folio-assistant-core#631 (my `/smart-trust` example in the `outputs()` doc comment named a higher layer; now `<instance>`; check:reference-direction) and cat-harness-tools#1447 (core's new glossary.json in the standalone fixture). Agreed; the drain session re-pins both in #2924.

_2026-11-03T15:31:12Z_ — Owner: "Fix who Iris uploads too". litlfred/who-iris#176 (e04d239) drops the `who-iris-uploads` declaration and its generated README; intakes stay as repository data. Watching; merges on green.

_2026-11-03T15:42:15Z_ — who-iris#176 needs a matching cat-harness-tools change: `test/coordinator/navbar-checkout.test.ts` lists who-iris's declared kinds and includes `uploads` (twice). This session was refused push access to cat-harness-tools (add_repo denied by the permission classifier), so the two-line patch went to the drain session to open. #176 is held until that PR is green, so a train takes both together.

_2026-11-03T15:46:20Z_ — Owner (card): allow cat-harness-tools. litlfred/cat-harness-tools#1453 (d08ebde, stacked on #1452's attestations commit) drops `uploads` from both who-iris lists in navbar-checkout.test.ts; 8 pass with who-iris#176's declaration. who-iris#176 merges together with it.

_2026-11-03T15:54:51Z_ — who-iris#176 CI red on two gates caused by the change: `check:state-on-main` (stale `who-iris::who-iris-uploads` baseline line) and `check:reference-direction` (two now-undeclared intakes name smart-base and smart-immunizations as provenance). Both fixed in cat-harness-tools#1453 (ef1a501): baseline line removed; exemption `INSTANCE_UPLOADS_DATA` for `<instance>/uploads/` quoting the owner's ruling; 135 tests pass. Order: #1452 → #1453 → #176 re-pins who-iris's cat-harness-tools to #1453's merge.

_2026-11-03T16:13:41Z_ — cat-harness-tools#1453: the navbar-checkout `uploads` removal failed its own CI, because that test reads who-iris at the commit cat-harness-tools mounts (still declaring uploads). Reverted in 16f23c3; #1453 now carries only what who-iris#176 needs first (the `INSTANCE_UPLOADS_DATA` exemption and the state-on-main baseline line). Order: #1452 → #1453 → #176 re-pins its cat-harness-tools → the navbar edit lands with the re-pin that takes #176.

_2026-11-04T06:51:32Z_ — Resumed (relayed by session_01EucfRoX2s5Q9rHUMB8HHbH). cat-harness-tools#1453 still failed the two navbar assertions, because it carried #1452's `attestations` edit too, and cat-harness-tools CI mounts a who-iris older than who-iris#175. Rebuilt the branch as main + 3326ce9 (exemption, its tests, the state-on-main baseline line; navbar test untouched); force-pushed over my own 16f23c3 only.

_2026-11-04T07:03:12Z_ — Owner: "Repin and merge when needed and ready for the next 3 hours". **cat-harness-tools#1453 merged (42af00b)**, green. who-iris#176: merged main, re-pinned cat-harness-tools to 42af00b with consent recorded (f783f7d); CI running; merges on green.

_2026-11-04T12:54Z_ — who-iris#176 still red: layer-mode CI mounts the folio-assistant index lock (cat-harness-tools d5c25d7, pre-#1453), not who-iris's own pin. Re-pin train folio-assistant#2935 moves it to 5e1644e (includes #1453). The remaining check:declared-dirs finding (undeclared-state uploads/) is fixed in the platform by cat-harness-tools#1468, under the owner's 2026-11-03 uploads ruling.
