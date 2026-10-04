# Placement proposal: concern sub-subgraphs and staged moves across the layers

**Status:** proposal for review. It follows the owner's process ruling: *"review, resolve issues, then staged PRs"*. §4 lists the issues that still need a ruling, and every staged PR in §2 waits on that ruling.

**Checkout measured:** `/home/user/wt/bt/folio-assistant` at `3d5a11111af`, on branch `next/inherit`, 3 commits ahead of `origin/main`. This checkout includes bean `1g4s` (option A: an inherited subgraph gains the same-named directory of each instance as a member). It also includes #1702 (`rqao`), which split the skill definitions by theme. The earlier `placement-review.md` was measured at `8ad74abcd12`. Where the two disagree, this document uses the newer checkout.

**Method:** every count comes from `git ls-files` or from a script in `scratchpad/prop/`:

| script | output | what it does |
|---|---|---|
| `assign.py` | `assign.json` | the per-skill placement table behind §1 and §2 |
| `residual.py` | `residual.out` | the upward references that remain after the moves (§5) |
| `refzones.py` | – | reference sites per path, split into zones: history, generated, sidecar, authored, code |
| `tests.py`, `schemas.py` | – | first-pass grouping of test and schema files by filename. These counts are **heuristic**: expect about ±15 % per group |

**Layer abbreviations:** harness = `cat-harness`, core = `folio-assistant-core`, sci = `folio-assistant-sci`. The other instances keep their names.

**Stack, from each instance's `needs`:**
- `cat-harness` → `bootstrap`
- core → cat-harness
- sci, fhir-harness and large-datasets each → core
- smart-base → fhir-harness
- the checkout root (`folio-assistant.json`) → core **only**

---

## 0. What this proposal changes from the placement review

The earlier review was re-checked against the corpus. The review said one thing; the corpus settles another in these eight places:

| review said | corpus says | evidence |
|---|---|---|
| move `review-task`, `review-narrative`, `voice-review` and the voice-review skills to core | **keep them in the harness** (the voice machinery). Move only `one-voice-*` and the voice *content* | `crdm-deliver.bpmn` (a harness process) calls `Process_Review` in `review-task.bpmn`. That calls `review-narrative.bpmn`, which calls `voice-review.bpmn`. Moving them would put a harness→core call on the CRDM path. `skill-voice-review` (in kg-core) reviews *harness skills* against voices. The `voices` kind is declared by the harness as per-instance (`1g4s`). |
| `quality-control` → smart-base; `fhir-validation`, `ig-publication`, `l3-fhir-authoring`, `terminology-management` → smart-base | follow **#1702**: `quality-control` → core; those four → **fhir-harness** | #1702 (owner, 2026-09-30: *"split by theme across harnesses"*) already placed their `skill-definitions/*.json` there. The bodies should sit beside their definitions. |
| `evidence-retrieval.bpmn` and the `evidence-agent` role → smart-base | **core** | `editing-hci-validation.bpmn` (core) calls `Process_EvidenceRetrieval`. Placing that process in smart-base would put a core→smart-base call on the editing path. GRADE stays in smart-base as a refinement (the `grade` skill). |
| `pages-live-gate.dmn` "could stay harness" | **core** | Only `getting-started.bpmn` uses it (grep over `*.bpmn` and `*.ts`). |
| `delivery-summary` → core | **split it**. The restart command and PR/viewer links stay in the harness (`sdlc`). The block-level change list becomes a new core skill, `block-change-summary` | The harness processes `crdm-deliver.bpmn` and `upstream-version-adoption.bpmn` name it. Only its §2 ("content block change links") is about folio content. |
| `technical-documentation`: move the skill to core, or move the voice down | **keep the skill in the harness and drop its link to the voice.** The core `technical-writer` voice points at the skill | #1168's rule: *"a voice points at the role it addresses, so the role names no voice"*. The skill currently cites a stale path, `cat-harness/voices/technical-writer.json`. |
| move `materialize-remote` DOWN because "bootstrap uses it" | **that evidence is stale** (see §4 issue 2) | `bootstrap/processes/initialize-harness.bpmn` does not reference materialization. The path the skill cites, `bootstrap/workflows/initialize-harness.bpmn`, does not exist. `materialize-remote.bpmn`'s `Task_Enumerate` depends on large-datasets' `source-descriptor`. |
| CRDM is an SDLC skill | **CRDM belongs to `process`**, as a workflow methodology, beside `raci` | Owner, bean `g43o`: *"RACI, CRDM, SDLC, MADR and other methodologies should be in own topical subgraphs under workflow"*. `skills/process/raci/` already follows that ruling. |

The review also lists `.claude/skills/local/*.json` (22 files) as unplaced. That item is already fixed: #1702 moved them to `<owner>/skills/skill-definitions/`.

One new finding came out of the re-check. The harness's own basic metadata step, the `asset-extraction` skill, runs `folio-assistant-core/scripts/extract-assets.ts`, and that script imports core's `schemas/extraction.ts`. So the harness's basic ingestion depends on core today. §3 and PR5 move both files down.

---

## 1. The grouping

### 1.1 Two axes, one path

- **Concern** is the sub-subgraph: one of the eight groups the owner ruled in `9umr`.
- **Layer** is the instance.

A path carries both, for example `folio-assistant-sci/skills/content/folio-paper-adapter/`. The group ids are **shared**: every instance and every subgraph kind uses the same eight. Under `1g4s` option A, the harness declares each group once, and each higher instance's same-named directory (for example `folio-assistant-core/skills/library/`) is a **named member** of it. Higher instances therefore add no groups of their own. Their content-type work (paper, WHO SMART, FHIR IG, document) goes in as *packages* under `content/`, and their detailed methodologies go in as packages under the harness group they refine (`library/`, `ui/`, `conduct/`).

**Where the vocabulary lives (settled by the corpus, not asked):** one code list, `cat-harness/code-lists/concern-group`, holding the eight codes, each with a title and a definition. Each kind's declaration file names its members by that code. `skills/skills.json` topics already carry a title and description. Restating those in four more declaration files would break *"one fact, one place"* (AGENTS.md, beans section).

### 1.2 The eight groups

Definitions:

- **`sdlc`**: how a change is planned, tracked, verified and shipped. Covers the work plan (beans), branches, PRs, CI and gates, QA and adjudication, staging, and release.
- **`process`**: how work is modelled and run. Covers BPMN and DMN, roles and task authorization, workflow-engine state, and the methodologies a process adopts (RACI, CRDM, spec-kit, SWOT, Kepner-Tregoe, MADR).
- **`tools`**: how a capability becomes a Tool node and an MCP service, and how that service is deployed and authenticated.
- **`kg`**: how the graph is declared, placed, read, restructured, exported and audited, including skill registration and placement.
- **`library`**: how a source is acquired, uploaded, described by metadata in the KG, and held in `library/`. The harness holds the **basic** flow; core holds the detailed methods (§3).
- **`content`**: how content is authored, reviewed, validated and published, independent of content type (lifecycle, voice review, technical writing). Higher instances put their content-type packages here.
- **`ui`**: how the corpus is rendered, published and presented: the docs site, viewers, boards and themes.
- **`conduct`**: how an agent behaves: interaction, confirmation, memory, reporting, swarms and security.

Topics that already exist in `cat-harness/skills/skills.json`: `kg`, `library`, `ui`, `conduct`, `process`. PR0 creates `sdlc`, `tools` and `content`.

Harness paths per group. Every group sits at the same path in each subgraph kind:
- skills: `skills/<g>/<package>/`
- processes: `processes/<g>/` (a DMN goes in `processes/<g>/decisions/`)
- schemas: `schemas/<g>/`
- unit tests: `scripts/tests/<g>/`, and e2e tests: `test/<g>/` (§4 issue 5)
- UML: generated, one pair `uml/overview/cat-harness/<entry-id>.{puml,mmd}` per declared sub-subgraph. That is `bvhf`'s generator, so no hand work.

Harness skill packages per group (bodies after the moves; `d` = detail file):

| group | skill packages | bodies |
|---|---|---|
| `sdlc` | `sdlc-core` (23+1d), `work-plan` (7), `qa` (15+2d) | 48 |
| `process` | `process-core` (6), `raci` (1), `workflow` (9), `crdm` (6), `spec-kit` (1) | 23 |
| `tools` | `mcp` (5) | 5 |
| `kg` | `kg-core` (22), `graph-management` (6), `kg-navigation` (1) | 29 |
| `library` | `library-core` (11) | 11 |
| `content` | `content-lifecycle` (8, §4 issue 1), `voice-review` (3), `authoring` (1) | 12 |
| `ui` | `ui-core` (16), `theming` (8) | 24 |
| `conduct` | `conduct-core` (16), `security` (3) | 19 |
| **total** | | **171** |

Harness processes, schemas and tests per group:

| group | processes (BPMN + DMN) | schemas (heuristic) | tests (heuristic) |
|---|---|---|---|
| `sdlc` | 16 + 1 | 26 | 119 |
| `process` | 13 | 11 | 41 |
| `tools` | 0 | 6 | 15 |
| `kg` | 4 + 3 | 26 | 109 |
| `library` | 4 | 17 | 40 |
| `content` | 3 | 2 | 6 |
| `ui` | 7 | 16 | 116 |
| `conduct` | 0 | 2 | 10 |
| **total** | **47 + 4** | **106**, plus 28 schemas that belong above the harness (§4 issue 4) | **456**, plus 85 whose subject is above the harness (they stay with their code) |

The 171 skill bodies and 113 moving up make 284, which equals today's total (`assign.py`). The 47 BPMN staying and 19 moving make 66, again equal to today's total.

Harness methodologies and `library/` sources per group:

| group | methodologies (flat, not split) | `library/` sources (§4 issue 3) |
|---|---|---|
| `kg` | `lsi`, `correspondence-analysis` | 5 (`deerwester…`, `landauer…`, `qi-hessen…`, `arxiv-0909.4061v2`, `arxiv-2202.02427v1`) |
| `process` | `dmn`, `raci`, `rasci`, `swot`, `kepner-tregoe`, `madr`, `specification-compiled-agents`, `hybrid-llm-deterministic` | 5 (`dusengumuremyi…`, `gurel-tat…`, `sammut-bonnici…`, `arxiv-2607.14456v1`, `arxiv-2508.05192v2`) |
| `library` | `skill-pipeline-subject-indexing`, `consensus-grounded-subject-evaluation` | 5 (`arxiv-2504.19675v2`, `2504.21474v1`, `2605.03537v1`, `2504.07199v3`, `2606.04382v1`) |
| `ui` | `wiregen` | 1 (`arxiv-2312.07755v1`) |

**Methodologies are not split** (13 files). The owner's split list (*schemas, skills, uml, processes, library, tests*) does not name them. The table records each methodology's group so that its cited `library/` sources can follow (§4 issue 3). Each of the 16 sources is cited by one group only (`git grep` over `methodologies/` and `skills/`).

The members each higher instance adds, as members of the harness groups:

| instance | skills | processes |
|---|---|---|
| core | `content/`: `folio-document-adapter` (4), `folio-editorial` (14), `one-voice` (3), `content-lifecycle-ext` (2); `library/`: `cataloguing` (8+1d), `ingestion` (2 + new `l1-document-ingestion`); `ui/boards` (2); `conduct/onboarding` (2) | `content/` (6 + 4 DMN), `library/` (4 plus the new `l1-document-ingestion`, beside the existing `deep-document-research`), `ui/` (3 boards), `conduct/` (getting-started + 2 DMN) |
| sci | `content/`: `folio-paper-adapter` (46+4d), `authoring-math` (3), `paper-editorial` (6), and the 3 `claude-scientific-skills` packages | `content/` (2 + `lean-build-gate.dmn`) |
| smart-base | `content/authoring-who-smart-guidelines` (8) | `content/l2-dak-authoring.bpmn` |
| fhir-harness | `content/fhir-ig-authoring` (4) | `content/` (`l3-fhir-pipeline`, `ig-incremental-build`) |
| large-datasets | `sample-import` joins the existing flat package | – |

The existing directories in higher instances stay as they are: sci's `skills/lean/`, `skills/data/` and `skills/voices/`, and smart-base's `methodologies/processes/`. They are declared by their owner (`cmsl` round 4). Re-homing them is not part of this proposal.

### 1.3 Primary homes for items that fit two groups

`9umr` measured that 87 skills fit two groups. The table in `assign.py` picks one primary home for each. These are the choices a reviewer is most likely to question. Each has a one-line reason:

| item | home | reason |
|---|---|---|
| work-plan skills (`todo-manager`, `bean-*`, `idle-backlog`, `pending-show`, `session-intent`, `activity-log`) | `sdlc/work-plan` | They are the planning and tracking phase of the lifecycle. |
| `opening-brief`, `turn-reporting` | `conduct` | They govern how an agent reports, not what is shipped. |
| QA and adjudication skills | `sdlc/qa` | Verification is a lifecycle phase. `adjudication` and `criterion-adjudication` are called by both SDLC and content processes. |
| `branch-freshness`, `code-review-process`, `release-lifecycle`, `release-epic-planning` | `sdlc` | They are filed under `process/workflow` today, which the review found to be a misfiling. |
| `deployment-auth` | `tools/mcp` | Candidate for `cat-harness-tools` later. |
| `code-lists`, `glossary-terms`, `translation-manager` | stay in `library` | Least churn. |

---

## 2. Staged PRs, in dependency order

**Ordering principle.** Moving something up creates an upward edge wherever a harness file still names it. Each PR therefore moves the **references together with the subject**, using the overlay mechanisms built in PR0. The intended property is that no PR adds an upward reference that a later PR has to remove.

That changes three things in the suggested order:
- A mechanism PR (PR0) comes first.
- The role edges naming a skill move in the same PR as the skill. PR4 then moves only whole roles.
- The materialization contract (PR5) lands before the library split (PR6), because the basic ingestion flow in the harness refers to it.

**Common to every PR:**
- Skill ids and paths follow location, so every rewrite is a codemod over `git grep` hits.
- Generated trees are regenerated, never hand-edited: `cat-harness/docs/reference/**`, `uml/`, translation POT/PO files, `glossary/generated/**`.
- `beans/**` is history and is **not rewritten**. The bean store has 112 files naming `skills/folio-core/` alone.
- **kg-qa sidecars.** A moved subject strands its sidecar as SUBJECT GONE, and deleting one needs owner approval (`9umr`, `deletion-requires-confirmation`). Instead, each PR **relocates** the sidecar using `lps0`'s identity-checked relocation (`scripts/tests/sidecar-relocation.test.ts`). That relocation is currently exercised within one instance only. A cross-instance move is PR0's falsifier.
- **Gates that break on every move:**
  - `skill:register:check`, `skills:docs:check`, `docs:harness:check`
  - `kg:audit:check`, `kg:audit:all:check`, `check:orphan-verdicts`
  - `check:stale-paths`, `check:declared-paths`, `check:partition` (the prefix lists in `scripts/partition/instance-rules.ts`, lines 1641, 1654 and 1715)
  - `uml:overview:check`, `lsi:skills:check`, `glossary:check`, `translation:pot:check`
  - `bun test`

### PR0: mechanisms, with no content moved

| part | what | files | references to update | gates most likely to break |
|---|---|---|---|---|
| 0a | **The checkout aggregates** (`cmsl` option A, step 3, owner round 3). `folio-assistant.json` `needs` every staged instance. Corpus-wide tools resolve over the root overlay. The 19 upward `scope: repository` mirrors are removed from `cat-harness.json`. The 7 root-level entries (`fsh-guts`, `beans`, `todos`, `memory`, `interaction`, `issue-marks`, `root-docs`) move to `folio-assistant.json`. A check refuses any new mirror. | `folio-assistant.json`, `cat-harness/cat-harness.json`, the new helper (`checkoutDirectoriesForGraph`), and the ~25 call sites the `cmsl` proposal names | `INSTANCE_ROOT = cat-harness` in the corpus-wide scripts (for example `check-workflow-refs.ts`); `kgDirectories` / `workflowDirs` consumers | `check:declared-dirs`, `check:harness-dirs`, `harness:dirs:check`, `check:instance-graph`, `check:subgraph-coverage`, `check:declaration-claims`, `kg:audit:*`; the tests `resolution-across-needs`, `own-kg-roots`, `harness-config` |
| 0b | **Overlay by id** for `scenarios/roles.json` and `scenarios/actors/*.json`. A higher instance's entry with an existing harness id *extends* it: it adds `skills` to a role, or `roles` to an actor. It overrides nothing else. This is the same id-matching rule as directory overrides and `inherits`. It does **not** restore `roles:` in skill front matter (beans `tuvg` and `v625`). | `schemas/role-graph.ts` (`readRoleGraph`, `readActors`); `kg-audit.ts` already walks per-dependency role graphs (line 2539) | `raci-chart.ts`, `stakeholder-map.ts`, `kg-export.ts`, `check-fallback-roles.ts` | `check:raci`, `check:actor-reach`, `check:fallback-roles`, `check:lane-documentation`, `kg:audit:check` |
| 0c | **Sub-subgraph declarations for the other kinds.** `declarationFile` for `processes` (`processes.json`), `schemas` (`schemas.json`), `library` (`library.json`), and for the test directories. The `concern-group` code list. Member resolution at the nested level, so that core's `skills/library/` is a member of the harness's `library` sub-subgraph. The `sdlc`, `tools` and `content` topics are declared in the PR that first fills them ("declare only what exists"). | `schemas/graph-kind-registry.ts`, `schemas/cat-harness.ts` (`resolveDirectories`), `scripts/skill-topics.ts`, `code-lists/concern-group` | – | `check:layout-norms` (it rejects a nested declared directory unless the kind declares it from within), `check:subgraphs`, `code-lists:check`, `uml:overview:check` |

**Falsifiers:**
1. From the checkout root, these must be **identical** before and after PR0, because nothing moved: the `knownSkills` set, the `workflowFiles` set, each role's resolved skills, and the `kg-export` node count.
2. From `cat-harness` resolved alone, nothing in a higher instance may be visible. The `cmsl` falsifier is that a split checkout sees less.
3. A sidecar relocated across instances keeps its verdict. If it cannot, PR1 needs the owner's approval for the orphaned sidecars before it can land.

### PR1: content-type skill packages move up

| from | to | files |
|---|---|---|
| `skills/folio-paper-adapter/` (50 bodies incl. 4d, and 16 `.ts`) | `folio-assistant-sci/skills/content/folio-paper-adapter/`, except `document-intake` → `folio-assistant-core/skills/library/ingestion/` | 66 |
| `skills/authoring-math/` | `folio-assistant-sci/skills/content/authoring-math/` | 5 |
| `skills/{hypothesis-generation,scientific-critical-thinking,scientific-visualization}/` and `remote-packages/claude-scientific-skills.json` | `folio-assistant-sci/skills/content/…` | 62 + 1 |
| `skills/authoring-who-smart-guidelines/` | `smart-base/skills/content/authoring-who-smart-guidelines/` (8); `fhir-harness/skills/content/fhir-ig-authoring/` (`fhir-validation`, `ig-publication`, `l3-fhir-authoring`, `terminology-management`); `folio-assistant-core/skills/content/content-lifecycle-ext/` (`quality-control`), all per #1702 | 15 |
| `skills/remote-packages/smarter-fhir.json` | fhir-harness | 1 |
| `skills/folio-document-adapter/` | `folio-assistant-core/skills/content/folio-document-adapter/` | 6 |
| `skills/requirements/{fhir-validation,lean-verification}.json` | fhir-harness, sci | 2 |
| `schemas/skills/<skill>/` for the 13 skills above | each skill's new owner | 26 |
| role→skill edges that name these skills | the owners' `scenarios/roles.json` overlays (PR0b) | subset of the 54 |
| kg-qa sidecars | the owners' `test/results/kg-qa/` | 93 |

**References to update** (from `refzones.py`; the counts exclude `beans/`):

| package | total | code | authored docs | qa sidecars | generated reference docs |
|---|---|---|---|---|---|
| `folio-paper-adapter` | 811 refs in 179 files | 7 files | 215 refs | 314 refs | 102 refs |
| `authoring-who-smart-guidelines` | 376 refs in 167 files | 13 files | – | – | – |
| `authoring-math` | 173 refs in 108 files | 14 files | – | – | – |
| `folio-document-adapter` | 175 refs in 88 files | 5 files | – | – | – |
| `hypothesis-generation` + 2 siblings | ~489 refs in ~134 files | – | – | – | – |

The code sites with hard-coded package names:
- `src/tools/skill-fetch.ts` (19 literals)
- `scripts/gen-skill-docs.ts`, `init-folio.ts`, `known-skills.ts`, `kg-audit.ts`, `check-reference-direction.ts` (6), `partition/instance-rules.ts`
- `schemas/assistant-package.ts`, `assistant-workflow.ts`
- `src/impact/stakeholder-map.ts`, `src/workflow/gate.ts`
- `fhir-harness/tools/index.ts`, `smart-base/tools/index.ts`
- 8 test files: `skill-coverage`, `skill-manifest-coverage`, `workflow-skill-refs`, `workflow-gate`, `manifest-remote-resolution`, `remote-skill-servable`, `tools`, `kg-audit-orphan-sweep`

**Gates most likely to break:** the common set, plus `check:remote-skills`, `check:workflow-refs`, `check:skills`, `check:voice-skills`.

**Falsifiers:**
1. Every moved skill's `skill_fetch` returns a byte-identical body from its new holder.
2. The `knownSkills(checkout)` set is unchanged.
3. `git grep -E 'cat-harness/skills/(folio-paper-adapter|authoring-math|authoring-who-smart-guidelines|folio-document-adapter|hypothesis-generation|scientific-critical-thinking|scientific-visualization)/'` finds nothing outside `beans/`.
4. `cat-harness.json` gains no entry.

### PR2: split `folio-core` and regroup the harness skill topics

| from | to | bodies |
|---|---|---|
| `skills/folio-core/` (90 files) | harness `sdlc/sdlc-core` (19), `sdlc/work-plan` (7), `sdlc/qa` (15+2d), `tools/mcp` (5), `conduct/conduct-core` (+5), `content/voice-review` (3), `content/authoring` (1), `ui/ui-core` (+1), `library/library-core` (+1, `upload-routes`) | 57+3d |
| same | core `content/folio-editorial` (14), `content/one-voice` (3) | 17 |
| same | sci `content/paper-editorial` (6) | 6 |
| `delivery-summary` | stays in harness `sdlc` (§0); new core skill `block-change-summary` (§2 of the old body) | 1 → 1 + 1 new |
| `process/workflow/{branch-freshness,code-review-process,release-lifecycle,release-epic-planning}` | `sdlc/sdlc-core` | 4 |
| `crdm/`, `spec-kit/` | `process/crdm/`, `process/spec-kit/` | 7 |
| `content-lifecycle/` | `content/content-lifecycle/` (8, §4 issue 1); `evidence-appraisal` → core `content/content-lifecycle-ext`; `sample-import` → `large-datasets/skills/` | 10 |
| `conduct/conduct-core/{getting-started,repo-conversion}` | core `conduct/onboarding/` | 2 |
| `ui/ui-core/{board-windows,board-diagram-interchange}` | core `ui/boards/` | 2 |
| `folio-core` 5 + scattered `.ts` siblings | move with their skill | – |

**References to update:**

| path | total | zone breakdown |
|---|---|---|
| `skills/folio-core/` | 1,568 refs in 423 files | 447 in 84 qa sidecars; 190 in 90 generated docs; 378 in 34 authored docs; 168 in 50 skill files; 139 in 10 JSON; 71 in 37 code files; 169 in 112 bean files (history, left alone) |
| `AGENTS.md` | 20 | – |
| `.claude/`, `memory/`, `todos/` | 33 refs in 28 files | – |
| `skills/crdm/` | ~167 | – |
| `skills/content-lifecycle/` | 144 refs in 59 files | – |

The code files include `rbac.ts`, `mcp/project.ts`, `sessions/staleness.ts`, `upstream/pins.ts`, `schemas/voices.ts`, `schemas/voice-skill.ts`, the `check-bean-*` family, `claim-bean.ts`, and `test/health/checks.ts`.

**Gates most likely to break:** the common set, plus `check:agents-xref(:strict)`, `check:agent-entry-links`, `check:command-paths`, `skill:commands:check`, `agent-memory:check`, `check:bean-restates-skill`, `check:ready-to-close`.

**Falsifiers:**
1. No `folio-core/` directory remains.
2. The harness skill count per group equals §1.2 (171 files).
3. The `knownSkills(checkout)` set equals PR1's set plus `block-change-summary`.
4. All eight topics are declared, and each holds at least one package.

### PR3: BPMN and DMN move up; harness processes regroup

**Up** (19 BPMN + 5 DMN):
- sci `processes/content/`: `authoring-a-paper`, `atomic-mass-drift-check`, `lean-build-gate.dmn`
- smart-base `processes/content/`: `l2-dak-authoring`
- fhir-harness `processes/content/`: `l3-fhir-pipeline`, `ig-incremental-build`
- core `processes/content/`: `authoring-a-document`, `content-change-review` + `review-coverage-gate.dmn`, `editing-hci-validation`, `draft-to-publication` + `draft-qa-gate.dmn`, `content-lifecycle`, `evidence-retrieval`
- core `processes/conduct/`: `getting-started` + `folio-intent.dmn` + `pages-live-gate.dmn`
- core `processes/ui/`: the 3 `board-*`
- core `processes/library/`: the 4 `ingest-*`. These are sequenced with PR6, because `document-ingestion.bpmn` calls them.

**Regroup in the harness** (47 BPMN + 4 DMN): into `processes/{sdlc,process,kg,library,ui,content}/`, per §1.2.

**Edits that travel with the moves:**
- `crdm-requirements-definition.bpmn`: `content-graph` → `data-modelling`.
- `review-narrative.bpmn`: its `uses-editorial-review` task moves into core's `content-change-review`, which already calls `review-task`, so the call runs downward.
- `review-task.bpmn`: drop the `semantic-review-scoping` ref. sci's paper process adds scoping by calling `review-task`.
- Lane bindings: **0** staying harness diagrams bind a role that moves (checked against `bpmnrefs.txt`).

**Files:**
- 75 diagrams (66 BPMN + 9 DMN), plus their rendered SVGs under `docs/assets/img/workflows/`, `processes/ns.jsonld` and the README.
- 75 kg-qa process sidecars, which regroup or relocate.
- **References:** each moving diagram has 13–55 referring files. Most refs are regenerated translation catalogues (for example `content-change-review.bpmn`: 485 of ~640 refs). `processes/decisions/` has 186 refs in 83 files. 29 code files name a moving diagram by path, including 11 tests that use folio diagrams as engine fixtures (`getting-started`, `content-change-review`, `workflow-gate`, `task-authorization`, `decision-table`, `corpus-gate`, `log-writer`, `prov-record`, `adjudication-marker`, `bean-link`, `workflow-roles`).

**Gates most likely to break:** `render:bpmn:check`, `processes:viz:check`, `translate-bpmn:check`, `check:workflow-refs`, `check:workflow-coverage`, `check:process-documentation`, `check:lane-documentation`, `check:workflow-paths`, `check:raci`, `kg:audit:check`.

**Falsifiers:**
1. `workflowFiles(checkout)` returns the same set of process and decision ids; only paths change.
2. Every `calledElement` still resolves.
3. `residual.py` reports 0 harness→higher `calledElement` edges, apart from the 4 in `document-ingestion.bpmn` that PR6 removes.
4. `workflow_start` / `workflow_next` on `crdm-requirements` walks the same steps.

### PR4: whole roles, stories, actors and capabilities move up

| kind | moves | to |
|---|---|---|
| roles (14) | `lean-toolchain`, `lean-authoring-agent`, `proof-review-agent`, `compute-authoring-agent` | sci |
| | `clinical-sme` | smart-base |
| | `terminologist`, `fhir-modeller`, `ig-publisher-service` (per #1702's `terminology-management` placement) | fhir-harness |
| | `editorial-authoring-agent`, `review-coordinator`, `board-renderer`, `onboarding-agent`, `deep-researcher`, `evidence-agent` | core |
| stories | 34 (sci 9, smart-base 3, fhir-harness 6, core 16) | with their role |
| actors (9) | `lean-mcp` → sci; `clinical-sme` → smart-base; `terminologist`, `fhir-modeller`, `ig-publisher-service` → fhir-harness; `board-renderer`, `onboarding-agent`, `deep-researcher`, `evidence-agent` → core | – |
| actor→role bindings (5) | `authoring-agent` → 3 roles; `review-agent` → `proof-review-agent`; `technical-officer` → `review-coordinator` | the owners' actor overlays (PR0b) |
| capabilities (11) | `lean-atlas`, `lean-mcp`, `lean-toolchain`, `latex-compiler` → sci; `fhir-validator`, `ig-publisher`, `sushi-compiler`, `java-runtime` → fhir-harness; `smart-base` → smart-base; `pandoc`, `html-pdf-engine` → core | – |
| address-voices (6) | `address-{lean-authoring-agent,proof-review-agent,compute-authoring-agent}` → sci; `address-{fhir-modeller,terminologist}` → fhir-harness; `address-clinical-sme` → smart-base | – |
| remaining role→skill edges | whatever PR1–3 did not carry | overlays |

Three changes from the review in this table:
- `narrative-reviewer` stays in the harness, because the voice machinery stays (§0).
- `technical-officer` stays, because after the overlay all its roles are harness roles.
- The four PDF capabilities (`docling`, `camelot`, `pdfplumber`, `pymupdf`) stay, because the rung code that uses them stays in the harness (§3).

**References to update:** role ids appear in 10 moving BPMN (they have already moved in PR3), 12 actor files, and 59 qa sidecars. `scenarios/roles.json` is referenced by path from 18 code files.

**Gates most likely to break:** `check:raci`, `check:actor-reach`, `check:fallback-roles`, `check:asset-roles`, `check:voices`, `check:voice-skills`, `voices:viz:check`, `check:qa-reviewer-permission`, `kg:audit:check`.

**Falsifiers:**
1. `cat-harness/scenarios/roles.json` holds 34 roles, and every skill it names resolves inside the harness.
2. For every role id, the skills resolved from the checkout equal the skills resolved before PR4.
3. `residual.py` reports role-skill = 0 and actor-role = 0.

### PR5: the materialization and extraction contracts move down (scope per §4 issue 2)

With the recommended option A:
- **State vocabulary** (the states and fixity) moves out of `folio-assistant-core/schemas/materialization.ts` (472 lines) into `cat-harness/schemas/library/materialization-state.ts`. Core's schema imports it, which is a downward import.
- `folio-assistant-core/schemas/extraction.ts` and `folio-assistant-core/scripts/extract-assets.ts` move to `cat-harness`. They are the tool behind the harness's own `asset-extraction` skill.
- `materialize-remote`, `refresh-materialized` and the enumerate/subset logic stay in large-datasets. core's `scripts/sample-import-run.ts` moves beside `sample-import` in large-datasets; that removes 2 core→large-datasets references.

**References to update:** 7 core/who-iris files import `materialization.js`. 2 cat-harness escapes (`scripts/cache-index.ts`, `scripts/tests/materialized-fixity.test.ts`). The `extraction` escape in yj6r's list. The `asset-extraction` skill's two command lines.

**Gates most likely to break:** `check:partition`, `kg:detangle:direction`, `check:materialized-fixity`, `check:catalogue`, `iris:pages:check`, `iris:covers:check`; the tests `remote-content`, `materialization-compiled`, `materialized-fixity`.

**Falsifiers:**
1. yj6r's instance-boundary escape count drops by the `materialization` and `extraction` clusters (3), measured with yj6r's own command.
2. No new cat-harness→core import appears.
3. `cat-harness` resolved alone can type-check `asset-extraction`'s tool.

### PR6: the library/ingestion split (§3)

| part | files |
|---|---|
| `library-core` → core `library/cataloguing/` | 8 bodies + 1 detail (`bib-qa/qa-tags.md`) + `ontologist.ts` |
| `library-core` → core `library/ingestion/` | `tabular-metadata`, with `document-intake` already moved in PR1 |
| `library-ingestion.md` (553 lines) | splits into a basic harness skill (≤ ~120 lines) and a new core skill, `l1-document-ingestion` |
| `document-ingestion.bpmn` | rewritten as the basic harness flow |
| new core `processes/library/l1-document-ingestion.bpmn` | carries the current body and calls the harness basic process and the 4 `ingest-*` subprocesses (already moved in PR3) |

**References to update:**
- `library-ingestion`: 18 files carry 27 refs (history); ~80 authored or generated sites; 9 in BPMN.
- `document-ingestion.bpmn`: 77 refs in authored docs, 255 in translations, 12 in code.
- `library-core/`: 340 refs in 94 files.
- The `librarian`, `ingestion-agent`, `docs-authoring-agent` and `integration-watcher` role edges to the moved skills go to core's overlay.

**Gates most likely to break:** the common set, plus `check:workflow-refs`, `translate-bpmn:check`, `check:l1-complete`, `upload-step:docs:check`, `check:upload-names:check`, `library:readmes:check`, `check:methodology-evidence`.

**Falsifiers:**
1. `methodology-from-source.bpmn`'s `calledElement="Process_Ingestion"` still resolves to the **harness** file.
2. `bun run ingest uploads/<fixture>.pdf --dry-run` picks the same rung before and after.
3. `residual.py` reports 0 edges from `document-ingestion` to a higher instance.

### PR7: tests split along the same groups (§4 issue 5)

- Move the 476 unit tests from `scripts/tests/` into `scripts/tests/<group>/`, and the e2e tests from `test/*.e2e.ts` into `test/<group>/`. `test/health/` joins `test/sdlc/`.
- First-pass counts from `tests.py`, 541 files in all:

| group | files |
|---|---|
| `sdlc` | 119 |
| `ui` | 116 |
| `kg` | 109 |
| `process` | 41 |
| `library` | 40 |
| `tools` | 15 |
| `conduct` | 10 |
| `content` (voices) | 6 |
| subject above the harness, code in the harness (stay under `content/`) | 85: core-content 48, sci 24, smart/fhir 11, boards 2 |

- **A test follows the code it tests, not the concept.** The `lean-*` tests exercise `cat-harness/scripts/*`. They move up only when the code partition (#223, yj6r) moves that code.
- **References to update:**
  - relative imports: one extra `../` in every moved file
  - `run-tests.sh` / `.bat`
  - the Playwright `testDir`
  - CI workflow globs
  - the `check:partition` test-module prefix `scripts/tests/`
  - `@covers` declarations, which `audit:coverage` reads
- **Gates most likely to break:** `bun test`, `bun run gates --all` (Playwright), `check:ci-invocations`, `check:workflow-script-paths`, `check:code-accounting`, `audit:coverage:require-all`, `audit:coverage:strict`, `bat:sync:check`.
- **Falsifier:** the number of test cases **executed**, and the set that passes, are identical before and after, for both `bun test` and Playwright. A test that silently stops being discovered is the failure this PR is most likely to cause.

### PR8: schemas regroup, library sources, declarations, UML and cleanup

**Schemas.**
- 106 harness schemas move to `schemas/<group>/`, with the `index.ts` barrel re-exporting old names for one release.
- 875 importing files are rewritten; `schemas/cat-harness.ts` alone has 183 sites, and `builders.ts` 162.
- The 28 schemas that belong above the harness are placed per §4 issue 4.
- `schemas/skills/<skill>/` stays keyed by skill, because skill front matter names `input:` by that path.

**Other parts.**
- `library/` sources regroup per §4 issue 3.
- `processes.json`, `schemas.json`, `library.json` and the test declaration list their members.
- UML is regenerated.
- The ~50 per-instance entries that `1g4s` found redundant are removed. `1g4s` folded that job into this split.

**Gates most likely to break:** `bootstrap:schemas:check`, `kg:schema:check`, `check:schema-nodes`, `check:kind-validators:require-all`, `external-schemas:check`, `typecheck`/`lint`, `check:module-scope-resolution`, `check:portable-paths`, `library:readmes:check`, `check:source-licence`, `check:methodology-evidence`, `uml:overview:check`.

**Falsifiers:**
1. `tsc` passes with the barrel **removed** in a scratch run. This proves every import was rewritten.
2. `kg-export` has the same Schema node count and ids.
3. `uml:overview:check` emits one `.puml`/`.mmd` pair per declared sub-subgraph and none for an undeclared one.

### PR9 (follow-up): docs pages follow their subject

The harness docs folio still documents the moved processes. Under `1g4s`, a dependent's `docs/` is a named member of `docs`, so each page moves to its owner's `docs/`. Nothing is lost from the site.

| docs folio pages | to |
|---|---|
| `guides-writing-a-paper` (44) | sci |
| `guides-who-smart-dak` (17), `guides-who-smart-ig` (23), `ig-publisher` (20), `fhir-content` (20) | smart-base / fhir-harness |
| `guides-writing-a-document` (43), `content-types` (32), `evidence` (29) | core |
| `document-ingestion` (38) | split per §3 |

**Falsifiers:**
1. `docs:pages:check` and `translated-links:check` are green.
2. The published site's page count is unchanged.

---

## 3. Library split, per the ruling

The ruling (owner, verbatim):

> "only basic doc ingestion high level workflow in cat-harness. very little process context assumed. just that the uploaded asset has extracted metadata inserted into KG and asset in library/ (if materialized). more detailed doc ingestion/cataloguing methodologies in folio-asst-core. refinements/new skills for basic process depending on context / content type."

### 3.1 What stays in the harness: the basic workflow

The basic process is `upload → metadata extracted into KG → asset in library/ if materialized → hand off`. The harness keeps these nodes:

| node | role in the basic flow |
|---|---|
| `content-acquisition` (skill + `.bpmn`) | accept an offered resource, or ask for one. Unchanged. |
| `upload-routes` (from folio-core), `upload-naming`, `uploads-watch` | how bytes reach `uploads/`, what they may be called, and how an arrival is noticed |
| `asset-extraction` | **the metadata step**: a container's index goes into the KG, and its contents do not unless asked for (owner, 2026-09-20). Its tool, `extract-assets.ts` + `extraction.ts`, comes down in PR5. |
| `library-ingestion` (**slimmed**) | the basic entry point. It states the flow above and names the `library/` layout, the `materialized` state (PR5) and `bun run ingest` as the command. It carries nothing about rungs, L1 entries, narratives or image verdicts. |
| `document-ingestion.bpmn` (**rewritten**) | it **keeps `Process_Ingestion`** as its id, so `methodology-from-source.bpmn`'s call still resolves. Its tasks: Accept (skill `upload-routes`) → Extract metadata into KG (`asset-extraction`) → Materialized? (gateway) → Place in `library/<slug>/` (`library-ingestion`) → end event *"asset catalogued"*. It calls **no** `ingest-*` subprocess and makes no content-type decision. |
| `literature-search` | stays because `options-analysis.bpmn` (harness) names it |
| `adopt-methodology-from-source`, `glossary-terms`, `code-lists`, `translation-manager` (+ its two BPMN) | harness information management that is not document ingestion |
| rung **code** (`scripts/ingest-document.ts`, `pdf-*.py`, `notebook-structure.ts`) and the 4 PDF capabilities | stay. The ruling moves *methodologies*, not tooling, and `library-ingestion.md` records the owner's standing instruction *"OCR stays here"*. The core methodology invokes harness code, which is a downward edge. |

**New generic artefacts the harness needs:** none beyond the rewrite of `document-ingestion.bpmn` and the slimmed `library-ingestion.md`, plus the moved-down `materialization-state.ts` and `extraction.ts`.

The mechanism for *"refinements depending on context / content type"* is inversion. A higher-layer process **calls** `Process_Ingestion` as its first step, then continues with its own work. Nothing in the harness names a refinement, because there is no BPMN extension-point mechanism in the corpus (grep: 0 hits for "extension point" in `processes/`, `skills/process/` and `src/workflow/`), and a harness process that named a core process would be an upward edge.

### 3.2 What goes to core: the detailed methods

**`library/ingestion/`:**
- `document-intake` (PR1)
- `tabular-metadata`
- new `l1-document-ingestion`: the rung table, the "inferred structure is refused" rule, the complete L1 entry, the `source{}` and `provenance` blocks, archives, the dataset-narrative state machine, and image and vector-label arms. This is §§ "Which rung" through "An `.xlsx` IS a zip" of today's `library-ingestion.md`.

**`library/cataloguing/`:**
- `filing-dublin-core`, which goes beside core's existing `schemas/dublin-core.ts`
- `bib-qa` (+ its detail file), `bib-human-review`, `bib-photo-ingestion-watcher`
- `glossary-build`, `ontologist`
- `archiving-arxiv`, `archiving-web-pages`, which are source-specific acquisition refinements

**`processes/library/`:**
- the 4 `ingest-*` subprocesses
- new `l1-document-ingestion.bpmn`: it calls harness `Process_Ingestion`, then extract-structure, derive-content, build-L1-KG and the L1 completeness gate. The theme branch calls harness `ingest-theme.bpmn`, which is a downward call.
- the existing `deep-document-research`

**Beyond core:** sci's `data/reference-dataset-ingestion` and large-datasets' `sample-import`, `materialize-*` and `copy-out-materialized` are content-type and corpus refinements that already sit above core.

---

## 4. Issues to resolve

Five issues are open. The corpus settles everything else, and §0 records those decisions.

**1. Where does `content-lifecycle` live?**

*Context.* The eight generic lifecycle skills (`content-author`, `-feedback`, `-plan`, `-publish`, `-retire`, `-review`, `-test`, `-validate`) have their bodies in the harness. #1702 put 7 of their JSON definitions in **core**. Six diagrams that stay in the harness name them 8 times:
- `adjudication` → `content-feedback`
- `narrative-code-review` → `content-feedback`
- `qa-report-signing` → `content-test`
- `upstream-version-adoption` → `content-test`
- `review-narrative` → `content-feedback`, `content-review`
- `review-task` → `content-review`, `content-validate`

`9umr` names "content authoring" as a harness group. Without these skills, that group would hold 4 skills.

*Options:*
- **A (Rec.)** Keep the bodies in the harness under `skills/content/content-lifecycle/`. Move the FHIR, Lean and qou bullets out into the owners' refinement skills. Move the 7 definitions back to `cat-harness/skills/skill-definitions/`. This reverses part of #1702.
- **B** Move everything to core, and point the 6 harness diagrams at harness-native skills (`adjudication`, `qa-witness`, `code-review-process`).
- **C** Split each skill into a generic harness stub and core sections.

*Default:* A.

**2. How much of materialization moves down (PR5)?**

*Context.* The ruling puts "asset in library/ (if materialized)" in the basic flow. `library-ingestion.md` records the owner's 2026-09-20 rule that core owns the remote half. The review's evidence for a full move ("bootstrap uses it") is stale (§0). `materialize-remote.bpmn`'s `Task_Enumerate` depends on large-datasets' `source-descriptor`.

*Options:*
- **A (Rec.)** Move down only the state vocabulary (states and fixity). The five-gate process stays in large-datasets.
- **B** Move `materialize-remote` and `refresh-materialized` (skill and 2 BPMN), `materialization.ts` **and** `source-descriptor.ts` down. This is the review's proposal, and it also drags the enumerate/subset question into the harness.
- **C** Move nothing, and treat "materialized" as "a file exists in `library/`".

*Default:* A.

**3. Do the `library/` sources split by group?**

*Context.* The owner asked for `library` to be split into groups, and `9umr` says grouping is "built into location". The ingestion ruling says the basic flow assumes only `library/`. The harness `library/` holds 16 sources, each cited by one group (§1.2). About 20 scripts walk `library/*/` one level deep, including `library-readmes.ts`, `lsi.ts`, `check-methodology-evidence.ts`, `library-graph.ts` and `ingest-document.ts`.

*Options:*
- **A (Rec.)** Split physically into `library/<group>/<slug>/`. The basic flow lands new assets at `library/<slug>/`, and filing an asset into a group is a cataloguing refinement in core. `library.json` names the group members so a walker can tell a group directory from a source directory.
- **B** Keep `library/` flat and declare group membership in `library.json`. This contradicts "built into location".
- **C** Split, and make the basic flow require the caller to name a group.

*Default:* A.

**4. When do the 28 schemas that belong above the harness move?**

*Context.* The 28 schemas are:
- 12 content: `block-kinds`, `builders`, `front-matter` and others
- 5 boards
- 7 DAK/IG/FSH
- 4 sci: `lean-packages` and others

Harness code imports them: `builders` from 162 files, `block-kinds` from 13, `lean-packages` from 11. Moving a schema without its importers creates cat-harness→higher imports, which `kg:detangle:direction` (p11x) rejects.

*Options:*
- **A (Rec.)** Regroup them in place now, under `schemas/content/` and `schemas/ui/`. Record their target instance in `partition/instance-rules.ts`, and move them with their importers in the code partition (#223, yj6r).
- **B** Move them now together with their importing code. This turns a KG restructuring into the code split.
- **C** Move them now and shim the imports. The direction gate fails.

*Default:* A.

**5. Where do unit tests live?**

*Context.* 476 of the 572 `*.test.ts` files sit flat in `cat-harness/scripts/tests/`. The declared tests subgraph is `test/` (id `cat-harness-tests`), which holds e2e tests, health checks and `results/`. The owner asked that tests "split along same semantic lines as skills".

*Options:*
- **A (Rec.)** Put unit tests in `scripts/tests/<group>/` and e2e tests in `test/<group>/`, with the same group ids. Each move adds one `../`, and the tests stay beside `scripts/`.
- **B** Put everything in `test/<group>/`. That re-roots 476 files and rewrites every relative import to `scripts/`.

*Default:* A.

---

## 5. Cross-layer references that remain after all the moves

`residual.py` measures references from files that stay in the harness to anything placed above it. The table gives the count **today** (with the moves applied on paper and no rewrites done), and how each is brought to zero. The target is **zero upward references from cat-harness** across BPMN skill refs, call activities, lanes, `roles.json`, actors, skill links and `cat-harness.json`.

| kind | today | resolution | PR | after |
|---|---|---|---|---|
| role → skill edges (in 18 staying roles; targets: core 28, sci 20, fhir-harness 4, smart-base 2) | 54 | move each edge to the owner's role overlay | PR0b, PR1–4 | 0 |
| actor → role bindings (`authoring-agent` ×3, `review-agent`, `technical-officer`) | 5 | actor overlay | PR4 | 0 |
| BPMN `skill ref`: `crdm-requirements-definition`→`content-graph`, `review-narrative`→`uses-editorial-review`, `review-task`→`semantic-review-scoping`, `document-ingestion`→`document-intake` | 4 | `data-modelling`; task moves to core `content-change-review`; ref dropped; basic rewrite (§3) | PR3, PR6 | 0 |
| BPMN `calledElement`: `document-ingestion` → 4 `ingest-*` | 4 | core `l1-document-ingestion` calls the harness process instead | PR6 | 0 |
| BPMN lanes bound to a moving role | 0 | – | – | 0 |
| skill-to-skill links from staying harness skills | 20 | the higher skill links down; the harness mentions it by name only or drops the link | same PR as each target | 0 |
| harness text naming higher files by path (the review's 18) | 18 | 11 go with moved files; `library-ingestion`, `document-ingestion.bpmn:86` rewritten (PR6); `docs-auto`/`incremental-render` (the who-iris example), `instance-publication` (`ig-publisher-reduction`) and `skill-voice-review` (agent-skills voices) generalised; `technical-documentation` link dropped (§0) | PR1–6 | 0 |
| `cat-harness.json` `scope: repository` entries into higher instances | 19 (+7 at the root) | the checkout aggregates | PR0a | 0 |
| **Not yet at zero: out of scope for this programme** | | | | |
| code imports cat-harness → core schemas (yj6r) | 15 | PR5 removes the materialization and extraction ones (3). The other 12 (external-schema 3, dublin-core 2, fhir-artifact-index 2, glossary 2, library-ref 1, changeset 1, glossary-page 1) stay with yj6r / #223 | PR5, then yj6r | 12 |
| harness tests and code that name moved diagrams by path (11 test fixtures, 18 code/docs-folio files) | 29 files | resolve by process id through the checkout overlay. Tests are exempt by partition rule, but fixtures should be local before the repository cut | PR3 (ids); #223 | 0 path refs; fixtures flagged |
| harness docs-folio pages about moved processes | 9 page groups | move to the owners' `docs/` | PR9 | 0 |
| named-folio wording in harness text (qou 27, who-iris 26, `litlfred/qou` 9, `smart-immunizations` 4, milnorlink 2, CODATA 2) | 70 | generalise the wording as each file is touched. These are citations, not dependencies. `scripts/check-reference-direction.ts` exists to measure them; #1706 records that it is not in CI | rolling | tracked, not gated |

**Residuals one layer up**, found while checking (these are not harness refs):
- `draft-to-publication.bpmn` (→ core) has a `clinical-sme` lane (smart-base) and an `ig-publication` ref (fhir-harness). Resolution: a generic reviewer lane, plus a smart-base variant that calls the core process.
- `content-change-review.bpmn` (→ core) → `semantic-review-scoping` (sci). Resolution: a sci wrapper that calls it.
- core `scripts/sample-import-run.ts` → large-datasets. PR5 moves it.

**Keep it at zero.** After PR8, turn `residual.py`'s five checks into a gate: extend `check-reference-direction.ts`, or add `kg:audit` joins. Zero is only durable if a new upward reference fails CI.

---

## 6. Owner rulings, 2026-09-30

1. **content-lifecycle:** A — harness, generalised; the 7 definitions come back down; FHIR/Lean/qou specifics move into owner refinement skills.
2. **Materialization:** A (state vocabulary + fixity down; five-gate process stays in large-datasets), **plus**: *"subscribing to remote KG materializes it (and puts it under library/ as a sub-dir with that chosen sub-graphs/assets etc. even if no assets are materialized, the metadata in subgraphs are)"* — i.e. a remote-KG subscription is a materialization whose minimum is the chosen subgraphs' metadata under `library/<source>/`.
3. **Library sources:** A — physical split `library/<group>/<slug>/`; new uploads land unfiled at `library/<slug>/`; filing is a core cataloguing refinement.
4. **Schemas above the harness:** **B — move now, with their importers** (not deferred to #223/yj6r).
5. **Tests:** A (default) — `scripts/tests/<group>/` unit, `test/<group>/` e2e.
6. **Tools:** *"in general tools can describe their own specific subprocesses if needed to not bog down general skills"*.
7. **Moves:** review → resolve issues → staged PRs (PR0…PR9).
