# Placement audit — every skill, tool, scenario, process and role checked against its layer (2026-10-01)

**Status:** read-only audit for the separation arc (epic bean `folio-assistant-7x5n`, issue [#1770](https://github.com/litlfred/folio-assistant/issues/1770), story S4 `rfuq`). **Nothing was moved.** The plan it serves is `cat-harness/docs/proposals/separation-arc-2026-10-01.md` (on branch `claude/blissful-ride-c2f26u`). Every row is in [`placement-audit-2026-10-01.json`](placement-audit-2026-10-01.json): `{kind, id, path, instance, concern, verdict, target, signal, evidence, pr}`.

**Measured at:** `origin/main` `cdb0a018c4a`, with the `bootstrap` (`f70a56c`) and `bootstrap-tools` (`920c772`) submodules initialised. **2266 items** across 20 kinds in 14 instance directories (`smart-l1`, `smart-dak`, `smart-ig` and `smart-immunizations` hold none of these kinds yet: only a declaration and QA results).

## Summary

### Counts per kind × verdict

| kind | OK | MOVE | SPLIT | CODE | TO-JSON | AMBIGUOUS | total |
|---|---:|---:|---:|---:|---:|---:|---:|
| skill | 335 | 39 | 70 | 3 | 23 | 10 | 480 |
| voice | 41 | 12 |  |  |  |  | 53 |
| skill-command | 44 |  |  |  |  |  | 44 |
| tool |  | 23 | 1 |  | 104 |  | 128 |
| tool-code | 1 |  |  | 1 |  |  | 2 |
| process | 49 | 25 | 4 |  |  |  | 78 |
| decision | 4 | 5 |  |  |  |  | 9 |
| role | 36 | 14 | 2 |  |  |  | 52 |
| role-extension | 25 |  |  |  |  |  | 25 |
| story | 80 | 34 |  |  |  |  | 114 |
| actor | 27 | 9 |  |  |  |  | 36 |
| capability | 17 | 11 |  |  |  |  | 28 |
| methodology | 21 |  |  |  |  |  | 21 |
| code-list | 6 | 6 | 1 |  |  |  | 13 |
| template | 3 | 16 |  | 1 |  |  | 20 |
| schema | 87 | 25 | 8 | 186 |  | 1 | 307 |
| source-descriptor |  | 2 |  |  |  |  | 2 |
| library-entry | 45 | 14 |  |  |  |  | 59 |
| script-group | 115 | 28 | 2 | 407 |  |  | 552 |
| code-group | 9 | 32 | 1 | 192 |  | 9 | 243 |
| **all** | **945** | **295** | **89** | **790** | **127** | **20** | **2266** |

`CODE` means "executable in cat-harness → cat-harness-tools" (D1). `TO-JSON` means "placed right, but the `.ts` node becomes data" (D2). Neither changes the instance that owns the *knowledge*. A `SPLIT` either divides an item or keeps it and inverts its upward references; its `signal` says which.

### Per instance

"Move out" counts this instance's MOVE, SPLIT, CODE and AMBIGUOUS rows. "Move in" counts rows elsewhere whose primary target is this instance (a SPLIT counts toward its named higher instance).

| instance | items | OK | TO-JSON (in place) | move out | move in |
|---|---:|---:|---:|---:|---:|
| agent-skills | 21 | 0 | 0 | 21 | 0 |
| bootstrap | 20 | 20 | 0 | 0 | 0 |
| bootstrap-tools | 49 | 47 | 0 | 2 | 0 |
| cat-harness | 1652 | 447 | 87 | 1102 | 33 |
| cat-harness-tools | 7 | 7 | 0 | 0 | 798 |
| fhir-harness | 57 | 36 | 14 | 7 | 36 |
| folio-assistant-core | 150 | 133 | 4 | 13 | 96 |
| folio-assistant-sci | 176 | 161 | 14 | 1 | 156 |
| large-datasets | 23 | 0 | 0 | 23 | 0 |
| smart-base | 38 | 28 | 8 | 2 | 33 |
| smart-trust | 2 | 2 | 0 | 0 | 1 |
| who-iris | 7 | 7 | 0 | 0 | 20 |
| who-style-guide | 7 | 0 | 0 | 7 | 0 |
| root | 57 | 57 | 0 | 0 | 5 |

### Per planned PR

Which existing bean each non-OK row belongs to (iirv placement PR2–PR9: `pzwb` `63wl` `4fv8` `tlat` `apcg` `8fq9` `f8wp` `p9bu`; S5 stages `70lx` `8lcl` `y9r6`). "unplanned" means no bean covers that row yet.

| planned PR | rows |
|---|---:|
| 70lx (S5 1a) | 553 |
| 8lcl (S5 1b) | 181 |
| y9r6 (S5 1c) | 127 |
| unplanned | 106 |
| unplanned (#223 code partition; S5) | 73 |
| 4fv8 (PR4) | 70 |
| 70lx (S5 1a) + 8fq9 (PR7) | 52 |
| unplanned (7x5n S4 subgraph ruling) | 38 |
| pzwb (PR2) | 28 |
| unplanned (tool placement; S5 70lx carries implementations) | 23 |
| 63wl (PR3) | 20 |
| f8wp (PR8) | 19 |
| apcg (PR6) | 15 |
| #1735 (S3) | 7 |
| tlat (PR5) | 5 |
| mer2 (S6) + 70lx | 4 |

`p9bu` (PR9) owns no row here: it moves docs pages, which are outside this audit's kinds. `8fq9` (PR7) appears only beside `70lx`, because the tests it regroups are code that S5 moves first.

## Method

One Python script (≈900 lines, kept out of the tree because it is not small; the method is below so it can be rebuilt). Every count comes from it; none from prose.

1. **Inventory** = `git ls-files` plus `git -C bootstrap ls-files` and `git -C bootstrap-tools ls-files`. Kinds and their row unit:
   - **skill**: each `.md`/`.json`/`.ts` under any `<instance>/skills/` (README excluded), plus `.claude/skills/**` and `.claude/commands/*` (`skill-command`); **voice**: each file under `skills/voices/`.
   - **tool**: each `defineTool({ id })` block in `<instance>/tools/*.ts`; files there without one are `tool-code`.
   - **process** / **decision**: each `.bpmn` / `.dmn`. **role**: each entry of every `scenarios/roles.json`; **role-extension**: each `extensions[]` overlay entry (PR0b). **story**: each `stories.json` entry. **actor**, **capability**: each JSON file.
   - **methodology**, **code-list**, **policy**, **template**: each file. **schema**: each file under `<instance>/schemas/`. **library-entry**: each `<instance>/library/<slug>/`. **source-descriptor**: each `large-datasets/sources/*.json`.
   - **script-group**: each child of `scripts/` (a subdirectory is one row; a flat script is one row). **code-group**: the same for `src/`, `adapters/`, `content/pipeline/`, `deploy/`, `ui/`, `viewer/`, `types/` and `test/` (results excluded).
2. **Layers** (target, after the 2026-10-01 rulings): `bootstrap → bootstrap-tools → cat-harness → cat-harness-tools → folio-assistant-core → {folio-assistant-sci, fhir-harness, who-iris} → smart-base → {smart-l1, smart-dak, smart-ig} → {smart-trust, smart-immunizations}`. `large-datasets` and `agent-skills` are treated as cat-harness (subgraph ruling); `who-style-guide` as who-iris (#1735). The checkout root may reference everything. An edge is **upward** when its target instance is outside the source's transitive `needs`. A KG item citing its own code half (cat-harness → cat-harness-tools) is a prose citation, not an upward edge (split plan §2).
3. **Signals per item**
   - *references*: instance-prefixed paths in the text (`lit:`), relative markdown links (`link:`) and relative imports (`imp:`) resolved against `git ls-files`, plus structured id references resolved to their owning instance — skill ids in text and front matter, BPMN `skill ref` / `role ref` / `calledElement` / `decisionRef`, role `skills`, actor `roles` / `capabilities`, story `role`, tool `satisfies`. **For code only `imp:` counts**: a path literal in a corpus-wide checker is resolved through the checkout overlay (PR0a), not a placement signal, and is recorded in `evidence`.
   - *vocabulary*: counts of FHIR/IG/FSH, WHO/SMART/DAK, Lean/LaTeX/theorem/proof, IRIS/DSpace, folio/document and harness terms (the word "folio" is not counted when it is the repository name `folio-assistant`). A domain wins only at ≥ 6 hits, ≥ 4 per 1000 words, twice the runner-up and ≥ 0.6× the harness terms; for code it needs ≥ 12 hits and 1.5× the harness terms.
   - *users*: KG items that name the id — skills, processes, scenarios, methodologies, tool definitions. Registries (`package-manifest.json`, `skills.json`), docs pages, tests and code are not users. For library entries every authored file counts.
4. **Verdict rule**, in order: instance-level rulings → code (D1, imports, then vocabulary gated by importers) → upward references (MOVE when the item also carries the target's vocabulary; AMBIGUOUS when ≥ 3 same-layer items use it; otherwise SPLIT = keep and invert) → vocabulary above the layer (MOVE, or SPLIT when lower users exist) → sole higher user carrying that domain (rule 3) → OK. Then the **standing rulings** of `placement-concern-groups-2026-10-01.md` override the heuristic for the items they name (PR2 regroup, PR3 processes, PR4 roles/actors/capabilities, PR6 cataloguing, ruling 4B schemas), and the `signal` records what the heuristic said when it disagreed.
5. **Concern** = the skill's directory topic (`authoring/` → `content`), else the majority concern of the skills an item references, else a keyword table over its id.

**Known limits.** Vocabulary is a proxy for subject, so every vocabulary-only MOVE says so in its `signal`, and code moved on vocabulary alone is held to AMBIGUOUS when three or more staying modules import it. Skill ids that are ordinary hyphenated words (`content-validation`) count as references wherever they appear. Users are counted per file, not per edge.

## Findings that are not one row

1. **`cat-harness-tools/cat-harness-tools.json` still declares `needs: ["folio-assistant-core"]`**, which the "tools below core" ruling reverses. Its `needs` should become `["cat-harness", "bootstrap-tools"]`, and `folio-assistant-core.json` should add `cat-harness-tools`. With that, the C1 cycle in the seed-readiness section of the arc plan is gone: the 88 core → cat-harness-code references become core → cat-harness-tools, which points down. Measured here: of the 27 tracked `cat-harness-tools/` files, **0** import core, so nothing in it has to move up today.
2. **The `content` concern lives in a directory called `authoring/`** (`cat-harness/skills/authoring/{authoring-core,content-lifecycle}`), while the code list `cat-harness/code-lists/concern-group.json` names it `content`. Every higher instance already uses `skills/content/`. Targets in this audit use `content` for higher instances and keep `authoring/` inside cat-harness until that is ruled (owner question 6).
3. **`tools` has no directory yet.** The MCP ruling puts the generic MCP skills in `cat-harness/skills/tools/mcp/` and the general tool skills in `cat-harness/skills/tools/`; the folio-specific MCP surfaces go to `folio-assistant-core/skills/tools/mcp/` and `folio-assistant-core/tools/`. The five `folio-core` skills measure as generic (0–10 folio terms vs 14–138 harness terms) and stay in cat-harness.
4. **Corpus-wide checkers name higher instances by literal path.** 90 code rows carry such literals (recorded in `evidence`, not counted as placement). They are the R6 class of the arc plan and are fixed by resolving through the checkout overlay (PR0a), not by moving the checker.
5. **The checkout root's `.claude/commands/` hold sci-specific entry points** (`lean-*`, `latex-build-cache`, `proof-integration-watcher`, …). They are OK where they are, because the root may reference every instance, but each follows its skill when the root stops aggregating (S8).

## Where this disagrees with the earlier proposals (with evidence)

| proposal said | this audit says | evidence |
|---|---|---|
| PR2: `sample-import` → `large-datasets/skills/` | **stays in cat-harness** | owner ruling 2026-10-01: large-datasets is a cat-harness subgraph, so the move is now inside one instance |
| PR5: materialization state vocabulary and `extraction.ts` / `extract-assets.ts` move down **into cat-harness**; `sample-import-run.ts` → large-datasets | they move down **into cat-harness-tools** (`schemas/library/`, `scripts/`), and so does `sample-import-run.ts` | D1 + "tools below core": they are Zod and code, and large-datasets is now a cat-harness subgraph. The heuristic alone found them OK in core (none imports upward), so these rows carry the ruling, not a measurement |
| split plan blocker 1: `graph-kind-registry.ts` validators in core must be registered on load because tools must not reach up | unchanged, and now **mandatory** rather than tidy | with tools below core, a tools → core reference is a cycle, not a style issue |
| arc C1: core → tools while tools → core is a cycle needing a ruling | **resolved** | owner ruling "tools below core" (relayed 2026-10-01); see finding 1 |
| PR1 finished the content-type packages | **34 more cat-harness skills point at sci** (2 MOVE, 22 SPLIT, 10 AMBIGUOUS) | they link into sci skills or carry its vocabulary; none is in any PR list. Most sit in `authoring/authoring-core` (one-voice, Milnor exposition, the integration watchers, scientific-accuracy) and `sdlc/sdlc-core` |
| §1.3 / PR3: content-type processes up, harness processes regroup in place | agreed, plus **2 more SPLITs** | `graph-detanglement.bpmn` cites `smart-base/methodologies/diig.md`; `ig-ast-delta-review.bpmn` binds an fhir-harness skill. Both stay and invert |
| PR4: 14 roles move up | agreed, plus **`qc-reviewer` and `build-pipeline` SPLIT** | both still list fhir-harness skills in the harness `roles.json`; those edges belong in `fhir-harness/scenarios/roles.json` `extensions` (the PR0b overlay already holds the rest) |
| PR8 / §4 issue 4: "28 schemas above the harness", by category only | named here: **20 schemas, 28 rows with their tests**: `block-kinds`, `board`, `board-positions`, `builders`, `carried-note`, `constraints`, `dak`, `dak-blocks`, `dak-content-type`, `formal-ref`, `formalization-types`, `front-matter`, `ig-chrome`, `ig-menu`, `ig-metadata-index`, `lean-packages`, `note-anchor`, `refactor-strategy`, `types`, `window-stack` | the 28 were never listed by name; the categories (content, boards, DAK/IG/FSH, sci) are applied to files by name. `fsh-guts.ts` is not moved: fsh-guts is a checkout-root graph (PR0a) |

## AMBIGUOUS — owner questions (20 rows, 7 questions)

Each question gives the context, the options, and a recommendation, so it can be answered from this page.

**Q1. The integration-watcher family** (5 rows: `compute-integration-watcher`, `detangler-integration-watcher`, `devils-advocate-watcher`, `integration-watch`, `narrative-asserts-code`)

- *Context:* These skills link into sci skills (`proof-integration-watcher`, `compute-audit`, `proof-gap-audit`) and carry Lean/proof vocabulary, yet 3–5 harness skills (the dispatcher `integration-watch`, `integration-backlog`, siblings) name them.
- *Options:* (a) move the whole family to `folio-assistant-sci/skills/sdlc/` and let the generic `integration-watcher` lifecycle stay as the harness base; (b) split each into a generic watcher contract (harness) and a sci refinement; (c) keep all in the harness and drop the sci links.
- *Recommendation:* **(a)**: the generic part already exists as `integration-watcher` + `lifecycle.md`, which are SPLIT rows (keep, invert one link each).
- *If unanswered:* the skills stay in cat-harness and keep their upward links, which `check:reference-direction` keeps reporting.

**Q2. The editorial-graph skills (`content-graph`, `uses-editorial-review`, `corpus-grep`)** (3 rows: `content-graph`, `uses-editorial-review`, `corpus-grep`)

- *Context:* They define the `uses[]` editorial relation every folio uses, but their worked examples and links are Lean/proof (`lean-formal-graph`, `critical-path-analysis`). 8–11 harness items use them.
- *Options:* (a) move to sci; (b) split: the relation and its rules stay in the harness, the Lean contrast moves to sci; (c) keep and generalise the examples.
- *Recommendation:* **(b)**: `uses[]` is a harness/core contract (AGENTS.md, `BlockBase.uses`); only the formal-graph comparison is sci.
- *If unanswered:* the skills stay in cat-harness and keep their upward links, which `check:reference-direction` keeps reporting.

**Q3. Exposition and render checks (`milnor-exposition-standard`, `markdown-render-check`)** (2 rows: `milnor-exposition-standard`, `markdown-render-check`)

- *Context:* Both cite sci material (`folio-assistant-sci/library/milnorlink`, `rendering-auditor`) and carry math vocabulary; 3–6 harness skills reference them.
- *Options:* (a) move both to sci; (b) move `milnor-exposition-standard` to sci and split `markdown-render-check`; (c) keep both.
- *Recommendation:* **(b)**: the Milnor standard is a paper style; markdown rendering checks are generic once the math examples move.
- *If unanswered:* the skills stay in cat-harness and keep their upward links, which `check:reference-direction` keeps reporting.

**Q4. Content-pipeline modules that read as paper/Lean code but are imported by other harness modules** (10 rows: `translation.ts`, `content-graph.ts`, `lean-lexer.ts`, `markdown-ast.ts`, `profile-check.ts`, `qa-checkers-q-usage.ts`, `qa-checkers-voice.ts`, `qa-criteria-registry.ts`, `render-latex.ts`, `render-value.ts`)

- *Context:* They carry sci vocabulary (Lean lexing, LaTeX rendering, q-usage and voice QA checkers, the QA criteria registry), so rule 2 says `folio-assistant-sci`. But 3–12 non-test cat-harness modules import each one, so moving them alone creates harness → sci imports.
- *Options:* (a) move each with its importers to `folio-assistant-sci` (the qou-era pipeline becomes sci code); (b) split: generic pipeline core to `cat-harness-tools`, the math checkers to sci; (c) keep all of `content/pipeline/` in `cat-harness-tools` as the shared pipeline for now.
- *Recommendation:* **(b)**, done inside S5: it is the only option that leaves no upward import and does not drag the document path into sci.
- *If unanswered:* S5 moves these modules to cat-harness-tools with the rest of `content/pipeline/` (option c by default).

**Q5. Form of the large-datasets and agent-skills subgraphs**

- *Context:* The ruling makes both cat-harness subgraphs. This audit targets them **dissolved into concern groups** (`cat-harness/skills/library/large-datasets/…`, `cat-harness/library/<group>/<slug>`), which matches PR8 ruling 3A. The alternative keeps them as nested directories (`cat-harness/large-datasets/`, `cat-harness/agent-skills/`).
- *Options:* (a) dissolve into the eight groups (as targeted here); (b) nested directory per former instance, declared as one subgraph each; (c) dissolve agent-skills (it is only library + voices) but nest large-datasets (it has code, processes and sources).
- *Recommendation:* **(a)**: "one fact, one place", and the group ids already exist.

**Q6. `skills/authoring/` vs the `content` concern code**

- *Context:* See finding 2: one concern, two names.
- *Options:* (a) rename `cat-harness/skills/authoring/` → `skills/content/` in PR2 `pzwb`; (b) rename the code to `authoring` everywhere; (c) leave both.
- *Recommendation:* **(a)**: higher instances already use `skills/content/`.

**Q7. Core's `schemas/{catalogue,dublin-core,fhir-artifact-index}.ts`**

- *Context:* Core's catalogue and Dublin Core schemas carry IRIS vocabulary and `fhir-artifact-index.ts` FHIR vocabulary, but cat-harness users read them (they are in `graph-kind-registry.ts`). They are SPLIT rows here.
- *Options:* (a) generic shape stays in core, the IRIS/FHIR specifics move to who-iris / fhir-harness and register on load (split plan blocker 1); (b) move whole; (c) keep.
- *Recommendation:* **(a)**.

## Per-kind tables

MOVE, SPLIT and AMBIGUOUS rows are listed in full. OK, CODE and TO-JSON rows are collapsed to a count per instance and concern; the JSON has every row.

### skill (480)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| AMBIGUOUS | `cat-harness/skills/authoring/authoring-core/compute-integration-watcher.md` | `folio-assistant-sci/skills/content/compute-integration-watcher.md` | content | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 4 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 4 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| AMBIGUOUS | `cat-harness/skills/authoring/authoring-core/content-graph.md` | `folio-assistant-sci/skills/content/content-graph.md` | content | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 10 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 10 users, (b) split: generic stub stays, sci body moves, (c) kee… | unplanned |
| AMBIGUOUS | `cat-harness/skills/authoring/authoring-core/detangler-integration-watcher.md` | `folio-assistant-sci/skills/content/detangler-integration-watcher.md` | content | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 4 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 4 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| AMBIGUOUS | `cat-harness/skills/authoring/authoring-core/devils-advocate-watcher.md` | `folio-assistant-sci/skills/content/devils-advocate-watcher.md` | content | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 3 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 3 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| AMBIGUOUS | `cat-harness/skills/authoring/authoring-core/milnor-exposition-standard.md` | `folio-assistant-sci/skills/content/milnor-exposition-standard.md` | content | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 3 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 3 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| AMBIGUOUS | `cat-harness/skills/authoring/authoring-core/uses-editorial-review.md` | `folio-assistant-sci/skills/content/uses-editorial-review.md` | content | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 8 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 8 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| AMBIGUOUS | `cat-harness/skills/kg/kg-core/corpus-grep.md` | `folio-assistant-sci/skills/kg/corpus-grep.md` | kg | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 11 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 11 users, (b) split: generic stub stays, sci body moves, (c) kee… | unplanned |
| AMBIGUOUS | `cat-harness/skills/sdlc/sdlc-core/integration-watch.md` | `folio-assistant-sci/skills/sdlc/integration-watch.md` | sdlc | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 5 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 5 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| AMBIGUOUS | `cat-harness/skills/sdlc/sdlc-core/narrative-asserts-code.md` | `folio-assistant-sci/skills/sdlc/narrative-asserts-code.md` | sdlc | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 3 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 3 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| AMBIGUOUS | `cat-harness/skills/ui/ui-core/markdown-render-check.md` | `folio-assistant-sci/skills/ui/markdown-render-check.md` | ui | rule 1+2 say folio-assistant-sci (links into it, carries sci vocabulary) but rule 1 run backwards says stay: 6 cat-harness KG items use it. Q: (a) move to folio-assistant-sci and invert those 6 users, (b) split: generic stub stays, sci body moves, (c) keep … | unplanned |
| MOVE | `agent-skills/skills/skills.json` | `cat-harness/skills/content/agent-skills/skills.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `cat-harness/skills/authoring/authoring-core/editor.md` | `folio-assistant-sci/skills/content/editor.md` | content | rule 1+2: references folio-assistant-sci and carries its vocabulary | unplanned |
| MOVE | `cat-harness/skills/authoring/content-lifecycle/evidence-appraisal.md` | `folio-assistant-core/skills/content/content-lifecycle-ext/evidence-appraisal.md` | content | placement-concern-groups ruling (PR2 / §1.3); heuristic said SPLIT→folio-assistant-sci | pzwb (PR2) |
| MOVE | `cat-harness/skills/conduct/conduct-core/getting-started.md` | `folio-assistant-core/skills/conduct/onboarding/getting-started.md` | conduct | placement-concern-groups ruling (PR2 / §1.3); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/conduct/conduct-core/repo-conversion.md` | `folio-assistant-core/skills/conduct/onboarding/repo-conversion.md` | conduct | placement-concern-groups ruling (PR2 / §1.3); heuristic said SPLIT→folio-assistant-core | pzwb (PR2) |
| MOVE | `cat-harness/skills/folio-core/covered-is-not-reachable.md` | `cat-harness/skills/tools/covered-is-not-reachable.md` | tools | placement-concern-groups ruling (PR2 + MCP ruling 2026-10-01); heuristic said SPLIT→folio-assistant-sci | pzwb (PR2) |
| MOVE | `cat-harness/skills/folio-core/mcp-assembly.md` | `cat-harness/skills/tools/mcp/mcp-assembly.md` | tools | placement-concern-groups ruling (PR2 + MCP ruling 2026-10-01); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/folio-core/mcp-contract.md` | `cat-harness/skills/tools/mcp/mcp-contract.md` | tools | placement-concern-groups ruling (PR2 + MCP ruling 2026-10-01); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/folio-core/mcp-projection.md` | `cat-harness/skills/tools/mcp/mcp-projection.md` | tools | placement-concern-groups ruling (PR2 + MCP ruling 2026-10-01); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/folio-core/skills-and-tools.md` | `cat-harness/skills/tools/skills-and-tools.md` | tools | placement-concern-groups ruling (PR2 + MCP ruling 2026-10-01); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/kg/graph-management/edge-kinds-and-blast-radius.md` | `folio-assistant-sci/skills/kg/edge-kinds-and-blast-radius.md` | kg | rule 1+2: references folio-assistant-sci and carries its vocabulary | unplanned |
| MOVE | `cat-harness/skills/library/library-core/archiving-arxiv.md` | `folio-assistant-core/skills/library/cataloguing/archiving-arxiv.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said OK | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/archiving-web-pages.md` | `folio-assistant-core/skills/library/cataloguing/archiving-web-pages.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said OK | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/bib-human-review.md` | `folio-assistant-core/skills/library/cataloguing/bib-human-review.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said OK | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/bib-photo-ingestion-watcher.md` | `folio-assistant-core/skills/library/cataloguing/bib-photo-ingestion-watcher.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said OK | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/bib-qa.md` | `folio-assistant-core/skills/library/cataloguing/bib-qa.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said AMBIGUOUS→folio-assistant-sci | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/filing-dublin-core.md` | `folio-assistant-core/skills/library/cataloguing/filing-dublin-core.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said OK | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/glossary-build.md` | `folio-assistant-core/skills/library/cataloguing/glossary-build.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said SPLIT→folio-assistant-core | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/ontologist.md` | `folio-assistant-core/skills/library/cataloguing/ontologist.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said SPLIT→folio-assistant-sci | apcg (PR6) |
| MOVE | `cat-harness/skills/library/library-core/tabular-metadata.md` | `folio-assistant-core/skills/library/ingestion/tabular-metadata.md` | library | placement-concern-groups ruling (PR6 §3.2); heuristic said OK | apcg (PR6) |
| MOVE | `cat-harness/skills/process/workflow/branch-freshness.md` | `cat-harness/skills/sdlc/sdlc-core/branch-freshness.md` | sdlc | placement-concern-groups ruling (PR2 / §1.3); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/process/workflow/code-review-process.md` | `cat-harness/skills/sdlc/sdlc-core/code-review-process.md` | sdlc | placement-concern-groups ruling (PR2 / §1.3); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/process/workflow/release-epic-planning.md` | `cat-harness/skills/sdlc/sdlc-core/release-epic-planning.md` | sdlc | placement-concern-groups ruling (PR2 / §1.3); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/process/workflow/release-lifecycle.md` | `cat-harness/skills/sdlc/sdlc-core/release-lifecycle.md` | sdlc | placement-concern-groups ruling (PR2 / §1.3); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/sdlc/crdm/crdm-data-model.md` | `cat-harness/skills/process/crdm/crdm-data-model.md` | process | concern group: sits in sdlc/ but its concern is process (owner ruling g43o: methodologies are process; §1.3) | pzwb (PR2) |
| MOVE | `cat-harness/skills/sdlc/crdm/crdm-detect.md` | `cat-harness/skills/process/crdm/crdm-detect.md` | process | concern group: sits in sdlc/ but its concern is process (owner ruling g43o: methodologies are process; §1.3) | pzwb (PR2) |
| MOVE | `cat-harness/skills/sdlc/crdm/crdm-requirements-workflow.md` | `cat-harness/skills/process/crdm/crdm-requirements-workflow.md` | process | concern group: sits in sdlc/ but its concern is process (owner ruling g43o: methodologies are process; §1.3) | pzwb (PR2) |
| MOVE | `cat-harness/skills/sdlc/sdlc-core/deployment-auth.md` | `cat-harness/skills/tools/deployment-auth.md` | tools | placement-concern-groups ruling (PR2 + MCP ruling 2026-10-01); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/sdlc/sdlc-core/diff.md` | `folio-assistant-core/skills/sdlc/diff.md` | sdlc | rule 1+2: references folio-assistant-core and carries its vocabulary | unplanned |
| MOVE | `cat-harness/skills/sdlc/spec-kit/spec-kit.md` | `cat-harness/skills/process/spec-kit/spec-kit.md` | process | concern group: sits in sdlc/ but its concern is process (owner ruling g43o: methodologies are process; §1.3) | pzwb (PR2) |
| MOVE | `cat-harness/skills/ui/ui-core/board-diagram-interchange.md` | `folio-assistant-core/skills/ui/boards/board-diagram-interchange.md` | ui | placement-concern-groups ruling (PR2 / §1.3); heuristic said OK | pzwb (PR2) |
| MOVE | `cat-harness/skills/ui/ui-core/board-windows.md` | `folio-assistant-core/skills/ui/boards/board-windows.md` | ui | placement-concern-groups ruling (PR2 / §1.3); heuristic said SPLIT→folio-assistant-core | pzwb (PR2) |
| MOVE | `large-datasets/skills/copy-out-materialized.md` | `cat-harness/skills/library/large-datasets/copy-out-materialized.md` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/skills/kg-subscription.md` | `cat-harness/skills/library/large-datasets/kg-subscription.md` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/skills/materialize-on-demand.md` | `cat-harness/skills/library/large-datasets/materialize-on-demand.md` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/skills/materialize-remote.md` | `cat-harness/skills/library/large-datasets/materialize-remote.md` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/skills/package-manifest.json` | `cat-harness/skills/content/large-datasets/package-manifest.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/skills/sample-import.md` | `cat-harness/skills/library/large-datasets/sample-import.md` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `who-style-guide/skills/skills.json` | `who-iris/skills/content/skills.json` | content | ruling: who-style-guide retires into who-iris (#1735) | #1735 (S3) |
| SPLIT | `bootstrap-tools/skills/bootstrap-contract-semver.md` | `cat-harness/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into cat-harness — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `bootstrap-tools/skills/package-manifest.json` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/block-density.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 2 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/canonical-watcher.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 2 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/chapter-complexity-review.md` | `folio-assistant-core/skills/content/chapter-complexity-review.md` | content | rule 2 vs users: subject is doc but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the doc body | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/content-profiles.md` | `folio-assistant-sci/skills/content/content-profiles.md` | content | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/integration-audit.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/md-authoring.md` | `folio-assistant-sci/skills/content/md-authoring.md` | content | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/one-voice-audit.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 2 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/one-voice-integration-watcher.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 2 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/production-vs-exploratory-discipline.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 3 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/readability-editing.md` | `folio-assistant-sci/skills/content/readability-editing.md` | content | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/review-comments.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 8 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/scientific-accuracy.md` | `folio-assistant-sci/skills/content/scientific-accuracy.md` | content | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/authoring/authoring-core/todo-review.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 4 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/authoring/content-lifecycle/content-test.md` | `folio-assistant-sci/skills/content/content-test.md` | content | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/conduct/conduct-core/where-does-this-go.md` | `root/ (a checkout-root link: replace it, R6; the item stays)` | conduct | rule 1: generic item with 1 upward reference(s) into root — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/graph-management/domain-fencing.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 4 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/graph-management/graph-detanglement.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 1 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/graph-management/graph-rendering.md` | `folio-assistant-sci/skills/kg/graph-rendering.md` | kg | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/directory-conventions.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 10 upward reference(s) into folio-assistant-core, who-iris, smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/harness-requirements.md` | `root/ (a checkout-root link: replace it, R6; the item stays)` | kg | rule 1: generic item with 1 upward reference(s) into root — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/instance-publication.md` | `fhir-harness/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 2 upward reference(s) into fhir-harness, smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/kg-contribution-offer.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 1 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/kg-export.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 1 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/kg-to-portal.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 1 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/placement.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 1 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/schema-management.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 3 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/kg/kg-core/vocabulary-authority.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 3 upward reference(s) into folio-assistant-core, fhir-harness — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/library/library-core/asset-extraction.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | library | rule 1: generic item with 4 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/library/library-core/glossary-terms.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | library | rule 1: generic item with 7 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/library/library-core/library-ingestion.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | library | rule 1: generic item with 4 upward reference(s) into folio-assistant-core, who-iris, folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/library/library-core/translation-manager.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | library | rule 1: generic item with 1 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/library/library-core/upload-naming.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | library | placement §3.1: `upload-naming` is part of the basic ingestion flow that stays in cat-harness; heuristic said MOVE→who-iris — invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/library/library-core/upload-routes.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | library | rule 1: generic item with 1 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/process/process-core/role-model.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | process | rule 1: generic item with 3 upward reference(s) into folio-assistant-core, folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/process/workflow/bpmn-authoring.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | process | rule 1: generic item with 2 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/process/workflow/dmn-authoring.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | process | rule 1: generic item with 2 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/requirements/fhir-validation.json` | `fhir-harness/skills/content/fhir-validation.json` | content | rule 2 vs users: subject is fhir but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the fhir body | unplanned |
| SPLIT | `cat-harness/skills/requirements/lean-verification.json` | `folio-assistant-sci/skills/sdlc/lean-verification.json` | sdlc | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/before-after-preview.md` | `fhir-harness/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 3 upward reference(s) into fhir-harness, folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/continual-progress.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 1 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/delivery-summary.md` | `folio-assistant-sci/skills/sdlc/delivery-summary.md` | sdlc | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/integration-backlog.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 3 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/integration-watcher.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 1 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/integration-watcher/lifecycle.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 1 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/pickup.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 1 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/prepare-merge.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 1 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/staging-review.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 1 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/test-engineer.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | sdlc | rule 1: generic item with 1 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/sdlc/sdlc-core/todo-manager.md` | `root/ (a checkout-root link: replace it, R6; the item stays)` | sdlc | rule 1: generic item with 1 upward reference(s) into root — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/ui/theming/site-presentation-assets.md` | `root/ (a checkout-root link: replace it, R6; the item stays)` | ui | rule 1: generic item with 1 upward reference(s) into root — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/ui/theming/theme-art-intake.md` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | ui | rule 1: generic item with 1 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/ui/ui-core/docs-auto.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | ui | rule 1: generic item with 5 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/ui/ui-core/harness-tiles.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | ui | rule 1: generic item with 1 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/skills/ui/ui-core/html-rendering-qc.md` | `folio-assistant-sci/skills/ui/html-rendering-qc.md` | ui | rule 2 vs users: subject is sci but used at/below cat-harness by ['cat-harness']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `cat-harness/skills/ui/ui-core/incremental-render.md` | `who-iris/ (receives the upward-pointing passage or link only; the item stays at its path)` | ui | rule 1: generic item with 1 upward reference(s) into who-iris — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `fhir-harness/skills/content/fhir-ig-authoring/ig-publication.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 2 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `fhir-harness/skills/content/fhir-ig-authoring/l3-fhir-authoring.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `fhir-harness/skills/content/fhir-ig-authoring/terminology-management.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | owner placement in #1702 (2026-09-30, "split by theme across harnesses") put it in fhir-harness; heuristic said MOVE→smart-base — keep it, invert the reference (the higher item links down) | unplanned |
| SPLIT | `fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 3 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `fhir-harness/skills/fhir-ig-base/ig-publisher-fork.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `fhir-harness/skills/fhir-ig-base/ig-render-jekyll.md` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | ui | rule 1: generic item with 3 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `fhir-harness/skills/skill-definitions/l3-fhir-authoring.json` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `folio-assistant-core/skills/content/content-lifecycle-ext/quality-control.md` | `fhir-harness/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into fhir-harness — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `folio-assistant-core/skills/content/folio-document-adapter/document-authoring.md` | `folio-assistant-sci/skills/content/document-authoring.md` | content | rule 2 vs users: subject is sci but used at/below folio-assistant-core by ['cat-harness', 'folio-assistant-core']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `folio-assistant-core/skills/content/folio-document-adapter/document-publishing.md` | `folio-assistant-sci/skills/content/document-publishing.md` | content | rule 2 vs users: subject is sci but used at/below folio-assistant-core by ['cat-harness', 'folio-assistant-core']; keep a generic stub, move the sci body | unplanned |
| SPLIT | `folio-assistant-core/skills/library/ingestion/document-intake.md` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | library | rule 1: generic item with 2 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `folio-assistant-sci/skills/content/folio-paper-adapter/q-usage-watcher.md` | `root/ (a checkout-root link: replace it, R6; the item stays)` | content | rule 1: generic item with 1 upward reference(s) into root — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `smart-base/skills/content/authoring-who-smart-guidelines/ig-artifact-ingestion.md` | `smart-trust/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 2 upward reference(s) into smart-trust — keep it here, invert the reference (the higher item links down) | unplanned |

<details markdown="1"><summary>collapsed: OK 335, CODE 3, TO-JSON 23</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| bootstrap | content | 3 |  |  |
| bootstrap | kg | 4 |  |  |
| bootstrap | ui | 1 |  |  |
| cat-harness | conduct | 15 |  |  |
| cat-harness | content | 24 | 1 | 3 |
| cat-harness | kg | 18 | 2 | 1 |
| cat-harness | library | 7 |  | 1 |
| cat-harness | process | 20 |  |  |
| cat-harness | sdlc | 42 |  | 2 |
| cat-harness | tools |  |  | 1 |
| cat-harness | ui | 19 |  | 1 |
| fhir-harness | content | 12 |  |  |
| folio-assistant-core | content | 19 |  |  |
| folio-assistant-core | library | 1 |  |  |
| folio-assistant-sci | content | 123 |  | 14 |
| folio-assistant-sci | library | 1 |  |  |
| root | conduct | 2 |  |  |
| root | sdlc | 10 |  |  |
| smart-base | content | 12 |  |  |
| who-iris | content | 2 |  |  |

</details>

### voice (53)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `agent-skills/skills/voices/agent-skill-authoring/voice.json` | `cat-harness/skills/content/agent-skills/voice.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/skills/voices/vendors/agent-skill-authoring-claude/voice.json` | `cat-harness/skills/content/agent-skills/voice.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/skills/voices/vendors/agent-skill-authoring-gemini-cli/voice.json` | `cat-harness/skills/content/agent-skills/voice.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/skills/voices/vendors/agent-skill-authoring-openai/voice.json` | `cat-harness/skills/content/agent-skills/voice.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/skills/voices/vendors/vendors.json` | `cat-harness/skills/content/agent-skills/vendors.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/skills/voices/voices.json` | `cat-harness/skills/content/agent-skills/voices.json` | content | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `who-style-guide/skills/voices/who-editorial/SKILL.md` | `who-iris/skills/voices/who-editorial/SKILL.md` | content | ruling: who-style-guide retires into who-iris (#1735) | #1735 (S3) |
| MOVE | `who-style-guide/skills/voices/who-editorial/voice.json` | `who-iris/skills/voices/who-editorial/voice.json` | content | ruling: who-style-guide retires into who-iris (#1735) | #1735 (S3) |
| MOVE | `who-style-guide/skills/voices/who-guideline-development/SKILL.md` | `who-iris/skills/voices/who-guideline-development/SKILL.md` | content | ruling: who-style-guide retires into who-iris (#1735) | #1735 (S3) |
| MOVE | `who-style-guide/skills/voices/who-guideline-development/voice.json` | `who-iris/skills/voices/who-guideline-development/voice.json` | content | ruling: who-style-guide retires into who-iris (#1735) | #1735 (S3) |
| MOVE | `who-style-guide/skills/voices/who-publication-design/SKILL.md` | `who-iris/skills/voices/who-publication-design/SKILL.md` | content | ruling: who-style-guide retires into who-iris (#1735) | #1735 (S3) |
| MOVE | `who-style-guide/skills/voices/who-publication-design/voice.json` | `who-iris/skills/voices/who-publication-design/voice.json` | content | ruling: who-style-guide retires into who-iris (#1735) | #1735 (S3) |

<details markdown="1"><summary>collapsed: OK 41</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| folio-assistant-core | content | 37 |  |  |
| folio-assistant-sci | content | 2 |  |  |
| smart-base | content | 2 |  |  |

</details>

### skill-command (44)

<details markdown="1"><summary>collapsed: OK 44</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| root | conduct | 4 |  |  |
| root | content | 21 |  |  |
| root | kg | 1 |  |  |
| root | library | 1 |  |  |
| root | sdlc | 17 |  |  |

</details>

### tool (128)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-core/tools/folio-block-qa-summary.json` | content | refined MCP ruling 2026-10-01: folio-specific tool surface → folio-assistant-core (core tools/mcp subgraph for folio surfaces); also D2 JSON — subject is folio content (vocabulary) | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-core/tools/folio-block-screenshots.json` | sdlc | refined MCP ruling 2026-10-01: folio-specific tool surface → folio-assistant-core (core tools/mcp subgraph for folio surfaces); also D2 JSON | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/latex-preflight.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/latex-overfull.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/tex-snippet-validate.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/tex-source-audit.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/headless-render-qc.json` | sdlc | rule 2: tool subject is sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/lean-build.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/lean-cache.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/lean-toolchain-setup.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/lean-coverage.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/lean-audit.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/content-manifest-validate.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/paper-latex-build.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/proof-dependency-graph.json` | ui | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/proof-objects-extract.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-sci/tools/proof-status-update.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `folio-assistant-core/tools/glossary-build.json` | library | rule 1/3: satisfies skills owned by folio-assistant-core; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/index.ts` | `fhir-harness/tools/fsh-cone.json` | content | rule 1/3: satisfies skills owned by fhir-harness; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/mcp.ts` | `folio-assistant-sci/tools/check-dependencies.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/mcp.ts` | `folio-assistant-sci/tools/paper-preferences.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `cat-harness/tools/mcp.ts` | `folio-assistant-sci/tools/paper-preview.json` | content | rule 1/3: satisfies skills owned by folio-assistant-sci; also D2 (definition becomes JSON); implementation → that instance's code | unplanned (tool placement; S5 70lx carries implementations) |
| MOVE | `smart-base/tools/index.ts` | `fhir-harness/tools/valueset-schemas.json` | content | rule 2: generic FHIR vocabulary, no WHO/SMART/DAK terms | unplanned (tool placement; S5 70lx carries implementations) |
| SPLIT | `cat-harness/tools/mcp.ts` | `cat-harness/tools/instance-init.json (generic instance init) + folio-assistant-core/tools/folio-init.json (content-adapter scaffold; core tools/mcp subgraph)` | conduct | refined MCP ruling 2026-10-01 + mer2 ("split the operation"): generic init stays, folio scaffold half is core-specific | mer2 (S6) + 70lx |

<details markdown="1"><summary>collapsed: TO-JSON 104</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | content |  |  | 5 |
| cat-harness | kg |  |  | 19 |
| cat-harness | library |  |  | 17 |
| cat-harness | process |  |  | 8 |
| cat-harness | sdlc |  |  | 11 |
| cat-harness | tools |  |  | 3 |
| cat-harness | ui |  |  | 15 |
| fhir-harness | content |  |  | 14 |
| folio-assistant-core | content |  |  | 3 |
| folio-assistant-core | sdlc |  |  | 1 |
| smart-base | content |  |  | 8 |

</details>

### tool-code (2)

<details markdown="1"><summary>collapsed: OK 1, CODE 1</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | tools |  | 1 |  |
| root | tools | 1 |  |  |

</details>

### process (78)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/processes/atomic-mass-drift-check.bpmn` | `folio-assistant-sci/processes/sdlc/atomic-mass-drift-check.bpmn` | sdlc | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/authoring-a-document.bpmn` | `folio-assistant-core/processes/content/authoring-a-document.bpmn` | content | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `cat-harness/processes/authoring-a-paper.bpmn` | `folio-assistant-sci/processes/content/authoring-a-paper.bpmn` | content | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `cat-harness/processes/board-open-close.bpmn` | `folio-assistant-core/processes/ui/board-open-close.bpmn` | ui | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/board-place-note.bpmn` | `folio-assistant-core/processes/ui/board-place-note.bpmn` | ui | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/board-relocate.bpmn` | `folio-assistant-core/processes/ui/board-relocate.bpmn` | ui | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/content-change-review.bpmn` | `folio-assistant-core/processes/sdlc/content-change-review.bpmn` | sdlc | placement PR3 ruling (63wl); heuristic said SPLIT→folio-assistant-sci | 63wl (PR3) |
| MOVE | `cat-harness/processes/content-lifecycle.bpmn` | `folio-assistant-core/processes/content/content-lifecycle.bpmn` | content | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/draft-to-publication.bpmn` | `folio-assistant-core/processes/content/draft-to-publication.bpmn` | content | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `cat-harness/processes/editing-hci-validation.bpmn` | `folio-assistant-core/processes/content/editing-hci-validation.bpmn` | content | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/evidence-retrieval.bpmn` | `folio-assistant-core/processes/library/evidence-retrieval.bpmn` | library | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `cat-harness/processes/getting-started.bpmn` | `folio-assistant-core/processes/conduct/getting-started.bpmn` | conduct | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `cat-harness/processes/ig-incremental-build.bpmn` | `fhir-harness/processes/content/ig-incremental-build.bpmn` | content | placement PR3 ruling (63wl); heuristic said SPLIT→folio-assistant-core | 63wl (PR3) |
| MOVE | `cat-harness/processes/ingest-build-l1-kg.bpmn` | `folio-assistant-core/processes/library/ingest-build-l1-kg.bpmn` | library | placement §3.2 (apcg PR6): ingest-* subprocesses are core detailed methods; heuristic said SPLIT | apcg (PR6) |
| MOVE | `cat-harness/processes/ingest-derive-content.bpmn` | `folio-assistant-core/processes/library/ingest-derive-content.bpmn` | library | placement §3.2 (apcg PR6): ingest-* subprocesses are core detailed methods; heuristic said SPLIT | apcg (PR6) |
| MOVE | `cat-harness/processes/ingest-extract-structure.bpmn` | `folio-assistant-core/processes/library/ingest-extract-structure.bpmn` | library | placement §3.2 (apcg PR6): ingest-* subprocesses are core detailed methods; heuristic said SPLIT | apcg (PR6) |
| MOVE | `cat-harness/processes/ingest-l1-completeness-gate.bpmn` | `folio-assistant-core/processes/library/ingest-l1-completeness-gate.bpmn` | library | placement §3.2 (apcg PR6): ingest-* subprocesses are core detailed methods; heuristic said SPLIT | apcg (PR6) |
| MOVE | `cat-harness/processes/ingest-theme.bpmn` | `folio-assistant-core/processes/library/ingest-theme.bpmn` | ui | placement §3.2 (apcg PR6): ingest-* subprocesses are core detailed methods; heuristic said OK | apcg (PR6) |
| MOVE | `cat-harness/processes/l2-dak-authoring.bpmn` | `smart-base/processes/content/l2-dak-authoring.bpmn` | content | placement PR3 ruling (63wl); heuristic said SPLIT→fhir-harness | 63wl (PR3) |
| MOVE | `cat-harness/processes/l3-fhir-pipeline.bpmn` | `fhir-harness/processes/content/l3-fhir-pipeline.bpmn` | content | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `large-datasets/processes/copy-out-materialized.bpmn` | `cat-harness/processes/library/copy-out-materialized.bpmn` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/processes/materialize-remote.bpmn` | `cat-harness/processes/library/materialize-remote.bpmn` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/processes/refresh-materialized.bpmn` | `cat-harness/processes/library/refresh-materialized.bpmn` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/processes/sample-import.bpmn` | `cat-harness/processes/library/sample-import.bpmn` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/processes/subscribe-kg.bpmn` | `cat-harness/processes/library/subscribe-kg.bpmn` | library | ruling: large-datasets/agent-skills become cat-harness subgraphs (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| SPLIT | `cat-harness/processes/document-ingestion.bpmn` | `cat-harness/processes/library/document-ingestion.bpmn (basic) + folio-assistant-core/processes/library/l1-document-ingestion.bpmn` | library | placement §3.1 (apcg PR6): keep Process_Ingestion as the basic flow; L1 detail to core | apcg (PR6) |
| SPLIT | `cat-harness/processes/graph-detanglement.bpmn` | `smart-base/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 1 upward reference(s) into smart-base — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/processes/ig-ast-delta-review.bpmn` | `fhir-harness/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into fhir-harness — keep it here, invert the reference (the higher item links down) | unplanned |
| SPLIT | `cat-harness/processes/review-task.bpmn` | `folio-assistant-sci/ (receives the upward-pointing passage or link only; the item stays at its path)` | content | rule 1: generic item with 1 upward reference(s) into folio-assistant-sci — keep it here, invert the reference (the higher item links down) | unplanned |

<details markdown="1"><summary>collapsed: OK 49</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| bootstrap | content | 2 |  |  |
| bootstrap | kg | 1 |  |  |
| cat-harness | conduct | 1 |  |  |
| cat-harness | content | 2 |  |  |
| cat-harness | kg | 4 |  |  |
| cat-harness | library | 4 |  |  |
| cat-harness | process | 9 |  |  |
| cat-harness | sdlc | 21 |  |  |
| cat-harness | ui | 3 |  |  |
| folio-assistant-core | content | 1 |  |  |
| smart-base | process | 1 |  |  |

</details>

### decision (9)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/processes/decisions/draft-qa-gate.dmn` | `folio-assistant-core/processes/sdlc/draft-qa-gate.dmn` | sdlc | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/decisions/folio-intent.dmn` | `folio-assistant-core/processes/content/folio-intent.dmn` | content | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `cat-harness/processes/decisions/lean-build-gate.dmn` | `folio-assistant-sci/processes/sdlc/lean-build-gate.dmn` | sdlc | placement PR3 ruling (63wl) | 63wl (PR3) |
| MOVE | `cat-harness/processes/decisions/pages-live-gate.dmn` | `folio-assistant-core/processes/sdlc/pages-live-gate.dmn` | sdlc | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |
| MOVE | `cat-harness/processes/decisions/review-coverage-gate.dmn` | `folio-assistant-core/processes/sdlc/review-coverage-gate.dmn` | sdlc | placement PR3 ruling (63wl); heuristic said OK | 63wl (PR3) |

<details markdown="1"><summary>collapsed: OK 4</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | content | 1 |  |  |
| cat-harness | sdlc | 3 |  |  |

</details>

### role (52)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/scenarios/roles.json#board-renderer` | `folio-assistant-core/scenarios/roles.json` | ui | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#clinical-sme` | `smart-base/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#compute-authoring-agent` | `folio-assistant-sci/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#deep-researcher` | `folio-assistant-core/scenarios/roles.json` | content | placement PR4 ruling (4fv8) | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#editorial-authoring-agent` | `folio-assistant-core/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#evidence-agent` | `folio-assistant-core/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#fhir-modeller` | `fhir-harness/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#ig-publisher-service` | `fhir-harness/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#lean-authoring-agent` | `folio-assistant-sci/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#lean-toolchain` | `folio-assistant-sci/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#onboarding-agent` | `folio-assistant-core/scenarios/roles.json` | conduct | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#proof-review-agent` | `folio-assistant-sci/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#review-coordinator` | `folio-assistant-core/scenarios/roles.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/roles.json#terminologist` | `fhir-harness/scenarios/roles.json` | library | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| SPLIT | `cat-harness/scenarios/roles.json#build-pipeline` | `fhir-harness/scenarios/roles.json `extensions` (the upward role→skill edges only; the role stays)` | sdlc | rule 1: generic item with 1 upward reference(s) into fhir-harness — keep it here, move the upward role→skill edges into the owner's roles.json `extensions` overlay (PR0b mechanism) | 4fv8 (PR4) |
| SPLIT | `cat-harness/scenarios/roles.json#qc-reviewer` | `fhir-harness/scenarios/roles.json `extensions` (the upward role→skill edges only; the role stays)` | content | rule 1: generic item with 1 upward reference(s) into fhir-harness — keep it here, move the upward role→skill edges into the owner's roles.json `extensions` overlay (PR0b mechanism) | 4fv8 (PR4) |

<details markdown="1"><summary>collapsed: OK 36</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| bootstrap | content | 2 |  |  |
| bootstrap | kg | 2 |  |  |
| cat-harness | conduct | 2 |  |  |
| cat-harness | content | 9 |  |  |
| cat-harness | kg | 2 |  |  |
| cat-harness | library | 6 |  |  |
| cat-harness | process | 3 |  |  |
| cat-harness | sdlc | 9 |  |  |
| cat-harness | ui | 1 |  |  |

</details>

### role-extension (25)

<details markdown="1"><summary>collapsed: OK 25</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| fhir-harness | content | 5 |  |  |
| folio-assistant-core | content | 3 |  |  |
| folio-assistant-core | library | 6 |  |  |
| folio-assistant-sci | content | 9 |  |  |
| smart-base | content | 2 |  |  |

</details>

### story (114)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/scenarios/stories.json#clinical-sme-1` | `smart-base/scenarios/stories.json` | content | PR4 ruling: story follows its role `clinical-sme` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#clinical-sme-2` | `smart-base/scenarios/stories.json` | content | PR4 ruling: story follows its role `clinical-sme` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#clinical-sme-3` | `smart-base/scenarios/stories.json` | content | PR4 ruling: story follows its role `clinical-sme` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#compute-authoring-agent-1` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `compute-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#compute-authoring-agent-2` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `compute-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#compute-authoring-agent-3` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `compute-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#deep-researcher-1` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `deep-researcher` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#deep-researcher-2` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `deep-researcher` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#deep-researcher-3` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `deep-researcher` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#deep-researcher-4` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `deep-researcher` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#editorial-authoring-agent-1` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `editorial-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#editorial-authoring-agent-2` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `editorial-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#editorial-authoring-agent-3` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `editorial-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#evidence-agent-1` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `evidence-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#evidence-agent-2` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `evidence-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#evidence-agent-3` | `folio-assistant-core/scenarios/stories.json` | content | PR4 ruling: story follows its role `evidence-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#fhir-modeller-1` | `fhir-harness/scenarios/stories.json` | content | PR4 ruling: story follows its role `fhir-modeller` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#fhir-modeller-2` | `fhir-harness/scenarios/stories.json` | content | PR4 ruling: story follows its role `fhir-modeller` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#fhir-modeller-3` | `fhir-harness/scenarios/stories.json` | content | PR4 ruling: story follows its role `fhir-modeller` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#lean-authoring-agent-1` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `lean-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#lean-authoring-agent-2` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `lean-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#lean-authoring-agent-3` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `lean-authoring-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#onboarding-agent-1` | `folio-assistant-core/scenarios/stories.json` | ui | PR4 ruling: story follows its role `onboarding-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#onboarding-agent-2` | `folio-assistant-core/scenarios/stories.json` | ui | PR4 ruling: story follows its role `onboarding-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#onboarding-agent-3` | `folio-assistant-core/scenarios/stories.json` | ui | PR4 ruling: story follows its role `onboarding-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#proof-review-agent-1` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `proof-review-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#proof-review-agent-2` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `proof-review-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#proof-review-agent-3` | `folio-assistant-sci/scenarios/stories.json` | content | PR4 ruling: story follows its role `proof-review-agent` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#review-coordinator-1` | `folio-assistant-core/scenarios/stories.json` | sdlc | PR4 ruling: story follows its role `review-coordinator` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#review-coordinator-2` | `folio-assistant-core/scenarios/stories.json` | sdlc | PR4 ruling: story follows its role `review-coordinator` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#review-coordinator-3` | `folio-assistant-core/scenarios/stories.json` | sdlc | PR4 ruling: story follows its role `review-coordinator` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#terminologist-1` | `fhir-harness/scenarios/stories.json` | content | PR4 ruling: story follows its role `terminologist` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#terminologist-2` | `fhir-harness/scenarios/stories.json` | content | PR4 ruling: story follows its role `terminologist` | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/stories.json#terminologist-3` | `fhir-harness/scenarios/stories.json` | content | PR4 ruling: story follows its role `terminologist` | 4fv8 (PR4) |

<details markdown="1"><summary>collapsed: OK 80</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | content | 39 |  |  |
| cat-harness | library | 14 |  |  |
| cat-harness | sdlc | 12 |  |  |
| cat-harness | ui | 15 |  |  |

</details>

### actor (36)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/scenarios/actors/board-renderer.json` | `folio-assistant-core/scenarios/actors/board-renderer.json` | ui | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/clinical-sme.json` | `smart-base/scenarios/actors/clinical-sme.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/deep-researcher.json` | `folio-assistant-core/scenarios/actors/deep-researcher.json` | content | placement PR4 ruling (4fv8) | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/evidence-agent.json` | `folio-assistant-core/scenarios/actors/evidence-agent.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/fhir-modeller.json` | `fhir-harness/scenarios/actors/fhir-modeller.json` | content | placement PR4 ruling (4fv8) | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/ig-publisher-service.json` | `fhir-harness/scenarios/actors/ig-publisher-service.json` | content | placement PR4 ruling (4fv8) | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/lean-mcp.json` | `folio-assistant-sci/scenarios/actors/lean-mcp.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/onboarding-agent.json` | `folio-assistant-core/scenarios/actors/onboarding-agent.json` | ui | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/actors/terminologist.json` | `fhir-harness/scenarios/actors/terminologist.json` | content | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |

<details markdown="1"><summary>collapsed: OK 27</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | content | 14 |  |  |
| cat-harness | library | 2 |  |  |
| cat-harness | process | 3 |  |  |
| cat-harness | sdlc | 1 |  |  |
| cat-harness | ui | 7 |  |  |

</details>

### capability (28)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/scenarios/capabilities/fhir-validator.json` | `fhir-harness/scenarios/capabilities/fhir-validator.json` | tools | placement PR4 ruling (4fv8) | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/html-pdf-engine.json` | `folio-assistant-core/scenarios/capabilities/html-pdf-engine.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/ig-publisher.json` | `fhir-harness/scenarios/capabilities/ig-publisher.json` | tools | placement PR4 ruling (4fv8) | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/java-runtime.json` | `fhir-harness/scenarios/capabilities/java-runtime.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/latex-compiler.json` | `folio-assistant-sci/scenarios/capabilities/latex-compiler.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/lean-atlas.json` | `folio-assistant-sci/scenarios/capabilities/lean-atlas.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/lean-mcp.json` | `folio-assistant-sci/scenarios/capabilities/lean-mcp.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/lean-toolchain.json` | `folio-assistant-sci/scenarios/capabilities/lean-toolchain.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/pandoc.json` | `folio-assistant-core/scenarios/capabilities/pandoc.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/smart-base.json` | `smart-base/scenarios/capabilities/smart-base.json` | tools | placement PR4 ruling (4fv8) | 4fv8 (PR4) |
| MOVE | `cat-harness/scenarios/capabilities/sushi-compiler.json` | `fhir-harness/scenarios/capabilities/sushi-compiler.json` | tools | placement PR4 ruling (4fv8); heuristic said OK | 4fv8 (PR4) |

<details markdown="1"><summary>collapsed: OK 17</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | tools | 17 |  |  |

</details>

### methodology (21)

<details markdown="1"><summary>collapsed: OK 21</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | content | 2 |  |  |
| cat-harness | kg | 2 |  |  |
| cat-harness | library | 2 |  |  |
| cat-harness | process | 9 |  |  |
| cat-harness | ui | 1 |  |  |
| folio-assistant-core | content | 1 |  |  |
| folio-assistant-sci | content | 2 |  |  |
| folio-assistant-sci | process | 1 |  |  |
| smart-base | content | 1 |  |  |

</details>

### code-list (13)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/code-lists/grade-certainty.json` | `smart-base/code-lists/grade-certainty.json` | content | rule 2/3: GRADE evidence-to-decision vocabulary; placement §0 keeps GRADE in smart-base (the `grade` skill); heuristic said OK | unplanned |
| MOVE | `cat-harness/code-lists/grade-etd-criterion.json` | `smart-base/code-lists/grade-etd-criterion.json` | content | rule 2/3: GRADE evidence-to-decision vocabulary; placement §0 keeps GRADE in smart-base (the `grade` skill); heuristic said OK | unplanned |
| MOVE | `cat-harness/code-lists/grade-rating-down.json` | `smart-base/code-lists/grade-rating-down.json` | content | rule 2/3: GRADE evidence-to-decision vocabulary; placement §0 keeps GRADE in smart-base (the `grade` skill); heuristic said OK | unplanned |
| MOVE | `cat-harness/code-lists/grade-rating-up.json` | `smart-base/code-lists/grade-rating-up.json` | content | rule 2/3: GRADE evidence-to-decision vocabulary; placement §0 keeps GRADE in smart-base (the `grade` skill); heuristic said OK | unplanned |
| MOVE | `cat-harness/code-lists/grade-recommendation-direction.json` | `smart-base/code-lists/grade-recommendation-direction.json` | content | rule 2/3: GRADE evidence-to-decision vocabulary; placement §0 keeps GRADE in smart-base (the `grade` skill); heuristic said OK | unplanned |
| MOVE | `cat-harness/code-lists/grade-recommendation-strength.json` | `smart-base/code-lists/grade-recommendation-strength.json` | content | rule 2/3: GRADE evidence-to-decision vocabulary; placement §0 keeps GRADE in smart-base (the `grade` skill); heuristic said OK | unplanned |
| SPLIT | `cat-harness/code-lists/own-namespaces.json` | `folio-assistant-core/ (receives the upward-pointing passage or link only; the item stays at its path)` | kg | rule 1: generic item with 3 upward reference(s) into folio-assistant-core — keep it here, invert the reference (the higher item links down) | unplanned |

<details markdown="1"><summary>collapsed: OK 6</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | kg | 1 |  |  |
| cat-harness | sdlc | 5 |  |  |

</details>

### template (20)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/templates/document/github/workflows/qa-sweep-nightly.yml` | `folio-assistant-core/templates/document/github/workflows/qa-sweep-nightly.yml` | sdlc | rule 2 + refined MCP ruling: document-content-type template is the folio_init adapter-scaffold half (mer2), which is core-specific | mer2 (S6) + 70lx |
| MOVE | `cat-harness/templates/document/github/workflows/qa-sweep.yml` | `folio-assistant-core/templates/document/github/workflows/qa-sweep.yml` | sdlc | rule 2 + refined MCP ruling: document-content-type template is the folio_init adapter-scaffold half (mer2), which is core-specific | mer2 (S6) + 70lx |
| MOVE | `cat-harness/templates/document/github/workflows/section-title-audit.yml` | `folio-assistant-core/templates/document/github/workflows/section-title-audit.yml` | sdlc | rule 2 + refined MCP ruling: document-content-type template is the folio_init adapter-scaffold half (mer2), which is core-specific | mer2 (S6) + 70lx |
| MOVE | `cat-harness/templates/paper/github/actions/lake-cache-restore/action.yml` | `folio-assistant-sci/templates/paper/github/actions/lake-cache-restore/action.yml` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/axiom_report.py` | `folio-assistant-sci/templates/paper/github/scripts/axiom_report.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/extract_proof_objects.py` | `folio-assistant-sci/templates/paper/github/scripts/extract_proof_objects.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/folio_lean/__init__.py` | `folio-assistant-sci/templates/paper/github/scripts/folio_lean/__init__.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/folio_lean/config.py` | `folio-assistant-sci/templates/paper/github/scripts/folio_lean/config.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/folio_lean/git_utils.py` | `folio-assistant-sci/templates/paper/github/scripts/folio_lean/git_utils.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/folio_lean/manifest.py` | `folio-assistant-sci/templates/paper/github/scripts/folio_lean/manifest.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/generate_dependency_graph.py` | `folio-assistant-sci/templates/paper/github/scripts/generate_dependency_graph.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/scripts/update_proof_status.py` | `folio-assistant-sci/templates/paper/github/scripts/update_proof_status.py` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/workflows/blueprint.yml` | `folio-assistant-sci/templates/paper/github/workflows/blueprint.yml` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/workflows/lean-build-sidecar.yml` | `folio-assistant-sci/templates/paper/github/workflows/lean-build-sidecar.yml` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/workflows/lean-build.yml` | `folio-assistant-sci/templates/paper/github/workflows/lean-build.yml` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |
| MOVE | `cat-harness/templates/paper/github/workflows/lean_ci.yml` | `folio-assistant-sci/templates/paper/github/workflows/lean_ci.yml` | sdlc | rule 2: paper-content-type template (folio_init writes it for a paper folio) | unplanned |

<details markdown="1"><summary>collapsed: OK 3, CODE 1</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| bootstrap-tools | process | 1 |  |  |
| bootstrap-tools | ui | 2 |  |  |
| cat-harness | library |  | 1 |  |

</details>

### schema (307)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| AMBIGUOUS | `cat-harness/schemas/translation.ts` | `folio-assistant-sci/schemas/translation.ts` | library | rule 2 says folio-assistant-sci (sci vocabulary) but 3 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/schemas/board-positions.test.ts` | `folio-assistant-core/schemas/board-positions.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/board-positions.ts` | `folio-assistant-core/schemas/board-positions.ts` | ui | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/board.test.ts` | `folio-assistant-core/schemas/board.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/board.ts` | `folio-assistant-core/schemas/board.ts` | ui | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/carried-note.ts` | `folio-assistant-core/schemas/carried-note.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/constraints.ts` | `folio-assistant-sci/schemas/constraints.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); Lean / formalisation vocabulary; heuristic said AMBIGUOUS | f8wp (PR8) |
| MOVE | `cat-harness/schemas/dak-blocks.ts` | `smart-base/schemas/dak-blocks.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); DAK vocabulary | f8wp (PR8) |
| MOVE | `cat-harness/schemas/dak-content-type.ts` | `smart-base/schemas/dak-content-type.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); DAK vocabulary; heuristic said CODE | f8wp (PR8) |
| MOVE | `cat-harness/schemas/dak.test.ts` | `smart-base/schemas/dak.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); DAK vocabulary | f8wp (PR8) |
| MOVE | `cat-harness/schemas/dak.ts` | `smart-base/schemas/dak.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); DAK vocabulary | f8wp (PR8) |
| MOVE | `cat-harness/schemas/formal-ref.ts` | `folio-assistant-sci/schemas/formal-ref.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); Lean / formalisation vocabulary; heuristic said AMBIGUOUS | f8wp (PR8) |
| MOVE | `cat-harness/schemas/formalization-types.ts` | `folio-assistant-sci/schemas/formalization-types.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); Lean / formalisation vocabulary | f8wp (PR8) |
| MOVE | `cat-harness/schemas/ig-chrome.test.ts` | `fhir-harness/schemas/ig-chrome.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); generic FHIR IG publication shape (would a non-WHO IG need it? yes); heuristic said CODE | f8wp (PR8) |
| MOVE | `cat-harness/schemas/ig-chrome.ts` | `fhir-harness/schemas/ig-chrome.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); generic FHIR IG publication shape (would a non-WHO IG need it? yes); heuristic said CODE | f8wp (PR8) |
| MOVE | `cat-harness/schemas/ig-menu.test.ts` | `fhir-harness/schemas/ig-menu.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); generic FHIR IG publication shape (would a non-WHO IG need it? yes); heuristic said CODE | f8wp (PR8) |
| MOVE | `cat-harness/schemas/ig-menu.ts` | `fhir-harness/schemas/ig-menu.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); generic FHIR IG publication shape (would a non-WHO IG need it? yes); heuristic said CODE | f8wp (PR8) |
| MOVE | `cat-harness/schemas/ig-metadata-index.test.ts` | `fhir-harness/schemas/ig-metadata-index.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); generic FHIR IG publication shape (would a non-WHO IG need it? yes); heuristic said CODE | f8wp (PR8) |
| MOVE | `cat-harness/schemas/ig-metadata-index.ts` | `fhir-harness/schemas/ig-metadata-index.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); generic FHIR IG publication shape (would a non-WHO IG need it? yes) | f8wp (PR8) |
| MOVE | `cat-harness/schemas/lean-packages.ts` | `folio-assistant-sci/schemas/lean-packages.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); Lean / formalisation vocabulary; heuristic said CODE | f8wp (PR8) |
| MOVE | `cat-harness/schemas/note-anchor.test.ts` | `folio-assistant-core/schemas/note-anchor.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/note-anchor.ts` | `folio-assistant-core/schemas/note-anchor.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/refactor-strategy.ts` | `folio-assistant-sci/schemas/refactor-strategy.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); Lean / formalisation vocabulary | f8wp (PR8) |
| MOVE | `cat-harness/schemas/window-stack.test.ts` | `folio-assistant-core/schemas/window-stack.test.ts` | sdlc | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `cat-harness/schemas/window-stack.ts` | `folio-assistant-core/schemas/window-stack.ts` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); boards are a core concern (PR2 ui/boards, PR3 board-*.bpmn); heuristic said CODE | pzwb (PR2) |
| MOVE | `folio-assistant-core/schemas/extraction.ts` | `cat-harness-tools/schemas/library/extraction.ts` | library | PR5 tlat: the tool behind the harness's own `asset-extraction` skill moves down; Zod → cat-harness-tools (D1); heuristic said OK | tlat (PR5) |
| SPLIT | `cat-harness/schemas/block-kinds.ts` | `folio-assistant-core/schemas/block-kinds.ts (document kinds) + folio-assistant-sci/schemas/ (MATH_BLOCK_KINDS and math fields)` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); content-block schema: DOCUMENT_BLOCK_KINDS is the derived complement of MATH_BLOCK_KINDS (AGENTS.md), so it splits core/sci; heuristic said CODE | f8wp (PR8) |
| SPLIT | `cat-harness/schemas/builders.ts` | `folio-assistant-core/schemas/builders.ts (document kinds) + folio-assistant-sci/schemas/ (MATH_BLOCK_KINDS and math fields)` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); content-block schema: DOCUMENT_BLOCK_KINDS is the derived complement of MATH_BLOCK_KINDS (AGENTS.md), so it splits core/sci; heuristic said AMBIGUOUS | f8wp (PR8) |
| SPLIT | `cat-harness/schemas/front-matter.ts` | `folio-assistant-core/schemas/front-matter.ts (document kinds) + folio-assistant-sci/schemas/ (MATH_BLOCK_KINDS and math fields)` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); content-block schema: DOCUMENT_BLOCK_KINDS is the derived complement of MATH_BLOCK_KINDS (AGENTS.md), so it splits core/sci; heuristic said CODE | f8wp (PR8) |
| SPLIT | `cat-harness/schemas/types.ts` | `folio-assistant-core/schemas/types.ts (document kinds) + folio-assistant-sci/schemas/ (MATH_BLOCK_KINDS and math fields)` | content | owner ruling 4B (2026-09-30): schemas above the harness move now, with their importers (placement §4 issue 4); content-block schema: DOCUMENT_BLOCK_KINDS is the derived complement of MATH_BLOCK_KINDS (AGENTS.md), so it splits core/sci; heuristic said AMBIGUOUS | f8wp (PR8) |
| SPLIT | `folio-assistant-core/schemas/catalogue.ts` | `who-iris/schemas/catalogue.ts` | library | rule 2 vs users: subject is iris but used at/below folio-assistant-core by ['cat-harness']; keep a generic stub, move the iris body | unplanned (#223 code partition; S5) |
| SPLIT | `folio-assistant-core/schemas/dublin-core.ts` | `who-iris/schemas/dublin-core.ts` | library | rule 2 vs users: subject is iris but used at/below folio-assistant-core by ['cat-harness']; keep a generic stub, move the iris body | unplanned (#223 code partition; S5) |
| SPLIT | `folio-assistant-core/schemas/fhir-artifact-index.ts` | `fhir-harness/schemas/fhir-artifact-index.ts` | content | rule 2 vs users: subject is fhir but used at/below folio-assistant-core by ['cat-harness']; keep a generic stub, move the fhir body | unplanned (#223 code partition; S5) |
| SPLIT | `folio-assistant-core/schemas/materialization.ts` | `cat-harness-tools/schemas/library/materialization-state.ts (states + fixity) + the rest stays in folio-assistant-core` | library | placement ruling 2 (A) / PR5 tlat: the state vocabulary and fixity move down; under D1 + "tools below core" the Zod lands in cat-harness-tools, not cat-harness; heuristic said OK | tlat (PR5) |

<details markdown="1"><summary>collapsed: OK 87, CODE 186</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| bootstrap | kg | 5 |  |  |
| bootstrap-tools | content | 3 |  |  |
| bootstrap-tools | kg | 4 |  |  |
| bootstrap-tools | sdlc | 4 |  |  |
| cat-harness | conduct |  | 3 |  |
| cat-harness | content | 20 | 53 |  |
| cat-harness | kg |  | 16 |  |
| cat-harness | library |  | 14 |  |
| cat-harness | process | 6 | 7 |  |
| cat-harness | sdlc | 2 | 74 |  |
| cat-harness | tools |  | 3 |  |
| cat-harness | ui | 1 | 11 |  |
| fhir-harness | content | 8 |  |  |
| folio-assistant-core | content | 13 |  |  |
| folio-assistant-core | library | 6 |  |  |
| folio-assistant-core | sdlc | 7 |  |  |
| folio-assistant-sci | content | 6 |  |  |
| large-datasets | content |  | 2 |  |
| large-datasets | library |  | 2 |  |
| large-datasets | sdlc |  | 1 |  |
| smart-base | content | 2 |  |  |

</details>

### source-descriptor (2)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `large-datasets/sources/lean-mathlib.json` | `folio-assistant-sci/sources/lean-mathlib.json` | library | rule 2 + D3: a source descriptor names one corpus (lean-mathlib); it is data about folio-assistant-sci, and large-datasets folds into cat-harness (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `large-datasets/sources/who-iris.json` | `who-iris/sources/who-iris.json` | library | rule 2 + D3: a source descriptor names one corpus (who-iris); it is data about who-iris, and large-datasets folds into cat-harness (2026-10-01) | unplanned (7x5n S4 subgraph ruling) |

### library-entry (59)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `agent-skills/library/agent-skill-best-practices---gemini-cli/` | `cat-harness/library/conduct/agent-skill-best-practices---gemini-cli` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/agent-skills---google-antigravity-docs/` | `cat-harness/library/conduct/agent-skills---google-antigravity-docs` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/arxiv-2602.12670v4/` | `cat-harness/library/conduct/arxiv-2602.12670v4` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/arxiv-2607.25032v1/` | `cat-harness/library/conduct/arxiv-2607.25032v1` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/arxiv-2608.08453v1/` | `cat-harness/library/conduct/arxiv-2608.08453v1` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/best-practices---google-antigravity-docs/` | `cat-harness/library/conduct/best-practices---google-antigravity-docs` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/equipping-agents-for-the-real-world-with-agent-skills-anthro/` | `cat-harness/library/conduct/equipping-agents-for-the-real-world-with-agent-skills-anthro` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/hmans-2026-beans-readme/` | `cat-harness/library/sdlc/hmans-2026-beans-readme` | sdlc | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/mcp-2026-specification-2026-07-28/` | `cat-harness/library/tools/mcp-2026-specification-2026-07-28` | tools | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness; MCP spec → tools group (MCP ruling) | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/rfc2119-key-words-requirement-levels/` | `cat-harness/library/content/rfc2119-key-words-requirement-levels` | content | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/rfc8174-uppercase-vs-lowercase-2119-key-words/` | `cat-harness/library/content/rfc8174-uppercase-vs-lowercase-2119-key-words` | content | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/skill-authoring-best-practices---claude-platform-docs/` | `cat-harness/library/conduct/skill-authoring-best-practices---claude-platform-docs` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/skills-in-openai-api-notebook/` | `cat-harness/library/conduct/skills-in-openai-api-notebook` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |
| MOVE | `agent-skills/library/skills-in-openai-api/` | `cat-harness/library/conduct/skills-in-openai-api` | conduct | ruling 2026-10-01: agent-skills becomes a library subgraph of cat-harness | unplanned (7x5n S4 subgraph ruling) |

<details markdown="1"><summary>collapsed: OK 45</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | conduct | 1 |  |  |
| cat-harness | content | 4 |  |  |
| cat-harness | kg | 7 |  |  |
| cat-harness | library | 5 |  |  |
| cat-harness | process | 7 |  |  |
| cat-harness | ui | 1 |  |  |
| fhir-harness | content | 3 |  |  |
| folio-assistant-core | content | 1 |  |  |
| folio-assistant-sci | content | 5 |  |  |
| smart-base | content | 8 |  |  |
| who-iris | content | 3 |  |  |

</details>

### script-group (552)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| MOVE | `cat-harness/scripts/artefact-verification.json` | `folio-assistant-core/scripts/artefact-verification.json` | sdlc | rule 1: code reaches folio-assistant-core; above cat-harness-tools after "tools below core" | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/bib-papers-list.txt` | `folio-assistant-sci/scripts/bib-papers-list.txt` | library | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/check-duplicate-decls.ts` | `folio-assistant-sci/scripts/check-duplicate-decls.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/check-self-discharging-instances.ts` | `folio-assistant-sci/scripts/check-self-discharging-instances.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/dak-pdf.ts` | `smart-base/scripts/dak-pdf.ts` | ui | rule 2+4: executable whose subject is smart (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/docker-latex-build/` | `folio-assistant-sci/scripts/docker-latex-build/` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/extract-candidates.py` | `folio-assistant-sci/scripts/extract-candidates.py` | library | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/gen-content-graph-uml.ts` | `folio-assistant-sci/scripts/gen-content-graph-uml.ts` | ui | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/lean-audit.ts` | `folio-assistant-sci/scripts/lean-audit.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/lean-build-bg.sh` | `folio-assistant-sci/scripts/lean-build-bg.sh` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/lean-compile-audit.sh` | `folio-assistant-sci/scripts/lean-compile-audit.sh` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/lean-coverage.ts` | `folio-assistant-sci/scripts/lean-coverage.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; 2 harness importer(s) must move with it or invert) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/lean_auto_discharge.py` | `folio-assistant-sci/scripts/lean_auto_discharge.py` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/measure-logic-layer-edges.ts` | `fhir-harness/scripts/measure-logic-layer-edges.ts` | content | rule 2+4: executable whose subject is fhir (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/pin-smart-base-terminology.ts` | `smart-base/scripts/pin-smart-base-terminology.ts` | content | rule 2+4: executable whose subject is smart (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/refresh-authors-note.ts` | `folio-assistant-sci/scripts/refresh-authors-note.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/reseed-lean-cache.sh` | `folio-assistant-sci/scripts/reseed-lean-cache.sh` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/session-status.sh` | `folio-assistant-sci/scripts/session-status.sh` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/setup-lean-toolchain.sh` | `folio-assistant-sci/scripts/setup-lean-toolchain.sh` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/setup-sage.sh` | `folio-assistant-sci/scripts/setup-sage.sh` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/simplify-links.py` | `folio-assistant-sci/scripts/simplify-links.py` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/smart-base-transform.py` | `smart-base/scripts/smart-base-transform.py` | content | rule 2+4: executable whose subject is smart (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/scripts/witness-audit.ts` | `folio-assistant-sci/scripts/witness-audit.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `folio-assistant-core/scripts/build-glossary.ts` | `folio-assistant-sci/scripts/build-glossary.ts` | library | rule 2: executable whose subject is sci (vocabulary signal) | unplanned (#223 code partition; S5) |
| MOVE | `folio-assistant-core/scripts/extract-assets.ts` | `cat-harness-tools/scripts/extract-assets.ts` | library | PR5 tlat: `asset-extraction` (cat-harness) runs it; code → cat-harness-tools (D1); heuristic said OK | tlat (PR5) |
| MOVE | `folio-assistant-core/scripts/sample-import-run.test.ts` | `cat-harness-tools/scripts/tests/sample-import-run.test.ts` | library | follows sample-import-run.ts (PR5 tlat); heuristic said OK | tlat (PR5) |
| MOVE | `folio-assistant-core/scripts/sample-import-run.ts` | `cat-harness-tools/scripts/sample-import-run.ts` | library | PR5 tlat said → large-datasets; large-datasets now folds into cat-harness, so its code goes to cat-harness-tools; heuristic said OK | tlat (PR5) |
| MOVE | `large-datasets/id-lookup/who-iris/` | `who-iris/id-lookup/` | content | D3: generated id-lookup output ABOUT who-iris is hosted by who-iris; the generator goes to cat-harness-tools | unplanned (#223 code partition; S5) |
| SPLIT | `cat-harness/scripts/eval/` | `cat-harness-tools/scripts/eval/ (generic) + folio-assistant-sci, smart-base` | content | rule 1: code reaches folio-assistant-sci, smart-base — move the reaching files up ("tools below core"), the rest to cat-harness-tools | unplanned (#223 code partition; S5) |
| SPLIT | `cat-harness/scripts/translation/` | `cat-harness-tools/scripts/translation/ (generic) + smart-base` | library | rule 1: code reaches smart-base — move the reaching files up ("tools below core"), the rest to cat-harness-tools | unplanned (#223 code partition; S5) |

<details markdown="1"><summary>collapsed: OK 115, CODE 407</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| bootstrap-tools | content | 9 |  |  |
| bootstrap-tools | kg | 3 |  |  |
| bootstrap-tools | process | 1 |  |  |
| bootstrap-tools | sdlc | 16 |  |  |
| bootstrap-tools | ui | 4 |  |  |
| cat-harness | conduct |  | 1 |  |
| cat-harness | content | 6 | 97 |  |
| cat-harness | kg | 2 | 29 |  |
| cat-harness | library |  | 34 |  |
| cat-harness | process | 1 | 25 |  |
| cat-harness | sdlc | 5 | 149 |  |
| cat-harness | tools |  | 7 |  |
| cat-harness | ui | 1 | 61 |  |
| cat-harness-tools | content | 5 |  |  |
| cat-harness-tools | kg | 1 |  |  |
| cat-harness-tools | sdlc | 1 |  |  |
| fhir-harness | content | 1 |  |  |
| fhir-harness | sdlc | 4 |  |  |
| fhir-harness | ui | 3 |  |  |
| folio-assistant-core | content | 7 |  |  |
| folio-assistant-core | library | 17 |  |  |
| folio-assistant-core | sdlc | 12 |  |  |
| folio-assistant-core | ui | 1 |  |  |
| folio-assistant-sci | content | 3 |  |  |
| folio-assistant-sci | library | 2 |  |  |
| folio-assistant-sci | sdlc | 4 |  |  |
| folio-assistant-sci | tools | 2 |  |  |
| large-datasets | content |  | 4 |  |
| smart-trust | sdlc | 1 |  |  |
| smart-trust | ui | 1 |  |  |
| who-iris | sdlc | 1 |  |  |
| who-iris | ui | 1 |  |  |

</details>

### code-group (243)

| verdict | path | target | concern | signal | PR |
|---|---|---|---|---|---|
| AMBIGUOUS | `cat-harness/content/pipeline/content-graph.ts` | `folio-assistant-sci/content/pipeline/content-graph.ts` | kg | rule 2 says folio-assistant-sci (sci vocabulary) but 8 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/lean-lexer.ts` | `folio-assistant-sci/content/pipeline/lean-lexer.ts` | content | rule 2 says folio-assistant-sci (sci vocabulary) but 8 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/markdown-ast.ts` | `folio-assistant-sci/content/pipeline/markdown-ast.ts` | content | rule 2 says folio-assistant-sci (sci vocabulary) but 3 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/profile-check.ts` | `folio-assistant-sci/content/pipeline/profile-check.ts` | sdlc | rule 2 says folio-assistant-sci (sci vocabulary) but 3 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/qa-checkers-q-usage.ts` | `folio-assistant-sci/content/pipeline/qa-checkers-q-usage.ts` | sdlc | rule 2 says folio-assistant-sci (sci vocabulary) but 3 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/qa-checkers-voice.ts` | `folio-assistant-sci/content/pipeline/qa-checkers-voice.ts` | sdlc | rule 2 says folio-assistant-sci (sci vocabulary) but 7 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/qa-criteria-registry.ts` | `folio-assistant-sci/content/pipeline/qa-criteria-registry.ts` | sdlc | rule 2 says folio-assistant-sci (sci vocabulary) but 12 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/render-latex.ts` | `folio-assistant-sci/content/pipeline/render-latex.ts` | ui | rule 2 says folio-assistant-sci (sci vocabulary) but 4 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| AMBIGUOUS | `cat-harness/content/pipeline/render-value.ts` | `folio-assistant-sci/content/pipeline/render-value.ts` | ui | rule 2 says folio-assistant-sci (sci vocabulary) but 5 harness modules import it. Q: (a) move it up with those importers, (b) split the sci part out, (c) keep it in cat-harness-tools as shared pipeline | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/_folio-chapter-profiles.qou.ts` | `folio-assistant-sci/content/pipeline/_folio-chapter-profiles.qou.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; 1 harness importer(s) must move with it or invert) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/audit-tex-source.ts` | `folio-assistant-sci/content/pipeline/audit-tex-source.ts` | library | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/audit-wiring.ts` | `folio-assistant-sci/content/pipeline/audit-wiring.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/build.ts` | `folio-assistant-sci/content/pipeline/build.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; 1 harness importer(s) must move with it or invert) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/codemod-val.ts` | `folio-assistant-sci/content/pipeline/codemod-val.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/conditional-class-banner-audit.ts` | `folio-assistant-sci/content/pipeline/conditional-class-banner-audit.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/conjectural-propagation-audit.ts` | `folio-assistant-sci/content/pipeline/conjectural-propagation-audit.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/conjectural-propagation-sweep.ts` | `folio-assistant-sci/content/pipeline/conjectural-propagation-sweep.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/content-graph-analysis.py` | `folio-assistant-sci/content/pipeline/content-graph-analysis.py` | kg | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/export-json.ts` | `folio-assistant-sci/content/pipeline/export-json.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/fsh-cone.ts` | `fhir-harness/content/pipeline/fsh-cone.ts` | content | rule 2+4: executable whose subject is fhir (vocabulary signal; 1 harness importer(s) must move with it or invert) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/generate-index.ts` | `folio-assistant-sci/content/pipeline/generate-index.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/generate-lean-stubs.ts` | `folio-assistant-sci/content/pipeline/generate-lean-stubs.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/language-trap-audit.ts` | `folio-assistant-sci/content/pipeline/language-trap-audit.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/latex-preflight.ts` | `folio-assistant-sci/content/pipeline/latex-preflight.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; 1 harness importer(s) must move with it or invert) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/lean-atlas-ingest.ts` | `folio-assistant-sci/content/pipeline/lean-atlas-ingest.ts` | library | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/lean-formal-ref.ts` | `folio-assistant-sci/content/pipeline/lean-formal-ref.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/lean-signature.ts` | `folio-assistant-sci/content/pipeline/lean-signature.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; 1 harness importer(s) must move with it or invert) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/lean-triviality-probe.ts` | `folio-assistant-sci/content/pipeline/lean-triviality-probe.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/proof-axis-dashboard.ts` | `folio-assistant-sci/content/pipeline/proof-axis-dashboard.ts` | ui | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/proof-narrative-lean-equiv-sweep.ts` | `folio-assistant-sci/content/pipeline/proof-narrative-lean-equiv-sweep.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/qa-checkers-extended.ts` | `folio-assistant-sci/content/pipeline/qa-checkers-extended.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; 2 harness importer(s) must move with it or invert) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/qa-checkers-render.ts` | `folio-assistant-sci/content/pipeline/qa-checkers-render.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/qa-checkers-triviality.ts` | `folio-assistant-sci/content/pipeline/qa-checkers-triviality.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/qa-checkers-uses.ts` | `folio-assistant-sci/content/pipeline/qa-checkers-uses.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/qa-checkers-vacuity.ts` | `folio-assistant-sci/content/pipeline/qa-checkers-vacuity.ts` | sdlc | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/refactor-strategies/` | `folio-assistant-sci/content/pipeline/refactor-strategies/` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/semantic-cone.ts` | `folio-assistant-sci/content/pipeline/semantic-cone.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/validate-references.ts` | `folio-assistant-sci/content/pipeline/validate-references.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/validate-tex.ts` | `folio-assistant-sci/content/pipeline/validate-tex.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/validate.ts` | `folio-assistant-sci/content/pipeline/validate.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| MOVE | `cat-harness/content/pipeline/wall-violations-sweep.ts` | `folio-assistant-sci/content/pipeline/wall-violations-sweep.ts` | content | rule 2+4: executable whose subject is sci (vocabulary signal; no non-test harness importer) | unplanned (#223 code partition; S5) |
| SPLIT | `cat-harness/content/pipeline/script-sidecars/` | `cat-harness-tools/content/pipeline/script-sidecars/ (generic) + folio-assistant-sci` | content | rule 1: code reaches folio-assistant-sci — move the reaching files up ("tools below core"), the rest to cat-harness-tools | unplanned (#223 code partition; S5) |

<details markdown="1"><summary>collapsed: OK 9, CODE 192</summary>

| instance | concern | OK | CODE | TO-JSON |
|---|---|---:|---:|---:|
| cat-harness | conduct |  | 2 |  |
| cat-harness | content | 7 | 78 |  |
| cat-harness | kg |  | 7 |  |
| cat-harness | library |  | 26 |  |
| cat-harness | process |  | 6 |  |
| cat-harness | sdlc |  | 46 |  |
| cat-harness | tools |  | 10 |  |
| cat-harness | ui |  | 17 |  |
| folio-assistant-core | content | 1 |  |  |
| folio-assistant-sci | content | 1 |  |  |

</details>

