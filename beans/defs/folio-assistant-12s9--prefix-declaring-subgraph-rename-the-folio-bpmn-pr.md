---
# folio-assistant-12s9
title: 'PREFIX = DECLARING SUBGRAPH: rename the folio: BPMN prefix and folio-*/v1 schema ids to the path of the Subgraph that declares them (owner ruling iwtn #1)'
status: todo
type: task
created_at: 2026-09-23T21:03:10Z
updated_at: 2026-09-23T21:03:10Z
parent: folio-assistant-88mg
---

## Owner ruling, 2026-09-23 (bean iwtn, ruling 1 of 4)

> use `<sub>:` as prefix when assets are declared/instantiated in `<sub>`. what patterns for sub-sub-graphs? `<path>:<in>:<graph>:` or so?

A nested Subgraph uses its **path of Subgraph ids joined with dots**. XML forbids a colon inside a prefix, so `a:b:c:` cannot be used. The owner chose this pattern on 2026-09-23 over "Harness name only" and "joined with hyphens":

    <bootstrap.processes:skill ref="confirm-harness"/>
    xmlns:bootstrap.processes="<base>/bootstrap/processes/ns#"
    $schema: bootstrap/processes/workflow-instance/v1

Programs match on the namespace address, never on the prefix. The prefix is what a reader sees. The address carries the full path.

## Measured 2026-09-23, on main at c33dd611

- 71 `.bpmn` files declare `xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"`.
- About 20 `.ts` files reference the prefix or the address, among them `schemas/namespaces.ts`, `types/bpmn-moddle.d.ts`, `src/workflow/process-model.ts`, `content/pipeline/bpmn-translate.ts`, `scripts/kg-export.ts` and `scripts/ns-export.ts`.
- 40+ distinct `folio-*/v1` schema ids. The most used are folio-document-images (41 uses), folio-detangle-sidecar (30) and folio-library-entry (29).
- Folios in other repositories (qou, folio-test) carry diagrams too.

## Where each element is declared decides its prefix

- `skill`, `role`, `decision`, `precondition` and `no-skill` are about Skills, Roles and Processes. Those are bootstrap's terms, so they belong in `bootstrap.processes:`.
- `bean` is a cat-harness concept (the work plan), so it takes a cat-harness Subgraph prefix.
- Each `folio-*/v1` schema id moves to `<harness>/<subgraph>/<name>/v1`, using the Subgraph where that schema is declared.

## Stages (each stage is one PR, and each stage is green on its own)

- [ ] 1. Declare one namespace address per declaring Subgraph, in `schemas/namespaces.ts`. The parser and the moddle descriptor accept both the old address and the new one.
- [x] 2. Migrate bootstrap's 3 diagrams, and remove the ALLOW entries in `graph.test.ts` (it lives in `cat-harness/schemas/` since 319n).
- [ ] 3. Migrate the rest of this repository's diagrams, and move the `folio-*/v1` schema ids with a read-both window.
- [ ] 4. Folio repositories (qou needs the owner's go-ahead first), then drop the old address.

## Done when

No file under `bootstrap/` carries `folio:` or `folio-*/v1`, and the ALLOW list in `graph.test.ts` holds only bootstrap's own location.

## Measured 2026-09-24: a premise was wrong, and stage 1 is bigger

**The bean says "programs match on the namespace address, never on the prefix". In this repository that is false.**
- `process-model.ts` parses with `bpmn-moddle` and registers no descriptor for our extensions. It recognises them by the literal prefix text: `ext.find((v) => v.$type === "folio:bean")`, about 30 times.
- Five more readers regex the raw XML for the prefix text:
  - `check-workflow-coverage.ts` (`<folio:implements`, `<folio:job`)
  - `kg-detangle.ts` (`folio:skill ref=`)
  - `code-lists.ts` (`<folio:adjudication`)
  - `gen-docs-auto.ts` (`<folio:skill ref=`)
  - `glossary-export.ts` (`<folio:role`)
- So a diagram written as `<bootstrap.processes:skill>` would parse **without error and be silently ignored**. That is the `0d99` failure (an element nothing reads, which reads as fine) turned inside out.

**It is fixable.** The parser exposes each element's namespace: probed, an unknown element carries `$descriptor.ns = { prefix, localName, uri }`. Normalising `$type` by `ns.uri` once, right after parsing, makes `process-model` prefix-independent.

**All 74 diagrams bind `folio` to one address** (`https://litlfred.github.io/folio-assistant/bpmn`), so no legacy spelling remains to carry.

## Stage 1, revised
- [x] 1a. `schemas/namespaces.ts`: a registry of OUR extension namespaces (the current address, plus one per declaring Subgraph). `process-model.ts` normalises each element by `ns.uri` after parsing, and the five raw-regex readers go through the parser or a namespace-aware helper.
- [x] 1b. Test: a diagram written with a different prefix bound to our address produces an identical model, and one with `folio:` bound to a foreign address produces none of our elements.
- [x] 1c. Gate: fail on any new raw regex for `<folio:` in a diagram reader, so the prefix cannot be re-hardcoded.

### Stage 1 done, 2026-09-24
- **Nine readers, not six.** The new gate found four more that my first search missed: `prose-code-pairs`, `render-bpmn`, `pair-claims` and `gen-processes-viz`. All nine now match through `ownElementPattern`, and `process-model` normalises by `ns.uri`.
- **Two test fixtures had bound `folio` to the wrong address** (`…/ns` instead of `…/bpmn`). They passed only because matching was by prefix text. Corrected.
- **Fixtures that bound no namespace at all** now declare the binding a real diagram carries. A new test pins that a document binding none of our namespaces has none of our elements.
- **Verified that the tests are not vacuous:** with the normalisation switched off, both parser tests fail.
- **Not done here, on purpose:** the per-Subgraph addresses (`bootstrap.processes`, …) are not minted yet. Stage 2 mints each one together with the diagrams that use it, so no address is published before anything binds it.

### Stage 2 done, 2026-09-24
- **Address**, owner's choice (option 1 over 3, after comparing them): `https://litlfred.github.io/folio-assistant/bootstrap/processes/ns#`. Code `bootstrap-processes` in `own-namespaces.json`, `BOOTSTRAP_PROCESSES_NS` in `namespaces.ts`, and an active extension namespace beside the older one.
  - Why not `…/processes` with no `ns#`: an element name would run together (`…/processesskill`), and that URL is the folder of bootstrap's published `.bpmn` files.
- **Bootstrap's 3 diagrams** now bind `xmlns:bootstrap.processes` and write `bootstrap.processes:skill|role|precondition`, the only three elements they use. Prose that named cat-harness elements (`folio:bean`, `folio:decision`) now says "work-plan element" and "computed decision", because bootstrap does not define those.
- **The vocabulary is bootstrap's own data**: `bootstrap/processes/ns.jsonld` defines the three elements, and the site copies it to the extensionless address `<base>/bootstrap/processes/ns` (plus `.json`) in both `docs-site.yml` and `feature-staging.yml`. The address opens a definition.
- **The drift check** in `external-schemas.ts` now means "ours but not an active extension namespace", since there are two addresses on purpose.
- **Leak test:** the `folio:` element entries are removed from ALLOW. Only the `folio-*/v1` schema ids remain, for a later stage.
- **Found:** `variable-performer.test.ts` edited bootstrap's diagram by searching for `<folio:role …>`, a no-op after the rename. It failed, which is good; it now also asserts that each edit actually changed the file.

## Next
- [x] 3. The cat-harness diagrams: `skill`, `role` and `precondition` move to `bootstrap.processes:` (bootstrap declares them), and the other 13 elements move to a `cat-harness.processes:` address minted the same way, with its own `ns.jsonld`.

### Stage 3 done, 2026-09-24
- **New address `…/cat-harness/processes/ns#`**: code `cat-harness-processes`, `CAT_HARNESS_PROCESSES_NS`, and `cat-harness/processes/ns.jsonld`, which defines the 15 elements cat-harness declares. It is published at `<base>/cat-harness/processes/ns` (plus `.jsonld` and `.json`) by both workflows.
- **All 71 non-bootstrap diagrams** bind only the vocabularies they use and write `bootstrap.processes:skill|role|precondition` and `cat-harness.processes:<the rest>`.
- **Verified by the parser, not by reading the diffs.** Every one of the 71 models was snapshotted before and after. The only difference in any of them is one `reason` text that now names `cat-harness.processes:adjudication`; no Skill, Role, bean op, policy or decision changed. The snapshot was checked for vacuity: 1,878 skill lists, 2,271 role refs and 119 work-plan steps.
- **Docs and Skills:** 139 element mentions in 53 hand-written files were mapped. `bpmn-processes` gained a "Binding the extension namespaces" section, so new diagrams are written the new way.
- **Tests:**
  - no diagram binds the old address;
  - every element used is defined by the vocabulary of the address it is written under (more than 500 checked).
- **Found:** two TEST files, `processes-viz` and `skill-coverage`, read the real diagrams with a raw `folio:` regex. After the rename they counted zero, and three of the processes-viz tests **still passed**. All are fixed, and the gate now covers test files, matches only real element names, and ignores error-message matchers.

## Next
- [ ] 4. Folios in other repositories (qou needs the owner's go-ahead first), then retire the old `…/bpmn` address. The 15 test fixtures that still bind it are part of that.

### Stage 4 plan — measured 2026-09-24
The owner chose "plan all repos first". I listed every `litlfred` repository and read the recently active candidates (shallow, read-only). Only each repository's own tracked files were counted; a vendored platform submodule was not.

| repository | diagrams | bind the old address | other files naming it |
|---|---|---|---|
| **ihris** | 3 | **3** (24 elements: skill, role, no-skill) | 1 (`src/tools/gen_bpmn.py`, which **generates** the three) |
| qou | 0 | 0 | 0 (**no math-repo change needed**) |
| folio-test | 0 | 0 | 0 (it carries the platform only as a submodule) |
| smart-base | 3 | 0 (plain BPMN, none of our elements) | 0 |
| smart-trust, smart-immunizations | 0 | 0 | 0 |
| cat-harness-test | empty repository | | |

- [ ] 4a. ihris: `gen_bpmn.py` emits `xmlns:bootstrap.processes` (skill, role) and `xmlns:cat-harness.processes` (no-skill); regenerate the 3 diagrams. One PR, which needs the owner's go-ahead because it is another repository.
- [x] 4a. ihris PR: litlfred/ihris#24 (generator plus 3 regenerated diagrams; parsed models identical, 14 skill refs and 40 role refs; ihris `validate.py` OK).
- [x] 4b-i. The test fixtures here moved off the old address: 13 of 14 files. `extension-namespace.test.ts` keeps it on purpose, because it tests that the old address is still accepted. Tags are rewritten only inside quoted fixtures, never inside regex literals, which match the code's error messages.
- [ ] 4b-ii. Messages: the parser's errors still tell an author to write `<folio:fulfilment …>` or `declare <folio:adjudication codes …>`. They should name the new prefix. The tests that match them change with them.
- [ ] 4b-iii. Here: retire the old address. Mark it `retired` in `own-namespaces.json` (as `legacy-folio-bpmn` is) and remove it from `OWN_BPMN_EXTENSION_NAMESPACES`, so `external-schemas` reports it as drift. Only after 4a merges.
