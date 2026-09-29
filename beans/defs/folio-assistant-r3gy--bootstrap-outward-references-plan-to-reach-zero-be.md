---
# folio-assistant-r3gy
title: 'BOOTSTRAP OUTWARD REFERENCES: plan to reach zero before the repo split'
status: in-progress
type: task
priority: normal
created_at: 2026-09-29T18:18:26Z
updated_at: 2026-09-29T22:15:52Z
parent: folio-assistant-vke6
---

## Why

`bootstrap/` is the floor (`needs: []`) and is meant to become `litlfred/bootstrap`. An analysis on 2026-09-29 (artifact https://claude.ai/artifact/92M8FmwCJeHUvs6NXutsar, §3) listed 22 places where bootstrap's own files point outside bootstrap or at folio-assistant. Each one dangles once the directory is its own repository. This bean is the plan to remove them, grouped by how each group gets fixed. Sibling `zhg2` measures reference direction across all instances; this bean is the bootstrap-only work to reach zero.

## Groups, in order

### A. Stale text inside bootstrap (content only, no decision)
- [x] `bootstrap.json:2,37` says `workflows/`; the directory is `processes/`
- [x] `bootstrap.json:24` says "ONE entry"; 7 are declared
- [x] `skills/discussion.md:83` says the schemas sit in `bootstrap/skills/`; they are in `schemas/`
- [ ] "the second and last diagram" — NOT a false report, as first recorded: the analysis named the wrong file. It is at `processes/initialize-harness.bpmn:101`. Still to fix (voice pass).
- [x] "CAT_BOOTSTRAP" / "cat-bootstrap" in 3 BPMN files → "bootstrap"
- [x] `initialize-harness.bpmn:83` says `kg-navigation`; bootstrap's skill is `bootstrap-kg-navigation`
- [x] README "every file here" table: add `models.json`, `model-registry.schema.json`, `requirement.schema.json`, `glossary-ledger.json`, `test/results/`

### B. Upward names in bootstrap prose (content only, no decision)
Rule: bootstrap may name a ROLE the Harness plays ("the Harness's README tool"), never a specific artefact of the layer above.
- [x] bean ids `lv3j`, `ug4r` (BPMN comments), `dh4f`, `2krx` (`bootstrap.json:115,122`)
- [x] `readme_sync`, `content-context-and-state-graphs` (`initialize-harness.bpmn:119,121`, `skills/root-readme.md:35,52,66`)
- [x] "data-modelling, step 8" (`skills/log-message.md:19`)
- [x] `models/models.json:3`: `skills/communication-language.md` (does not exist in bootstrap) and `check:model-languages`

### C. Repository-root-relative paths (needs a code change in cat-harness)
- [x] `initialize-harness.bpmn:26` precondition `ref="bootstrap/README.md"` is resolved from the repository root. Make `file-exists` resolve against the INSTANCE root (`src/workflow/process-model.ts`), change the ref to `README.md`, and update `precondition.test.ts:81-102`.
- [x] Prose `bootstrap/README.md` references (`initialize-harness.bpmn:14`, `discussion.bpmn:20`, `scenarios/roles.json:8`, `skills/discussion.md:3`) → `README.md`

### D. Vocabulary bootstrap uses but does not define (design)
- [ ] The 7 graph kinds (`skills`, `schemas`, `scenarios`, `processes`, `models`, `swimlane-glossary`, `qa`) are defined only in `cat-harness/schemas/graph-kind-registry.ts`. `graph.schema.json` should enumerate the kinds bootstrap itself uses (generated, so the Zod source gains the list).
- [ ] `$schema` ids `folio-glossary-ledger/v1` and `folio-model-registry/v1`: bootstrap already ships `model-registry.schema.json`; add the ledger's schema beside it, so every `$schema` a bootstrap file carries resolves inside bootstrap.
- [ ] `theme: "bootstrap"` (`bootstrap.json:30`) is defined in `themes.ts:182`. Treat it as a rendering hint that a harness MAY honour and falls back from, and say so in `graph.schema.json`.
- [ ] `kg-qa/v1` and `kg-qa-manifest/v1` in `test/results/`: these are harness OUTPUT about bootstrap. Depends on decision 2 below.

### E. Published addresses (decision 1)
- [ ] `$id` of all 5 schemas, `processes/ns.jsonld`, BPMN `xmlns:bootstrap.processes` and `targetNamespace`, and the owed `bootstrap.jsonld` are under `https://litlfred.github.io/folio-assistant/bootstrap/`. 71 BPMN files outside bootstrap bind the namespace.
- [ ] `bootstrap.json:36,41` link to `github.com/litlfred/folio-assistant/tree/main/bootstrap`. Repoint to `github.com/litlfred/bootstrap` at the moment that repository is seeded, not before, or the link is broken in between.

### F. Auditor prose in generated sidecars
- [ ] `test/results/kg-qa/scenarios/kg.kg-qa.json` describes `.claude/skills/actors/`, `permissions.json`, `repoRootFor`. The fix is in `kg-audit.ts`'s messages for `repo`-scoped criteria (already recorded n/a for an instance run), not in the sidecar. Moot if decision 2 moves the sidecars out.

## Decisions for the owner
1. **Address base for bootstrap's IRIs** (group E): keep `litlfred.github.io/folio-assistant/bootstrap/` permanently (no consumer changes; folio-assistant's site keeps publishing them), or move to a base owned by the new repo (every one of the 71 bindings changes once).
2. **Where bootstrap's QA sidecars live** (groups D, F): stay in `bootstrap/test/results/` (bootstrap then carries harness output and needs a cross-repo refresh), or move to `cat-harness/test/results/bootstrap/` like the `.pot` templates in #1448 (bootstrap stays authored-only).

## Done when
`graph.test.ts`'s `ALLOW` list needs only the entries decision 1 keeps, and `check:reference-direction --findings` reports no edge from a file under `bootstrap/` to any instance above it.


## Decision 1 — settled by the owner, 2026-09-29

Owner chose option 2: **bootstrap's IRIs move to a base the new bootstrap repository owns** (not `litlfred.github.io/folio-assistant/bootstrap/`). All 71 external `xmlns:bootstrap.processes` bindings change once. Group E proceeds on that basis. Decision 2 (where the kg-qa sidecars live) remains open; group D design dispatched to an agent.

Groups A and B authorised to start (owner: "Do A B").

## Groups A and B — done (2026-09-29)

- A: `bootstrap.json` `_comment` rewritten for 7 directories and 3 processes; "ONE entry" and the `workflows/` note fixed; `discussion.md` points at `schemas/`; `CAT_BOOTSTRAP` / `CatBootstrap` / `cat-bootstrap` → bootstrap; `kg-navigation` → `bootstrap-kg-navigation`; README file table gains 5 rows.
- A, beyond the list: `bootstrap.json:2` also said "two directories" and "TWO processes", and named cat-harness as the layer composed on top. All three corrected.
- B: bean ids `lv3j`, `ug4r`, `dh4f`, `2krx`, `46uh` removed; `readme_sync` → "the harness's own README tool"; `content-context-and-state-graphs` → "its own skill on context and state"; "data-modelling, step 8" dropped; `models.json` no longer names `check:model-languages` or `skills/communication-language.md`; `skill_fetch` and `beans` → "skill-fetching tool", "work-plan store".
- Regenerated with their own tools, not by hand: 15 `.pot` templates (`translate-bpmn.ts --instance ./bootstrap --extract`) and 7 bootstrap kg-qa sidecars (`kg:audit:all`; only `source_hash` changed, no verdict).
- Still present by design: `kg-audit.ts`-era wording is gone, but `bootstrap.json`'s `qa` description still describes the auditor generically; that directory is decision 2.

## Group C — done (2026-09-29)

- `file-exists` preconditions now resolve against the INSTANCE that owns the diagram, found at parse time with `findInstanceRoot` (the lookup `checkCodeLists` already used) and carried on the check as `base`. `evaluatePrecondition`, `evaluatePreconditions` and `preflight` no longer take a root, so no caller can resolve against a different directory.
- Parse now refuses: a ref that is absolute or has a `..` segment, and a file check on a diagram no instance declaration owns.
- `initialize-harness.bpmn`: `ref="bootstrap/README.md"` -> `ref="README.md"`. Four prose mentions -> "bootstrap's README.md". `processes/ns.jsonld` now says what `ref` is relative to.
- Sabotage: resolving against the working directory fails 3 tests; dropping the `..` guard fails 1; dropping the no-owner guard fails 1.
- The GitHub link at `bootstrap.json:41` is group E and stays for now.

## Decision 2 — settled by the owner, 2026-09-29

Owner chose: **move bootstrap's kg-qa sidecars to `cat-harness/test/results/bootstrap/`**, as #1448 moved the `.pot` templates. This takes `qa` out of D1, the `kg-qa` tags out of D2, and makes group F moot.

## Group D design (agent, 2026-09-29) — recommended order D3 → D4 → D1 → D2 → E

- **D4 (move sidecars):** `kgQaHomeFor(instanceRoot, hostRoot)` modelled on `translationsHomeFor` (own | hosted | convention); `kg-audit.ts` writes sidecars, manifest and orphan sweep under the hosted home, OUTSIDE cat-harness's own `test/results/kg-qa/` so its sweep does not claim them; drop `qa` from `bootstrap.json`; `git mv` 16 files; regenerate audit-coverage, UML overview, harness data, census.
- **D1 (graph kinds):** `BOOTSTRAP_GRAPH_KINDS` in `graph.ts`, one plain sentence per kind; generator emits `$defs.GraphKind` as an open, documented `anyOf`; registry `summary` sourced from it; closure test that bootstrap uses only its own kinds. Pre-existing defect confirmed: `termIri` puts every graph kind in the cat-harness namespace (`termLayer` defaults to harness) while `ns-export`'s `GRAPH_KIND_LAYERS` publishes `schemas` and `cat-harness` as bootstrap's; one layer table fixes it; the IRIs themselves move in E.
- **D2 ($schema tags):** unprefixed bootstrap-owned tags (`model-registry/v1`, `glossary-ledger/v1`) resolved by `properties.$schema.const` inside `bootstrap/schemas/`, old tags accepted for one release; test that every bootstrap `$schema` resolves inside bootstrap; remove `ALLOW` for `folio-*/v1`.
- **D3 (theme):** one `Extension` term in `BOOTSTRAP_TERMS`: a field bootstrap does not define, for a harness above, ignored by a reader that does not know it.

## Relevance audit (agent, 2026-09-29) — which files bootstrap's own process reaches

Needed by the steps: README, AGENTS, bootstrap.json, the 3 BPMN files, ns.jsonld, roles.json, graph + discussion schemas, the 5 step skills. Reached by nothing in bootstrap, read only by cat-harness: `models/models.json` + `model-registry.schema.json`, `requirement.schema.json` (owner ruled "1 + 2" on #1164 — only right if bootstrap files its own FR-1..8 as a Requirement), the two graph export/publication skills, `package-manifest.json`, `glossary/glossary-ledger.json` (harness-written state). Owner, 2026-09-29: package-manifest.json "seems out of place"; the two graph skills "may need to be rewritten a bit"; "there needs to be SOMEWHERE (one place only) in bootstrap/ a place the describes the json(ld) setup of the KG with skills etc."; and the corpus's explanation of the self-describing JSON-LD (cat-harness `kg-export.md` §"The graph carries its own vocabulary", `harness-schema-export.ts` header, `content/docs/kgraph/the-taxonomy.md` §Schema, bean x3bd) "should be in bootstrap/ self-documentation". Owner also: `graph.schema.json#/$defs/KnowledgeGraph` "doesnt declare node types" — confirmed: every `$defs` entry is title + description only, and cat-harness's `BootstrapGraphNodeSchema` requires only `@id` + `@type`. The published graph has 8 node types (Asset, Directory, GraphKind, Process, ProcessNode, SequenceFlow, Role, Skill) whose shapes nothing declares; the schema says "Subgraph" where the graph says "Directory".

## Voice audit (agent, 2026-09-29) — 118 findings

Audience: the Bootstrapping Agent reads almost everything; Requestor has no persona; no voice profile addresses `bootstrapping-agent`. Recommended single voice: "you", imperative, plain US English, "set up" as the only verb for the act, defined terms always capitalised, no capitals for emphasis; third person only where something is defined (roles, schemas, ns.jsonld); rationale and history out of reader-facing text. Top fixes: the non-existent `discuss` / `log-message` tools; two definitions of a Skill; `initialize-harness` never calls `discussion`; "both failure paths" (three exist); stale "BPMN has no precondition element"; logging "not a gate" vs README "record and stop"; owner quotes, dates and file counts in agent-facing text; remaining upward names (`isSkillMd`, `DEFAULT_DIRECTORIES`, "DMN-backed gateways elsewhere in this corpus", `_needs_comment`, "the harness's own README tool", "RTFM" on the landing card).

## Owner additions, 2026-09-29 — process and skills

Verbatim: *"skill determine the installed harnesses in a repo (intput = repo local ore remote, output = list of harness instantaited (partially or fully)) on the repo"*; *"before intitating a harness, determine if it has already started intitating, if not then don't reintiate"*; *"put in agents.md and/or readme.md and the bpmn the guidance that the Bootstaping agent, upon succesful bootstraping should review harnessed KGs and begin a user discussion workflow"*. Reading of the second, to confirm: a set-up already begun is reported and resumed, never started again (FR-5 today covers only a finished one).

- [ ] Skill: find the harnesses a repository has, fully or partially set up (input: local or remote repository)
- [ ] `initialize-harness`: check for a set-up already begun before starting one
- [ ] After a successful set-up: review the installed harnesses' KGs and start a discussion with the user (AGENTS.md / README + BPMN); also closes the missing call to `discussion`
- [ ] Voice rewrite of all of bootstrap (with the above, same files)
- [ ] One place for the KG's JSON-LD form and its self-description; `graph.schema.json` declares node shapes
- [ ] Remove `skills/package-manifest.json`


## Owner additions, 2026-09-29 (later)

- [ ] **No tools in bootstrap.** Bootstrap declares no `tools` directory already (`bootstrap.json`: "no Tools"). Definitions v3 follow suit: **Tool** is not a bootstrap term; it is defined in cat-harness. Harness is defined as Subgraphs holding Skills, Roles or Processes.
- [ ] `discussion.bpmn`: overlapping labels; lane role becomes a reusable **Discussion Agent**, not the Bootstrapping Agent.
- [ ] `log-message`: a **validate input schema** sub-process used by skills; partial data never stops the run, it returns false; output schema carries success/fail code words.
- [ ] `initialize-harness.bpmn`: restructure with sub-processes, using the business-analyst skills.
- [x] Instance README file tables name files relative to the directory heading they sit under (`readme-graph-sections.ts`), PR #1489.


## Groups A–E — done on branch next/group-d (2026-09-29)

- **A:** the last item fixed (`initialize-harness.bpmn` no longer calls log-message the last diagram). C was already complete.
- **D3:** Extension term (a field bootstrap does not define; ignored by a reader that does not know it). Owner then chose to keep **both** Extension and **SubKind** (a kind that requires everything its parent does, IS-A).
- **D4:** `kgQaHomeFor`; bootstrap declares no qa directory; its 15 sidecars + manifest live at `cat-harness/test/results/bootstrap/`.
- **D1:** `BOOTSTRAP_GRAPH_KINDS` (six kinds, one sentence each) → `$defs.GraphKind`; registry summaries read them; one layer table `GRAPH_KIND_TYPE_LAYERS`.
- **D2:** bootstrap `$schema` tags resolve inside bootstrap; ledger schema added; leak test allows no `folio-*/v1`.
- **E:** owner's SEMVER rule, 2026-09-29: *"2 used for human narrative centric content, 3 for agentic … make variables of version available to minimize drift. include in json/jsonld/schema rendering pipeline too"*. `iriBase` in bootstrap.json (one place); agent IRIs `<iriBase><version>/`, person-facing `<iriBase>v<major>/`; `iri:sync` + gate; `$schema` tags carry the schema's semver (`model-registry/1.0.0`); `release` variables in templates and `site.data.harness.releases`. Skills updated.
- **Deliberately not moved:** the exported document `@id` (`bootstrap.jsonld`) — kg-export mints it from where it is served; moves when litlfred/bootstrap publishes (`40fl`). GitHub tree links in bootstrap.json also switch at seeding.
