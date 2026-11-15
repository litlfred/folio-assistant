---
# folio-assistant-3v2t
$schema: bean/1.0.0
title: 'Cross-layer derived files are built at publish, not committed in one layer (owner option b, 2026-11-05)'
status: completed
type: task
priority: high
tags:
    - ci-speed
    - built-at-publish
created_at: 2026-11-05T00:00:00Z
updated_at: 2026-11-08T08:40:00Z
parent: folio-assistant-4j43
---

## Why

A file committed in one layer but derived from several layers goes stale whenever ANOTHER layer is re-pinned. The layer that holds it changed nothing; its own CI is green at the index's pins; and the next re-pin train turns red on it. The re-pin train work of 2026-11-03/04 hit this repeatedly:

- `docs/prov-qaqc/index.md` (cat-harness), from the workflow-instance records on the index's state branch (cat-harness#1022, #1023);
- `library/**/keywords.json` in every library, from log-entropy weights pooled over EVERY library in the checkout (core#635 judged 38 new stale files although it changed no library);
- BPMN drawings and checklists, and the kind JSON schemas, regenerated in cat-harness#1018, core#633, sci#174 and who-iris#177 for the same reason.

The owner was offered (a) the train opens regeneration PRs in each affected layer, which needs a cross-repository token, or (b) build these at publish instead of committing them. **Owner, 2026-11-05: "Yes on all"**, to the recommendation (b). This extends bean `p7mb` (whole-repository derived files built at publish, 2026-10-23) from one repository to across layers.

## Done when

- [x] Each cross-layer derived writer is classified, with its reason: a RENDERING that can be declared `builtAtPublish`, or an INPUT that something gated reads from the checkout and so must stay committed (as `p7mb` classified glossary/generated, detangle and lsi:skills).
- [x] Every rendering is declared `builtAtPublish` in its owning instance, gitignored and untracked, and its `:check` is satisfied by `isBuiltAtPublish` or retired with the reason.
- [x] Whatever must stay committed is listed, with how it is kept current without the train going red on another layer's change.
- [x] Two re-pin trains in a row move a library or a process-instance record without any of these files failing a gate (negative control).

## Classification & Evidence on `origin/main`

| writer | output | classification | reason & how `:check` / re-pin trains stay green | merged PRs (`origin/main`) |
|---|---|---|---|---|
| `render:bpmn` | `cat-harness` `docs/assets/img/workflows/` + beside-source `<stem>.svg` | **RENDERING (`builtAtPublish`)** for host site folder `docs/assets/img/workflows/`; **COMMITTED (own-layer)** for `<stem>.svg` beside `<stem>.bpmn` | Site copies link every step and `[+]` to the host site's pages across all mounted instances (`because: "checkout"`), so `docs/assets/img/workflows/` is one `builtAtPublish` folder entry (untracking 84 host SVGs and replacing 53 hand-listed foreign lines). Plain beside-source `<stem>.svg` links only to sibling diagrams in its own layer, is committed beside `<stem>.bpmn`, is copied into `--site` by `processes:viz` when absent, and `publish-check.ts` (`render:bpmn`) is scoped by `gateOwnsFile` to the caller's own files (beans `akiq`, `70hd`, `npx2`). | `cat-harness#1041` (`d15578f`), `cat-harness#1047` (`115ffbd`), `cat-harness#1067` (`3c7a7c6`), `folio-assistant-core#644` (`f0b3ccb`), `folio-assistant-sci#179` (`b58ab74`), `fhir-harness#288` (`1b7fb4d`), `who-iris#180` (`68e3a89`), `cat-harness-tools#1504` (`95a88fc` / `a944727`), `cat-harness-tools#1534` (`ee88ead`), `cat-harness-tools#1592` (`33a81d1`) |
| `kind:json-schemas` | `cat-harness` `schemas/kinds/` (55 JSON Schemas) | **RENDERING (`builtAtPublish`)** | Generated from `cat-harness-tools`'s Zod schemas (a higher layer); nothing gated reads `schemas/kinds/` from the committed checkout (served at publish as role API docs). All 55 files untracked, `/schemas/kinds/` gitignored, declared in `cat-harness.json` `builtAtPublish` (`because: "checkout"`), and `gen-kind-json-schemas.ts --check` skips committed byte comparison when `isBuiltAtPublish` holds while retaining the vacuity guard (bean `69lr`). | `cat-harness-tools#1536` (`342f59d` / `f4f2338`), `cat-harness#1056` (`99979de` / `8b24f8e`) |
| `state:visualizer`, `glossary:page`, `bibliography:page` | `cat-harness` `docs/en/cat-harness/{beans,qa,health,attestations,code}/`, `docs/assets/glossary/`, and `folio-assistant-core` host-site viewer routes | **RENDERING (`builtAtPublish` folder rules & `builtOnHostSite` derivation)** | Replaces 63 per-instance/per-file `builtAtPublish` lines in `cat-harness.json` with 6 folder entries (untracking 8 committed glossary files including `smart-trust--gdhcn.skos.jsonld`), and derives `folio-assistant-core`'s host-site viewer routes (`glossary`, `bibliography` across locales) from `builtOnHostSite` + self-ignoring `.gitignore` (`*`) per route so `cat-harness` lists no higher layer's routes (bean `uldr`). | `cat-harness#1091` (`1aa871e` / `143271c`), `cat-harness-tools#1564` (`7b5c985`), `folio-assistant-core#654` (`41d9da9`), `cat-harness#1100` (`6dd3746`), `cat-harness#1123` (`f538f18`) |
| `bpmn:checklist` | `<stem>.checklist.md` beside `<stem>.bpmn` (and `docs/assets/workflows/checklists/` in `cat-harness` for `bootstrap` / `bootstrap-tools`) | **INPUT (committed per owning layer)** | Committed per owner ruling (2026-10-14) because `skills:install` (`cat-harness-tools#441`) installs each checklist as an agent process skill. `checklistFor` reads only the single `.bpmn` (`loadProcessModel(src)`), emitting `calledElement` by name without loading foreign `.bpmn` files. Scoped by `gateOwnsFile` in `cat-harness-tools#1534` (`ee88ead`) so each layer's CI checks only its own checklists, and regenerated in-PR by `cat-harness#1093` (`56672ba`). | `cat-harness-tools#1534` (`ee88ead`), `cat-harness#1093` (`56672ba`), `cat-harness#1097` (`43d7648`) |
| `library:keywords` | `library/<slug>/keywords.json` in each library | **INPUT (committed per library root)** | Read from the checkout by `check:kind-validators` (`KeywordsFileSchema`), `gen-library-viz.ts` (`doc.json`), and `lsi.ts`. `libraryKeywords(libRoot)` in `cat-harness-tools/scripts/library-keywords.ts` computes log-entropy weights per `libRoot` (`unitsOf(libRoot, ["library"])`), not pooled across layers; earlier staleness in `who-iris#181` (`0237087`) and `cat-harness#1054` (`a2da2ed`) came from unregenerated section edits within those libraries themselves, now kept current in each owning repo (`cat-harness#1093`). | `who-iris#181` (`0237087`), `cat-harness#1054` (`a2da2ed`), `cat-harness#1093` (`56672ba`) |
| `libraries:derive` | `libraries/` in each layer and `libraries/held/bootstrap-tools/` in `cat-harness-tools` | **INPUT (committed per layer)** | `software-library` KG nodes read by `kg-audit`, `kg-export`, and `check:source-licence`. Each layer derives its own nodes from its own `package.json` and `bun.lock`; `libraries/held/bootstrap-tools/` depends only on `bootstrap-tools` (in `cat-harness-tools`'s own `needs` closure) and is paired in `regen-after-merge.ts` (`"libraries:check": "libraries:derive"`). | `cat-harness-tools#877` (`08c29fc`), `cat-harness-tools#1081`, `cat-harness#1093` (`56672ba`) |
| `prov:qaqc` | `cat-harness` `docs/prov-qaqc/index.md` and `docs/assets/prov/*.prov.jsonld` | **INPUT / verified report (committed in `cat-harness`)** | Verified by `prov-qaqc.test.ts` and `prov-qaqc-checkout.test.ts` (`artefact-verification.json`) over the real checkout's `beans/workflows/` instances, ODRL policies, and role graphs. Checkouts that keep no `beans` work-plan state branch now exit `0` (`not applicable`) via `workflowStateAbsent(REPO)` (`cat-harness-tools#1665`); paired in `regen-after-merge.ts` (`"check:prov-qaqc": "prov:qaqc"`) and conflict-resolved by `merge-conflict-patterns.ts` (`folio-assistant#2029`). | `cat-harness-tools#1665` (`8036b37` / `9bff465`), `cat-harness#1093` (`56672ba`) |

### Negative control (consecutive re-pin trains on `litlfred/folio-assistant` `main`)

- `litlfred/folio-assistant#2981` (`9020a723b12e`, `2026-11-06T00:19:36Z`), `#3029` (`46a8ffbce4b9`, `2026-11-07T20:39:47Z`), `#2985` (`da3ca528562a`, `2026-11-08T06:42:36Z`), and `#3034` (`3a0942bca4c3`, `2026-11-08T07:43:59Z` — moving all 11 layers including libraries and process records) all merged cleanly on green `repin-train / no new failures` verdicts with `0` failures on any of the above files.

_2026-11-05_ — Filed by the re-pin train session, https://claude.ai/code/session_01EucfRp9ycxtZrrBKaipNy5, on the owner's "Yes on all".
_2026-11-08T08:40:00Z_ — Completed on `origin/main` evidence across `cat-harness`, `cat-harness-tools`, `folio-assistant-core`, `who-iris`, and `folio-assistant` (`#2981`, `#3029`, `#2985`, `#3034`).
