---
# folio-assistant-8pzh
$schema: bean/1.0.0
title: 'smart-base: extract smart-kg L1 instance documents (publication, section, recommendation) from ingested guideline PDFs'
status: completed
type: task
priority: normal
created_at: 2026-10-02T06:16:07Z
updated_at: 2026-10-23T13:45:00Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-02 (#1767), option 2 of the smart-kg fold-in: feed smart-kg. smart-kg's README says 'Not built yet: no PDF extractor, so publication and recommendation nodes must currently be authored by hand.' folio-assistant's ingest pipeline already produces sections, outline and page text for each library entry. Build a smart-base tool that turns one ingested guideline (e.g. who-iris/library/9789241548960-eng, or a smart-base L1 publication) into a smart-kg L1 graph document, validated with smart-kg's tools/validate.mjs at the pinned commit (bean pebe).

Rules carried from smart-kg docs/SCOPE.md and STORAGE.md: no instance data is committed to smart-kg; a recommendation's verbatim text, GRADE strength and certainty are READ from the source, never inferred; a citation stays unresolved unless a person resolves it.

## Done when
- [x] where the A-Box documents live is decided with the owner (published with the source, per smart-kg STORAGE.md, versus a committed sidecar here)
- [x] the extractor on one real guideline, with T2 validation green and coverage reported
- [x] T3 fidelity left to a person, never auto-passed

Owner 2026-10-02: 'keep going' after the storage question went unanswered, so the stated default applies: output beside each library entry in smart-base. Branch claude/awesome-fermi-ua31th-8pzh, stacked on #1830 (the pin).

## Status check 2026-10-06 (evidence, re-derived on a fresh checkout)

- Item 2 ticked, measured: `extract-smart-kg-l1.ts --entry smart-base/library/9789240093362-eng --validate <smart-kg @ 66a9b13>` → smart-kg `tools/validate.mjs`: *[l1]: 3 nodes, 2 edges … conforms to the ontology*. `smart-base:smart-kg-l1:check` green. Coverage: 1 labelled recommendation in 48 sections; GRADE strength 0, certainty 0; 2 unlabelled "WHO recommends" mentions counted and not emitted. The output is small because the source is a handbook with one printed recommendation label, not because the extractor dropped anything.
- Item 1 still open: the location was taken by the stated default after the question went unanswered, not decided by the owner.
- Item 3 still open: nothing records that T3 fidelity is pending a person. The output carries no T3 field, and the extractor has no T3 mention.
- 1 of 12 `smart-base/library/` entries extracted (12 directories with a `manifest.jsonld`; an earlier report said 14, which was wrong).

2026-10-07 finding (issue #2405, litlfred/test#2): the label-based extractor (`smart-base/scripts/extract-smart-kg-l1.ts`) finds a recommendation only by a printed label ("Recommendation 8:"). WHO vaccine **position papers print no such labels**, so on WER 92(17) (measles, 2017) it finds **0** recommendations. litlfred/test#2 kept the authored L1 YAML for that paper and deferred extractor parity (its REQ-06, SC-06.1/06.2). A generic check that catches this class of miss, by reading the source rather than the labels, now exists in folio-assistant-core: `bun run cat l1:coverage` (`folio-assistant-core/scripts/l1-coverage.ts`, skill `l1-coverage`). It counts every normative sentence per page and reports captured % and accounted-for %.


2026-10-09: item 3 done — https://github.com/litlfred/smart-base/pull/17 merged (bd79780): coverage carries `fidelity.t3: "pending-person"` (literal type) with the inferred-node count, printed every run; a test fails on any other t3 value. Still open: item 1, where the A-Box documents live — the owner's decision (the owner default, beside the entry, is what is applied today). (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)

2026-10-21: item 1 done — owner ruled `"a and b"` on 2026-10-12: declared as a sub-graph (`id: "library-9789240116191-eng-l1-extraction"`, `path: "library/9789240116191-eng/l1-extraction/"`) in `smart-base/smart-base.json` so it is both a committed sidecar beside the entry AND published with its source (`cat-harness-tools/scripts/gen-library-viz.ts:923,1855`), guarded by `smart-base/scripts/l1-extraction-declared.test.ts` (3 pass, 0 fail). All 3 checkboxes satisfied; closing bean.


## 2026-10-12: hybrid extractor (task #23, smart-base#49)
- `smart-base/scripts/l1-recommendation-candidates.ts` (Tool `l1-recommendation-candidates`) is the unlabelled-source path the 2026-10-07 finding asked for. It finds candidates by l1-coverage markers, takes an agent's curation, and writes L1 **3.0** (not 1.0), validated with `kg/src/validate.ts`.
- **Output location:** beside the entry, under `<entry>/l1-extraction/`, by this bean's stated default.
- **Item 1** (the owner's location decision) and **item 3** (T3 fidelity) are still open. The output records every node as `inferred` and coverage below 100 % until a person signs exclusions, but it still carries no T3 field.

## 2026-10-12: owner ruling 1b (smart-base#50, merged 7e2c526)
- **Ruling 1b:** a publication whose `publicationType` is `implementation-guidance` or `methodology` makes no recommendations of its own (handbook §1.9). What it prints is modelled as a separate node class, `implementation-practice`, not as `recommendation` nodes of a new kind. The class is declared in `kg/src/l1-library.ts` (the extension), so `generated/l1/l1.json` stays equal to WHO's. The extractor emits it when the curation gives `publication.publicationType`. `validate.ts` refuses a recommendation defined in such a publication.
- The demo (9789240116191-eng) is now 22 implementation practices, 0 remarks and 30 proposed exclusions, all unsigned.
- **Item 1 (output location) is still awaiting the owner.** The location was explained (beside the entry, `<entry>/l1-extraction/`, by this bean's stated default), but it has not been ruled on.

## 2026-10-12 — item 1 ruled: "a and b"; L1 output declared as KG content and published

- **Owner's ruling (item 1, where L1 extraction output lives): "a and b".** (a) Keep it committed beside the library entry, in `<entry>/l1-extraction/` in the harness that holds the entry (today `smart-base/smart-base/library/9789240116191-eng/l1-extraction/`). (b) Also publish it with the source. **The owner also asked:** "why does b not happen already? if its a part of the KG it should be published."
- **Root cause.** On smart-base's gh-pages, each library entry published four files: the avatar, `entries/<id>.json`, `<id>.doc.json` and `jsonld/smart-base/<id>/manifest.jsonld`. smart-base declares `library/` with the single typology `library`, and the publisher emits what that typology defines (each entry's manifest). `l1-extraction/` was plain files that no graph typology named. It sat in the repository but was not in the declared KG, so nothing published it.
- **Fix: declare it, then publish what is declared.**
  - smart-base#51 adds a smart-base-contributed typology `l1-extraction` (`typologies/l1-extraction.json`: `within: "library"`, `derived`, `validatorNotApplicable`, since its graph documents are JSON-LD with no `$schema`, validated by `kg/src/validate.ts` at write). It is a kind here rather than more families on cat-harness's `library`, by the `dak-annex` argument: L1 is a WHO SMART concept. The PR also declares `library/9789240116191-eng/l1-extraction/` in `smart-base.json`, plus `scripts/l1-extraction-declared.test.ts`: every `l1-extraction/` on disk must be declared and every declaration must exist.
  - cat-harness-tools#173: `gen-library-viz` publishes every file of every directory declared inside an entry whose kind is `within: "library"`, as-is, beside the manifest at `assets/library/jsonld/<instance>/<entry>/<rel>` (e.g. `…/9789240116191-eng/l1-extraction/recommendations.l1.json` and `…/scenarios/scenario-candidates.l2.json`). The entry links its JSON-LD documents through the projection's `links` and the entry page. A withheld entry publishes none. Orphan pruning and `--check` cover the new files. `recommendations.l1.json` stays the single source and is copied byte-identical.
  - The manifest is not changed: the content context has no term for related graphs. The L1 graph points back to its source with `wasDerivedFrom`.
- **Republishing is still the owner's step.** Nothing was deployed. Both PRs must land, then `library:viz` must run in a checkout holding both, then smart-base's `folio-site.yml` must be dispatched on `claude/seed-smart-base` with its folio-assistant submodule bumped.

_2026-10-23T13:45:00Z_ — Status synced from `in-progress` to `completed` to match the folio-assistant copy of this bean, which is newer and records the work as done there. Only the status changed; the body here is kept as it was. Owner OK in thread "FHIR beans and WHO migration" (https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19).

## Merged from the cat-harness copy (bean dedupe, 2026-10-30)

These lines differed from the kept copy and could not be merged automatically (cat-harness-tools#459). They are kept here so nothing is lost.

Where: (three-way hunk)

```text
- [x] where the A-Box documents live is decided with the owner (published with the source, per smart-kg STORAGE.md, versus a committed sidecar here) — ruled 2026-10-12: both
```
