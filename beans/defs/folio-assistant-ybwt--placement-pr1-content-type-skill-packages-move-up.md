---
# folio-assistant-ybwt
title: 'Placement PR1: content-type skill packages move up to their owning instances'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T05:31:12Z
updated_at: 2026-10-02T16:25:26Z
parent: folio-assistant-9umr
blocked_by:
    - folio-assistant-hx65
    - folio-assistant-63wl
---

PR1 of the approved placement proposal (owner rulings 2026-09-30; bean 9umr's eight groups; PR0 mechanisms in bean ejye). Move the content-type skill packages out of `cat-harness/skills/` to the instance that owns them, into the `content` / `library` concern group there:

- paper / formal-math (`folio-paper-adapter`, `authoring-math`) and the three `claude-scientific-skills` packages -> `folio-assistant-sci/skills/content/`
- `document-intake` -> `folio-assistant-core/skills/library/ingestion/`
- `folio-document-adapter` -> `folio-assistant-core/skills/content/`
- WHO SMART (`authoring-who-smart-guidelines`) -> `smart-base/skills/content/`
- `fhir-validation`, `ig-publication`, `l3-fhir-authoring`, `terminology-management` (+ the `smarter-fhir` remote package) -> `fhir-harness/skills/content/fhir-ig-authoring/` (#1702)
- `quality-control` -> `folio-assistant-core/skills/content/content-lifecycle-ext/` (#1702)

kg-qa sidecars and `schemas/skills/<skill>/` travel with their skill. Role->skill edges naming a moved skill move to the owner's `scenarios/roles.json` extension (PR0b). `content-lifecycle` stays in the harness, generalised (ruling 1) — not part of this PR.

## Done when

- [x] a search for `cat-harness/skills/<moved package>/` finds nothing outside `beans/`
- [ ] no cat-harness file names a moved skill by path or by role edge (paths and role edges: done; BPMN refs → PR3/PR6, tool satisfies → #223)
- [x] corpus `knownSkills` unchanged; `skill:register`, `regen`, `gates` green, or each failure proven pre-existing on 9962556

## 2026-10-01 — built on branch `pr1-content-up` (local, not pushed)

**Moved (git mv), per destination**
- folio-assistant-sci `skills/content/`: `folio-paper-adapter` (46 skills + 4 detail files + 16 `.ts`), `authoring-math` (3), the three synced claude-scientific-skills packages; `claude-scientific-skills.json` → sci `skills/remote-packages/`; `schemas/skills/{latex-authoring,lean-formalization,proof-verification}`.
- folio-assistant-core: `folio-document-adapter` (4) → `skills/content/`; new `content-lifecycle-ext` (`quality-control`); new `skills/library/ingestion/` (`document-intake`); `schemas/skills/` ×5. Core declares the `content` skills topic (lowest holder; PR2 moves it down).
- smart-base `skills/content/authoring-who-smart-guidelines/` (8); `schemas/skills/l2-dak-authoring`.
- fhir-harness `skills/content/fhir-ig-authoring/` (fhir-validation, ig-publication, l3-fhir-authoring, terminology-management); `smarter-fhir.json`; `schemas/skills/` ×4.
- kg-qa sidecars relocated to each owner's tree (subject paths instance-relative; pair attestations kept).

**Role edges**: 71 role→skill edges out of `cat-harness/scenarios/roles.json` into extensions by id (sci 49, core 12, fhir-harness 8, smart-base 2). Every role's checkout-resolved skills and corpus `knownSkills` (290) are identical before and after (measured against 9962556).

**Mechanisms added**: `SkillContract.instanceRoot` (a local contract resolves against the instance holding the skill); kg-export mints a contract IRI only for one this instance publishes (moved contracts lose the harness `$id` — absolute or absent); remote-package wrappers read from every skills root; `syncedPackageDir`; `workflow_start` passes an extensions-only role graph.

**Deferred, with reasons**
- `requirements/{fhir-validation,lean-verification}.json`: harness capabilities `sushi-compiler`, `ig-publisher`, `lean-toolchain` cite them and move in PR4; moving the requirement first would ADD an upward edge PR4 removes.
- 88 BPMN `skill ref`s to moved skills in 15 harness diagrams: 13 diagrams move in PR3; `review-task`→`semantic-review-scoping` (PR3) and `document-ingestion`→`document-intake` (PR6).
- Harness Tool nodes (`cat-harness/tools/index.ts`, `mcp.ts`) `satisfies` 12 moved paper skills: tool→skill upward edges; they go with the tools in the code partition (#223 / yj6r), not a skill move.
- Harness docs pages (PR9) and name-only mentions in prose (rolling, §5).

**Needs the owner**: 8 orphaned `kg-detangle` sidecars (the moved groups; ~300 bytes each, numbers only) are removed in a SEPARATE commit marked for confirmation; the alternative is widening `kg-detangle`'s SCAN to the owners' `skills/`, which that script records as a person's decision.

**Gates** (2026-10-01, after merging origin/main 9c3dd4227c4): 7 of 197 fail, the same 7 as 9962556 after `regen` (bun test: entanglement-report dangling + bootstrap render SVG + ingest fixtures; glossary:check:bootstrap; translate-bpmn:bootstrap:check; check:command-paths; check:l1-complete; check:subgraphs 4 links). The 7th is the bootstrap-tools README staleness, reported as readme:sync:all:check here and check:bootstrap-standalone on base. check:import-direction --all and kg:detangle:direction: clean.


## 2026-10-01 — separation arc (7x5n)
Merged (#1758 / #1760). Remaining boxes need green gates ON MAIN, which is red at cdb0a018, so this waits on S0 (hx65) and closes in S1 (a4of).


## 2026-10-01 (arc 7x5n S1)
Remaining box = BPMN skill refs to moved skills; the widened detangle scan (#1774) now counts 91 such harness-BPMN edges. They are PR3's (63wl) work, so this bean waits on 63wl.

_2026-10-02_ — PR3 (63wl, #1875) moved the content-type diagrams to their owners and dropped review-task's semantic-review-scoping ref. Measured instance-strict after PR3: harness BPMN still names 32 skills it cannot reach — 29 x document-intake (document-ingestion + the 4 ingest-*, PR6/apcg) and 3 x ig-ast-delta (ig-ast-delta-review, placement-audit SPLIT, unplanned). The second box stays open.
