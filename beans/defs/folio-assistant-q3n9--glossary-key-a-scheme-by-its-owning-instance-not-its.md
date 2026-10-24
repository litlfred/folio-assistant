---
# folio-assistant-q3n9
$schema: bean/1.0.0
title: 'GLOSSARY KEY: key a scheme by its owning instance, not its file path, once glossaries move to their layers (from wvzp)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-24T08:55:00Z
updated_at: 2026-10-24T10:15:00Z
parent: folio-assistant-7x5n
---

Owner, 2026-10-24 08:41Z, on wvzp: *"B clean break. migrate to propoer way. analayze as part of goal 1."*

## Where it stands
wvzp keys the term-mapping record by the scheme's **file path** (`litlfred/cat-harness#524`, `litlfred/cat-harness-tools#708`, `litlfred/folio-assistant-core#206`). Unique today (33 schemes, 33 keys), but a path is not an identity:
- it changes when a file moves, and GOAL 1 is expected to move glossary files out of `folio-assistant-core/glossary/` into each layer;
- it depends on the checkout layout: `folio-assistant-core/glossary/...` in the index, `glossary/...` in a standalone core checkout.

## Analyse, as part of the separation
- Where does each glossary file live after separation? If every layer holds its own `generated/` and authored schemes, the declaring instance IS the owner, and the key can be (instance, scheme) with no path rule.
- The two rules that exist today and must not drift: the glossary page's `schemeOwner` (core) and the path rule measured in wvzp (`generated/<instance>/`, then `<instance>.glossary.json`, then the directory's owner). Both agreed on all 33 schemes on 2026-10-24.
- Whether a glossary file should state its instance explicitly (an `instance` field in `folio-glossary/v1`), written by `glossary-extract.ts`.
- Published SKOS is already named `<instance>--<scheme>.skos.jsonld`, so (instance, scheme) matches what is published.

## Done when
- [x] the key after separation is decided by the owner (instance, explicit field, or other), with the analysis above recorded here
- [ ] the term-mapping record, `termState` and the glossary page move from `file` to that key in one migration, and the `file` field is retired
- [ ] a test fails if the page's owner and the record's key disagree for any scheme

Session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU.

_2026-10-24T08:52Z_ — Claimed by the separation drain thread (session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e) for the analysis box.

## 2026-10-24 — analysis (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

**Where the glossary files are on main today.** 33 schemes:
- `folio-assistant-core/glossary/` holds 29: its own authored `folio-assistant-core.glossary.json` and `guideline-domain.glossary.json`, **cat-harness's authored** `cat-harness.glossary.json`, and `generated/<instance>/` for **seven** instances: bootstrap, bootstrap-tools, cat-harness, fhir-harness, folio-assistant-core, folio-assistant-sci, who-iris.
- `smart-base/glossary/generated/smart-base/` holds 4 (moved out of core by `rfev`, smart-base#137 + core#187, merged 2026-10-24).
- Of the seven, only who-iris and core declare a `glossary` directory (cat-harness's `glossary/` is the `swimlane-glossary` typology; sci, fhir-harness, bootstrap, bootstrap-tools declare none). `generatedDirFor` in core's `glossary-page.ts` already writes an instance's extraction into its OWN declared `glossary/generated/` when one exists, so the `rfev` move pattern is the mechanism; it needs each instance to declare a `glossary` directory first.

**After separation**, following `rfev`: each instance declares `glossary/` (typology `glossary`) and holds `glossary/generated/<self>/` plus any authored scheme; core keeps only its own. The file's location and its owner then coincide, but a path still differs between the index (`<instance>/glossary/...`) and a standalone checkout (`glossary/...`), so a path stays a poor key.

**Two owner rules exist, and they are not the same kind of rule.** `schemeOwner` (core's page) derives the owner from the scheme's `source` (the defining file's instance), falling back to where its terms come from; it does not depend on where the glossary file sits. The `wvzp` path rule derives it from the file's location (`generated/<instance>/`, then `<instance>.glossary.json`, then the directory's owner). Both agree on all 33 today; after the moves they agree by construction, but only `schemeOwner` survives a file being misplaced.

**The key.** Published SKOS is already `<instance>--<scheme>.skos.jsonld`, so `(instance, scheme)` matches what readers see. Options put to the owner:
- **A** `(instance, scheme)`, instance = `schemeOwner` (from the source). No new field; layout-independent; one rule.
- **B** an explicit `instance` field in `folio-glossary/v1`, written by `glossary-extract.ts`, plus a check that it equals `schemeOwner`. Self-describing out of context, but a second statement that can drift.
- **C** keep the file path (`wvzp` today). Breaks on every move this bean exists to enable.

**Owner ruling 2026-10-24T09:05Z: A.** Key = `(instance, scheme)`, with instance taken from `schemeOwner` (the scheme's source). No new field. Box 1 is done; the moves (each layer declares `glossary/`, following `rfev`) and the record/`termState`/page migration come next.

_2026-10-24T10:15Z_ — Box 2 and 3 built, in review. Took over wvzp's three PRs and reworked them: cat-harness#524 (mapping carries a required `instance`, `file` retired), cat-harness-tools#708 (`schemeOwner` moved into `scripts/lib/scheme-owner.ts`, rows and `termState` keyed by (instance, scheme)), folio-assistant-core#206 (page and SKOS automated matches keyed by instance; new test that the page owner and the record key agree over the real checkout). Merge in that order. Boxes tick when they merge.
