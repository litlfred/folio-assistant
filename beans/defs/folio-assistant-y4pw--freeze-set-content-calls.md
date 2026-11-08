---
# folio-assistant-y4pw
$schema: bean/1.0.0
title: 'Freeze-set content calls: four site-re-pin reds that need an author, not a regen'
status: in-progress
type: task
priority: normal
created_at: 2026-11-05T17:40:03Z
updated_at: 2026-11-08T07:18:30Z
parent: folio-assistant-rwmf
tags:
    - repin-freeze-2026-11-05
---

Filed from folio-assistant-rpc6. Owner card (2026-11-05, Q4 "1. Work items, known"): each of these is a content decision, so it is recorded here and treated as a KNOWN red on the site re-pins until it is done. Found by the freeze-set survey (cat-harness a2da2ed, cat-harness-tools 78a982e, folio-assistant-core 4f18e66, who-iris 90bb3f5, smart-base 1e111a6, fhir-harness 299de78, bootstrap-tools 9f478d4).

- [x] **who-iris command paths** (`check:command-paths`): docs/oxigraph-pipeline-requirements.md:71,72, skills/iris-cdn-signing.md:125, skills/iris-oxigraph.md:27,30,33,35 name scripts that no longer exist (scripts/build-iris-oxigraph.ts, scripts/iris-oxigraph-search.ts, scripts/iris-cdn/run.ts, scripts/tests/iris-oxigraph.test.ts). Restore the scripts or rewrite the skills. *(Done on `who-iris` `main` in `litlfred/who-iris#186`, merged as `a6d73e8b8ffe` at `2026-11-07T05:30:02Z` — marked the 3 fenced blocks `command-path-ok` as instance-relative so site checkouts with their own root `scripts/` do not resolve them against the site root.)*
- [x] **cat-harness CRDM links** (`check:subgraphs`): methodologies/crdm.md (6 links) and sdlc/skills/crdm/crdm-requirements-template.md point at library/process/path-2012-common-requirements-mhis-crdm/…, an entry that is not in the library. Ingest the entry or drop the links. *(Done on `cat-harness` `main` in `litlfred/cat-harness#1062` / `2292a377789c` / `04bf9bfea`: `library/process/path-2012-common-requirements-mhis-crdm/` is ingested.)*
- [x] **Undeclared serialisations / visualisers** (`check:subgraph-coverage`): cat-harness sdlc, sdlc-processes, sdlc-skills, work-plan, work-plan-skills, work-plan-tools; smart-base smart-base-templates; smart-ra references; who-iris attestations. Declare json/jsonld/schema.json and a visualiser, or an exemption with a reason, in each instance's <name>.json. *(Done on `cat-harness` `main` in `litlfred/cat-harness#1098`, merged as `b606cb72bcac` at `2026-11-07T05:31:48Z`, and `litlfred/smart-ra#235`, merged as `acaf6ce9ae5c` at `2026-11-07T05:30:06Z` declaring `instance-readme` and `agent-instructions` in `dpi-h-ra.json`.)*
- [x] **Core example path** (`check:command-paths`): folio-assistant-core skills/content/folio-document-adapter/review-sheet-script.md:221 names review/public-comment/sheet-sync.json. Mark it as an example path or qualify it. *(Done on `folio-assistant-core` `main` in `litlfred/folio-assistant-core#655`, merged as `1450129868a9` at `2026-11-06T06:35:54Z` — split `--script Code.gs` from the `--config review/public-comment/sheet-sync.json` block and marked the latter `command-path-ok` matching the drafting block below it.)*
- [x] **CI-only translation:obsolete red** (owner card 2026-11-05, "1. Known + work item"): site CI flags 10 cat-harness .po files (translations/{ar,es,fr,ru,zh}/concepts/agentic-harness.po and guides/beans-and-todos.po) as holding stale msgids, but the same check passes locally on the same freeze mount (smart-immunizations-uganda at f26fc65). Find the CI-only cause (likely a derive step that rewrites the source page before the gates run) and fix it at its owner. *(Done on `cat-harness` `main` in `litlfred/cat-harness#1105`, merged as `99fb9499ed71` at `2026-11-07T05:31:30Z`, and `litlfred/cat-harness-tools#1588`, merged as `144f3d31f366` at `2026-11-07T05:31:33Z`.)*
- [ ] **dth-sc partial mount of smart-ra** (owner card 2026-11-05, "1. Known, merge"): dth-sc mounts dpi-h-ra's references/ but not its root, so dpi-h-ra/references/README.md → ../README.md is dangling (check:subgraphs). Repoint the link in litlfred/smart-ra (or mount the root README) and re-pin dth-sc. *(PR open: `litlfred/dth-sc#25` (`d8f9159`, branch `chore/y4pw-repin-smart-ra`) re-pins `dpi-h-ra` to `c14618fdb9b8` past `smart-ra#235` `acaf6ce9ae5c`, mounting `dpi-h-ra/README.md` and `dpi-h-ra/AGENTS.md` as declared assets so `dpi-h-ra/references/README.md → ../README.md` resolves cleanly.)*

## Done when
Each item is fixed in its owning repo and merged, or the owner rules it stays.

_2026-11-06T05:40:18Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.
_2026-11-06T06:01:00Z_ — Item 2 verified done on `cat-harness` `main` (`litlfred/cat-harness#1062` / `04bf9bfea`). Opened `litlfred/who-iris#186` (item 1), `litlfred/cat-harness#1098` (item 3 visualisers for `sdlc`, `work-plan`, and `who-iris` `attestations`), and `litlfred/folio-assistant-core#655` (item 4).
_2026-11-08T07:10:00Z_ — Checked off Items 1, 3, 4, and 5 as merged on their owning `origin/main` branches (`litlfred/who-iris#186` `a6d73e8b8ffe`; `litlfred/cat-harness#1098` `b606cb72bcac` + `litlfred/smart-ra#235` `acaf6ce9ae5c`; `litlfred/folio-assistant-core#655` `1450129868a9`; `litlfred/cat-harness#1105` `99fb9499ed71` + `litlfred/cat-harness-tools#1588` `144f3d31f366`). Preparing `litlfred/dth-sc` re-pin PR for Item 6.
_2026-11-08T07:18:30Z_ — Opened `litlfred/dth-sc#25` (`d8f9159`, branch `chore/y4pw-repin-smart-ra`) re-pinning `dpi-h-ra` (`litlfred/smart-ra`) to `c14618fdb9b8` (past `smart-ra#235` `acaf6ce9ae5c` and `smart-ra#234`), which mounts `dpi-h-ra/README.md` as a declared asset and resolves `dpi-h-ra/references/README.md → ../README.md`. Watching CI to hand off to Merge Manager (`ready-to-merge`).
