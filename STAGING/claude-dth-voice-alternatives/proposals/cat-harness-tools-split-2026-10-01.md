# Split plan: `cat-harness/` → litlfred/cat-harness (content) + litlfred/cat-harness-tools (code)

**Status:** plan for review. Nothing in it has been done. It follows the
`kg-separation` method (`cat-harness/skills/kg/graph-management/kg-separation.md`,
`processes/kg/kg-separation.bpmn`, stages 0–13) and the bootstrap / bootstrap-tools
worked example (bean `xsqm`, `fsh-guts/retired/bootstrap-split.md`).

**Checkout measured:** origin/main at `609b7532ee3` (2026-10-01), in a throwaway
worktree with submodules `bootstrap@f70a56c` and `bootstrap-tools@920c772`.

**Every count comes from a script.** The scripts are in `scratchpad/chsplit/`:

| script | what it measures |
|---|---|
| `classify.py` → `classify.json` | sorts every tracked file under `cat-harness/` into KG / CODE / ABOVE / MIXED, then resolves every relative `import`/`export from`/`import()`/`require()` in the checkout and counts the edges between zones |
| `textrefs.py` | counts mentions of a code path (`scripts/…ts`, `src/…`, `schemas/*.ts`, …) in KG-side text files |
| `links.py` | resolves the relative markdown links in KG `.md` files and sorts them by where the target is |

The other counts in this document are `git ls-files` / `git grep` / `grep -c`
one-liners, and each is named where it is used. Counts marked **≈** are
heuristic: they come from a path-name pattern and may be off by about ±10 %.

**Bean:** `folio-assistant-w2gr` ("cat-harness-tools: split the MCP server and
tool implementations…", in-progress). Its scope was the MCP server only. Under
this plan it becomes the whole code half. That widening needs the owner's
agreement, and it is recorded as a premise of decision D1. The owner's
2026-10-01 rulings in that bean are still binding: Q1 (core does not import the
server half; the document adapter is split) and Q2 (`cat-harness-tools` has its
own `package.json`, the root entry points are repointed, and there are no
compatibility re-exports).

**Work in flight that this plan does not duplicate:**

| work | where | what this plan assumes |
|---|---|---|
| Placement PR0a: the checkout aggregates. The 19 upward `scope: repository` mirrors and the 7 root entries leave `cat-harness.json` | #1704 (`cmsl` steps 2–3) | lands **before** stage 1, so `cat-harness.json` declares only its own directories |
| Placement PR1: content-type skill packages move up | other branch | lands **before** stage 1. It removes the 178 files counted below as ABOVE |
| Placement PR2–PR9 | not started | see decision D4. PR7 (tests regroup) and PR8 (schemas regroup) touch code paths that stage 1 moves |
| who-iris generic DSpace code moving into the platform | #1728 | it adds code to `cat-harness/scripts`. Merge it before stage 1, or the codemod picks it up when it rebases |
| adapters closure plan | #1581 (`yj6r`/`r0tm`) | already at **0** upward imports from `cat-harness/` (measured below) |

---

## 1. Inventory

### 1.1 Tracked files under `cat-harness/`, by proposed destination

Total tracked: **8,327** files (`git ls-files cat-harness | wc -l`).

| class | files | goes to |
|---|---|---|
| KG | 6,391 | `litlfred/cat-harness` (about 560 of these are outputs about higher instances. See §1.4 and D3) |
| CODE | 1,336 | `litlfred/cat-harness-tools` |
| MIXED: Zod schemas (`schemas/**/*.ts`, 140 sources and 65 tests) | 205 | tools, following the bootstrap precedent. See §1.2 and D1 |
| MIXED: content-object block manifests (`content/docs/**/*.ts` 189, `translations/**/*.ts` 7) | 196 | stay in content **as data**. See D2 |
| ABOVE: placement PR1, in flight (`skills/authoring/{folio-paper-adapter,authoring-who-smart-guidelines,folio-document-adapter,authoring-math}`, `hypothesis-generation`, `scientific-*`, `remote-packages/*`, `requirements/{fhir-validation,lean-verification}.json`, `schemas/skills/<10 skills>`) | 178 | leaves `cat-harness` before stage 1 |
| MIXED: code inside `skills/` (excluding ABOVE) | 12 | see §1.2 |
| MIXED: browser JS in `docs/` (`assets/js/*`, `_includes/mermaid_config.js`) | 5 | see D5 |
| MIXED: tool definitions (`tools/{index,mcp,sessions,viewers}.ts`) | 4 | stay in content **as data**. See D2 |

### 1.2 By top-level path

| path | files | class | note |
|---|---|---|---|
| `AGENTS.md`, `README.md`, `cat-harness.json`, `semantic-zoom.json` | 4 | KG | `cat-harness.json` loses its six `graphKinds: [code]` entries to `cat-harness-tools.json` |
| `adapters/` | 19 | CODE | the document adapter's server half, plus the MCP server |
| `code-lists/` | 13 | KG | |
| `content/docs/` | 544 | KG + 189 `.ts` manifests | `.md` + `.ts` + generated `.jsonld` triples. 172 manifests are `export default prose({label})` and 17 are `export default webpage({...})` |
| `content/pipeline/` | 239 | CODE (153), plus `script-sidecars/` (86, `qa-script/v1` QA state) | the sidecars are hosted QA about tools. They go to `cat-harness/test/results/script-sidecars/`, as bootstrap-tools' QA is hosted in `test/results/bootstrap-tools/` |
| `deploy/` | 7 | CODE | |
| `docs/` | 1,447 | KG (5 JS files are MIXED) | 319 generated reference pages, 278 UML images, 75 workflow SVGs. Generated output stays in content, as in bootstrap |
| `external-schemas/`, `folio/`, `glossary/`, `home_page/`, `ns/`, `policies/`, `methodologies/`, `processes/` (77), `scenarios/` (67), `uml/` (277), `uploads/` | 489 | KG | |
| `library/` | 2,151 | KG | placement PR6 and PR8 regroup it, inside the content |
| `schemas/` | 264 | 205 Zod `.ts` · 11 package files (`block-qa-schema/`, `package.json`, `tsconfig.json`) · 28 KG (`README`, `.puml`, `skills/*/{input,output}.schema.json`) · 20 ABOVE | **interleaved** |
| `scripts/` | 980 | CODE | 480 tests, 320 `.ts`, 57 `.py`, 50 `.sh`, 35 `.bat` |
| `skills/` | 410 | 240 KG · 158 ABOVE · 12 code | **interleaved**: 8 `SkillDefinition` `.ts` files, 2 real tools (`kg/graph-management/kg-detangle.ts` and `group-depth.ts`), and `framework/types.ts` (a type re-export) |
| `src/` | 79 | CODE | |
| `templates/` | 17 | CODE | |
| `test/` | 1,087 | 1,027 KG (`results/`, `health/results/`) · 60 CODE (e2e specs, `support/`, `health/*.ts`) | **interleaved**: results stay in the declared `qa` and `health` graphs |
| `tools/` | 6 | 4 tool-definition `.ts` (100 `defineTool(` calls) · `discover.ts` CODE · README | **interleaved**. Owner, w2gr option A: the definitions stay in the harness |
| `translations/` | 575 | 568 KG (`.pot`, `.po`) · 7 `.ts` translation nodes | |
| `types/`, `ui/`, `viewer/` | 9 | CODE | |

### 1.3 The rule for each place where content and code are interleaved

| place | rule | precedent |
|---|---|---|
| `schemas/*.ts` (Zod and readers) | Zod sources move to `cat-harness-tools/schemas/`. Content gets **generated** JSON Schema in `cat-harness/schemas/` (one file per node kind, plus the declaration schema `harness-schema-export` already writes). The 46 `schemas/skills/*/*.schema.json` files stay in content | bootstrap: Zod in `bootstrap-tools/schemas`, generated JSON Schema in `bootstrap/schemas` (`xsqm` ruling 1) |
| block manifests (`.ts` beside `.md`) | become data (`<block>.json`). `readBlockManifest` accepts `.json`. The generated `.jsonld` must stay byte-identical | FR-7: content holds no code |
| `tools/*.ts` definitions | become one JSON node per tool under `cat-harness/tools/<stub>/` (100 nodes). `discover.ts` moves to tools and validates the nodes with `ToolDefinitionSchema` | w2gr option A: definitions in the harness, implementations in the tools |
| `skills/**/*.ts` | `SkillDefinition` files (8) become entries in `skills/skill-definitions/*.json` (the #1702 form, 23 already exist). `kg-detangle.ts` and `group-depth.ts` move to `cat-harness-tools/scripts/kg/`. `framework/types.ts` moves to tools | `bootstrap-tools/skills/` holds the toolset's own skills, and code never sits in content skills |
| `test/` | `test/results/**` and `test/health/results/**` stay in content (declared `qa` and `health`). Every spec, fixture and checker goes to tools | hosted QA: `test/results/bootstrap{,-tools}/` |
| `content/pipeline/script-sidecars/` | moves to `cat-harness/test/results/script-sidecars/`. The sidecar path in `qa-utils.ts` is repointed. A sidecar lives in the qa graph, wherever its subject lives | as above |
| generated files written into content (UML, reference docs, SVGs, READMEs, `.jsonld`) | stay in content. Each carries a generated-by note that names `cat-harness-tools` | `bootstrap-tools/scripts/generated-by.ts` |

### 1.4 Code that `cat-harness` owns outside `cat-harness/`

| site | count | source of the count |
|---|---|---|
| root `package.json` scripts naming a `cat-harness/` path | **338 of 378**. 338 name a code path; 3 also name skills code | python over `scripts` |
| root `package.json` `main`, `exports`, `files` | `main` and all `exports` point at `cat-harness/src/…`. `files` lists `cat-harness/src/` and `cat-harness/ui/` | same |
| `.github/workflows/*` mentions of `cat-harness/` | **209 mentions in 13 of 33 workflows**. 136 are code paths. The largest are `feature-staging` 75, `docs-site` 47, `jsonld-gen-check` 33, `code-quality-gates` 17 and `folio-staging` 14 | `grep -o` |
| workflows already checking out submodules | 31 files contain `submodules: true`. No `actions/checkout` step lacks a `submodules` key | `grep` |
| `tsconfig.json` `include` | 9 `cat-harness/**` globs, plus `tools/**` and higher-instance globs | parsed |
| `bunfig.toml` | `preload = ["./cat-harness/schemas/test-preload.ts"]` | read |
| `.mcp.json` | 3 servers: `cat-harness/src/index.ts`, `scripts/sage-mcp.sh`, `scripts/google-drive-mcp.sh` | read |
| `.claude/settings.json` hooks | 3 (`session-start-coord-sweep.sh`, `ask-well.sh`, `decisions-named-not-asked.ts`), plus 46 `.claude/**` files naming a code path | `git grep` |
| `playwright.config.ts` | imports `./cat-harness/scripts/playwright-chromium`, with `testDir: ./cat-harness/test` | read |
| higher instances that **import** cat-harness code (scripts, src, content/pipeline, test) | core 17 files · sci 6 · who-iris 1 · fhir-harness 1 · large-datasets 1 | `classify.py` |
| higher instances that **import** cat-harness Zod | core 27 · sci 6 · who-iris 5 · smart-trust 3 · fhir-harness 2 · smart-base 1 · root `tools/index.ts` 1 · fsh-guts 1 | `classify.py` |
| non-import mentions of cat-harness code paths outside `cat-harness/` (excluding `beans/` and `fsh-guts/`) | 2,223 mentions. `beans/` (232 files) is history and is **not rewritten** | `git grep -c` |
| `upstream-pins.json` | 2 notes naming `content/pipeline/qa-utils.ts` and `script-sidecars` | read |

---

## 2. Dependency direction

Target, declared in each `needs`:
- `cat-harness` needs only `bootstrap`. It **drops** `bootstrap-tools`, because only its Zod and code imported that.
- `cat-harness-tools` needs `cat-harness`, `bootstrap` and `bootstrap-tools`, and declares `supports: {"cat-harness": [0]}`.

`check:import-direction --all` reads the `needs` lists and gates each one. Once
`cat-harness-tools.json` exists, a `cat-harness` → `cat-harness-tools` import
fails CI without any edit to the checker. Plant one and watch it go red first
(precondition 3).

**Import edges measured today** (`classify.py`: import statements / distinct importing files):

| from → to | stmts | files | after the split |
|---|---|---|---|
| CODE → Zod | 1,101 | 621 | both are in tools. Because `scripts/`, `src/` and `schemas/` all move as siblings, **these relative specifiers do not change** |
| block manifests → Zod (`builders.ts`, `webpage.ts`) | 196 | 196 | **blocker**: content importing code. Fixed by D2 (manifests become data) |
| tool definitions → Zod (`tool.ts`, `tool-types.ts`, `cat-harness.ts`) | 9 | 4 | **blocker**. Fixed by D2 |
| skill `.ts` → Zod/code | 9 | 3 | **blocker**. Fixed by the §1.3 rule |
| Zod → CODE | 30 | 17 | all `*.test.ts`, and all of it moves to tools. No source schema imports a script |
| CODE and Zod → `bootstrap-tools` | 32 | 29 | allowed: tools need bootstrap-tools |
| `cat-harness` → any higher instance (static import) | **0** | 0 | `git grep` for `from '../…/(folio-assistant-core|…)/'` finds nothing |
| higher instances → cat-harness CODE | 73 | 27 | becomes higher → **cat-harness-tools**. Conflicts with Q1 as worded. See D1 |
| higher instances → cat-harness Zod | 77 | 46 | the same. See D1 |
| unresolved specifiers inside CODE (variable paths, `${platformDir}`, the `init-folio` templates) | 50 | 18 | reviewed by hand in stage 1a. `builtin-adapters.ts`, `route-groups.ts` and `qa-checker-discovery.ts` load modules by path |

**Non-import references from content into code** (`textrefs.py`, over KG text only):

| | files | mentions |
|---|---|---|
| all KG text naming a code path | 1,479 | 22,551 |
| …generated (`test/results` 12,251 · `docs/assets/*.json` 6,045 · `docs/glossary` 1,586 · `docs/reference` 934 · UML 431) | most | regenerated by the tools. They need a `cat-harness-tools:`-qualified form, as `bootstrap-tools` names itself in generated-by notes |
| …authored: `skills/` | 116 | 438 |
| …authored: `processes/` | 10 | 11 |
| …authored: `scenarios/` | 8 | 9 |
| …authored: `cat-harness.json` | 1 | 9 |
| …authored: guides, architecture, proposals | ≈40 | ≈250 |

The authored mentions are prose citations, not dependencies. They become
repository-qualified references (`litlfred/cat-harness-tools:scripts/x.ts`) or
URLs, which is the fix bootstrap's QA applied ("a term link across two
repositories is a URL to the declared repository").

Relative markdown links in authored KG `.md` files (`links.py`) that point into
code: 23. Links that leave `cat-harness/`: 38 (`AGENTS.md` 7, `README.md` 4,
other instances 26, `package.json` 1).

### Blockers

1. **`schemas/graph-kind-registry.ts` names 7 distinct validators in higher
   instances, at 8 sites.**
   - `folio-assistant-core:schemas/{extraction,dublin-core×2,catalogue×2,fhir-artifact-index,review-verdict}.ts`
   - `large-datasets:schemas/source-descriptor.ts`

   Once the registry is in tools, these are tools reaching up a layer.

   Fix: the owning instance registers the kind on load. This is the `q2wn`
   pattern that core's `folio` and `glossary` kinds already use (`import
   "./folio-graph-kind.js"` in `cat-harness.ts`). It lands in stage 1b.
   - `catalogue`, `extraction`, `fhir-artifact-index` and `review-verdict` move to core.
   - `source-descriptor` moves to large-datasets.
   - Placement PR5 already moves materialization and extraction.
2. **`scripts/tests/remote-packages-honest-docs.test.ts:48` reads `../fsh-guts/scripts/generate-docs.ts`.**

   It fails in a standalone tools checkout. Fix: move the test to a root-level
   test (it guards an `fsh-guts` file, which belongs to the checkout), or skip
   it when the file is absent and report "could not determine". It lands in
   stage 1d.
3. **About 204 code files compute "this instance's root" as `import.meta.dir/..`.**
   - 135 top-level files go up one level, which means the harness root.
   - 105 `scripts/*.ts` files go up two levels, which means the repo root.
   - Of the `scripts/tests` files, 3 go up one level, 68 go up two and 57 go up three.
   - 346 files define a `ROOT`, `REPO_ROOT`, `INSTANCE_ROOT` or `PLATFORM_ROOT` constant. There is no central helper.
   - 518 code files use relative string literals for KG directories (`"skills/"`, `"processes/"`, …).
   - 123 code files use literal `cat-harness/<KG dir>` strings.

   After the move, `import.meta.dir/..` is `cat-harness-tools/`, **not** the
   content. This is the largest mechanical item. Fix: a single
   `cat-harness-tools/scripts/lib/roots.ts` exporting `HARNESS_ROOT`, resolved
   in this order:
   1. `--harness <dir>`
   2. `$CAT_HARNESS_ROOT`
   3. the sibling `../cat-harness` whose declaration `name` is `cat-harness`

   It also exports `TOOLS_ROOT` and `REPO_ROOT` (which may be absent when
   standalone). A codemod then replaces every one-level-up root that means the
   harness. Two-level roots keep their depth, because the staged sibling sits
   at the same depth.
4. **Root `package.json`**: 338 scripts, `main`, 10+ `exports`, `files`.

   Per Q2, `cat-harness-tools/package.json` carries the entry points, and the
   root scripts are rewritten by a codemod (`cat-harness/` →
   `cat-harness-tools/`). There are no re-exports.
5. **Workflows**: 136 code-path mentions in 13 files, repointed by the same
   codemod. Path filters such as `docs-site.yml`'s `'cat-harness/scripts/**'`
   must list **both** directories.
6. **`bunfig.toml` preload, `tsconfig.json` include (9 globs), `.mcp.json` (3), `.claude/settings.json` (3 hooks), `playwright.config.ts`.**

   Each is a one-line repoint. The preload moves in 1b, with
   `schemas/test-preload.ts`.
7. **The MCP server entry `cat-harness/src/index.ts`** becomes
   `cat-harness-tools/src/index.ts`.
   - `.mcp.json`, `start*` scripts, `mcp:capture`, `build-lean-mcp.yml` (`adapters/mcp-server/Dockerfile`) and `start-folio-assistant.sh` all follow it.
   - Falsifier: `mcp:capture` lists the same tool set before and after.
8. **The docs-site build reads `cat-harness/docs` as its Jekyll base.**
   - The generators `gen-schema-docs`, `gen-skill-docs`, `gen-docs-pages`, `compose-docs`, `mount-instance-docs`, `kg-export`, `harness-schema-export`, `kg-viewer` and `glossary-export` are code and move.
   - The content they read and write (`cat-harness/docs/**`) stays.
   - `docs-site.yml` keeps building from the checkout, with both submodules present. See D5.
9. **Higher instances import 73 code statements and 77 Zod statements** from what becomes `cat-harness-tools`. This needs a ruling: see D1.

   Two of them sit outside the document adapter, which Q1 already splits:
   - core `scripts/sample-import-run.ts` drives `src/tools/workflow.ts`. Blocker 2 in w2gr, still open.
   - core and sci use `content/pipeline/{qa-utils,repo-root,content-graph,render-latex,…}` and `src/workflow/*`.
10. **`scripts/partition/instance-rules.ts`** uses `ROOT = scripts/partition/../..` and `SCAN_ROOTS = [src, schemas, adapters, content, scripts, test, types]`.

    Its `REPOS` table has no `cat-harness-tools`. Add it as the harness's code
    half (`ALLOWED`: tools → harness). `kg:detangle` moves with
    `kg-detangle.ts`, and its `SCAN` list needs `cat-harness-tools/`.

---

## 3. Known blockers: verification

| claimed | verified | measured |
|---|---|---|
| `graph-kind-registry.ts` names 7 validators in higher instances | **yes** | 7 distinct `module#Export`, 8 sites (lines 870, 1348, 1352, 1451–1453, 1492, 1763). Core 6 sites, large-datasets 1. Plus 1 `bootstrap-tools:` site, which is allowed |
| `remote-packages-honest-docs.test.ts` reads `fsh-guts/` | **yes** | line 48, `readFileSync(join(ROOT, "../fsh-guts/scripts/generate-docs.ts"))` |
| root `package.json` scripts → `cat-harness/scripts` | **yes** | 307 scripts name `cat-harness/scripts/`. 338 name any `cat-harness/` code path. The total is 378 scripts |
| workflows → `cat-harness/` | **yes** | 209 mentions in 13 files (136 code paths) |
| `bunfig.toml` | **yes** | 1 preload |
| tsconfig paths | **yes**, as `include` globs | no `paths` map. 9 `cat-harness/**` globs |
| MCP entry `cat-harness/src/index.ts` | **yes** | `package.json` `main` and `exports["."]`, `.mcp.json` |
| docs-site reads `cat-harness/docs` | **yes** | `docs-site.yml` has 47 mentions, including `compose-docs --out`, `mount-instance-docs --built cat-harness` and `print-stub ./cat-harness` |

---

## 4. Staged sequence

The stages follow the `kg-separation` table (0–13). **Nothing is committed to
the new repositories before stage 10.** Each stage is one PR on folio-assistant
unless the table says otherwise.

### Stage 0: preconditions (no moves)

- **Claim:** claim `w2gr`. Record the owner's D1–D6 answers in it.
- **Wait for PR0 and PR1:** wait for #1704 (PR0a) and PR1 to merge. Re-run `classify.py`: ABOVE must be 0, and `cat-harness.json` must hold no `scope: repository` entries.
- **Watch the boundary gates fail:** `check:import-direction` (cat-harness → planted cat-harness-tools file) and `check:tools-closure`, generalised to take an instance name. Watch each one go red on a planted violation.
- **Record the baseline:** the `bun test` pass count, the `mcp:capture` tool list, the outputs of every generator's `--check`, and the `knownSkills` set.
- **Gates:** none change.
- **Falsifier:** a planted violation that stays green. If one does, stop and fix the gate first.

### Stage 1a: stage `cat-harness-tools/` as a sibling and `git mv` the unambiguous code

- **Moves (≈1,340 renames):**
  - `scripts/` (980), `src/` (79), `adapters/` (19), `content/pipeline/` (153; the 86 `script-sidecars` go to `cat-harness/test/results/script-sidecars/`)
  - `test/**` except results (60), `templates/` (17), `deploy/` (7), `types/` (2), `ui/` (5), `viewer/` (2)
  - `schemas/{block-qa-schema/,package.json,tsconfig.json}` (11), `skills/kg/graph-management/{kg-detangle,group-depth}.ts`, `skills/framework/types.ts`, `tools/discover.ts`
- **New files:**
  - `cat-harness-tools/cat-harness-tools.json`: `needs [cat-harness, bootstrap, bootstrap-tools]`, `supports {cat-harness:[0]}`, `version 0.1.0`. It takes the six `code` directory entries removed from `cat-harness.json`.
  - `package.json` (Q2), `scripts/lib/roots.ts`.
- **Edits:**
  - Blocker 3 codemod (≈204 root sites, plus literals that mean the harness).
  - Root `package.json` (338 scripts, `main`, `exports`, `files`), workflows (136), `tsconfig` (9 globs), `.mcp.json` (3), `.claude/settings.json` (3), `playwright.config.ts`, `upstream-pins.json` (2).
  - Higher-instance imports of code (27 files), repointed to `cat-harness-tools/` (needs D1).
  - `instance-rules.ts` `REPOS`/`ROOT`, and `kg:detangle` `SCAN`.
- **Gates most likely to break:**
  - `check:stale-paths`, `check:declared-paths` (baseline keyed by file, so it churns), `check:command-paths`, `check:declared-dirs`, `check:harness-dirs`, `harness:dirs:check`
  - `check:subgraph-coverage`, `audit:coverage:require-all`/`strict`, `kg:audit:check` (code nodes), `skill:register:check`, `docs:harness:check`, `readme:sync:check`, `bat:sync:check`
  - `check:partition`, `uml:overview:check`, `check:instance-graph`, `bun test`, `bunx playwright test`
- **Falsifiers:**
  1. Every generator's `--check` output is byte-identical to the stage-0 baseline. Only generated-by path strings may differ, and the diff must show only that.
  2. The `bun test` pass count is equal.
  3. `mcp:capture` gives an identical tool list, and the server starts over stdio.
  4. `check:import-direction --all` is green, and the planted `cat-harness` → `cat-harness-tools` import is red.
- **Size:** the largest PR. Mostly renames and a codemod, with 1,000–1,500 edit sites.

### Stage 1b: Zod down, generated JSON Schema up

- **Moves:** `schemas/*.ts` (205) → `cat-harness-tools/schemas/`. `bunfig.toml` preload follows.
- **New:** a generator (an extension of `harness-schema-export`) writes one JSON Schema per declared node kind into `cat-harness/schemas/`, with `$id` under `iriBase`. `check:node-iris`-style gate: each `$id` is its file's path.
- **Edits:**
  - The 621 intra-tools importers need no change, because the relative paths are preserved.
  - The 46 higher-instance Zod importers repoint (D1).
  - Blocker 1: core and large-datasets register their own 6 kinds on load. The registry no longer names them.
  - `cat-harness.json` drops `bootstrap-tools` from `needs`.
- **Gates:** `check:kind-validators`, `kg:schema:check`, `check:layout-norms`, `code-lists:check`, `docs:harness:check` (generated reference), `bun test`.
- **Falsifiers:**
  - `cat-harness/docs/reference/**` is regenerated byte-identical.
  - The `check:kind-validators` count is unchanged.
  - Every kind in `GRAPH_KINDS` has a JSON Schema file.
- **Size:** 205 renames, ≈60 edits, 1 new generator.

### Stage 1c: content holds no code (FR-7)

- **Conversions:**
  - 189 block manifests and 7 translation nodes → `.json`.
  - 100 `defineTool` literals → 100 JSON tool nodes. The 129 `test/results/kg-qa/tools/*` sidecars must keep their verdicts; relocate them with the identity-checked `lps0` relocation if their subject key is a path.
  - 8 `SkillDefinition` `.ts` files → `skill-definitions/*.json`.
  - Browser JS per D5.
- **New gate:** `check:content-code-free`. It fails if any `.ts`, `.js`, `.py` or `.sh` file is tracked under `cat-harness/`. Watch it fail first.
- **Gates:** `jsonld-gen-check` (the 166 node `.jsonld` files and the page `.jsonld` files must be byte-identical), `check:tools`, `tool-coverage`, `kg:audit:check`, `check:skills`.
- **Falsifiers:** `.jsonld` byte-identical, `knownSkills` identical, `kg-export` node count identical.
- **Size:** ≈300 files converted by codemod, plus a reader change in `qa-utils` and `discover.ts`.

### Stage 1d: content is self-contained

- **Hosted outputs about higher instances (≈560 files):** handle per D3. The main ones are `uml/overview/<instance>` 188, `docs/uml/overview` 94, `docs/assets/img/uml/*` ≈211, and `docs/cat-harness/{catalogue,library,voices}/<instance>` 27.
- **Authored prose:** rewrite the authored code-path mentions (§2: skills 438, processes 11, scenarios 9, docs ≈250) and the 23 code links and 38 outbound links to repository-qualified references or URLs. Regenerate the generated ones.
- **Blocker 2:** the `fsh-guts` test.
- **Gates:** `readme:audit`, `check:stale-paths`, `kg:audit:check`, `uml:overview:check`, `docs:harness:check`.
- **Falsifier:** a link audit over `cat-harness/` alone reports 0 links that leave the directory, except declared cross-repository URLs.
- **Size:** about 600 files touched, mostly generated.

### Stage 2: rehearse standalone

- **New:** `cat-harness-tools/scripts/rehearse-standalone.ts`, a copy of `bootstrap-tools/scripts/rehearse-standalone.ts`. It copies only the tracked files of `cat-harness/`, `cat-harness-tools/`, `bootstrap/` and `bootstrap-tools/` into an empty temporary directory. Each copy gets `git init` and `git add`, and `node_modules` is linked in.
- **What the rehearsal runs:**
  - closure, and `check:import-direction` scoped to the two instances
  - every generator's `--check`, `kg:audit:check`, `skill:register:check`, `harness-schema-export --check`, `kg-export --out /dev/null`
  - `tsc`, `bun test .`
- **CI step:** `check:cat-harness-standalone`.
- **Expected failures, fixed in place:**
  - tools that walk the checkout for higher instances (`instanceRootsIn`, the checkout aggregate from PR0a) must handle "none found" as an empty overlay
  - tests whose fixtures live in higher instances (placement §5: 11 test fixtures and 18 code/docs files name moved diagrams)
- **Falsifiers:**
  - An empty tree exits non-zero.
  - A planted read of `../folio-assistant-core/x` is red.
- **Size:** 1 script, plus whatever it finds. Bootstrap's first run found 2 defects.

### Stage 3: authorise (owner)

The report covers what moves, the sizes and what breaks (§1–§2). It goes in
the bean and the PR. Wait for the owner's go
(`deletion-requires-confirmation`). Confirm that both repositories exist and
are empty. `litlfred/cat-harness-tools` was measured empty on 2026-09-30, and
`litlfred/cat-harness` was not checked.

### Stage 4: seed (one commit each, no history)

Owner ruling of 2026-09-30, for bootstrap: one commit of the tracked files,
whose message names the folio-assistant source SHA.
- **Both repositories:** remove `livesAt`; add `LICENSE`, `NOTICE` and `LICENSE-CONTENT.md`.
- **cat-harness-tools only:** add a standalone `tsconfig.json`, `.gitignore` and `bun.lock` (`bun install` from its own `package.json`); CI is described but disabled; the AGENTS.md lanes are verified from the directory.
- **Version:** both start at `0.1.0`, the content's current version.

### Stage 5: QA from scratch

- **Method:** fresh clones of the four repositories, as siblings in an empty directory.
- **Checks:**
  - `bun install --frozen-lockfile`
  - `tsc`, `bun test`, closure, the rehearsal and every `:check` script in `cat-harness-tools/package.json`
  - a link audit: 0 broken links, and 0 leaving the repository except declared URLs
  - a names-outside audit: every remaining mention of folio-assistant or a higher instance is intentional
  - licence files present
- **Output:** `QA-cat-harness.md` and `QA-cat-harness-tools.md`, in the format of `QA-bootstrap{,-tools}.md`.
- **Fixes:** fixes made during QA are committed to the new repositories, not back into the staged copies.

### Stage 6: submodules

- **Replace the staged directories:** replace `cat-harness/` and `cat-harness-tools/` with submodules at the **same paths**, pinned to the seeded SHAs. `.gitmodules` gains 2 entries, and the 31 workflows already set `submodules: true`.
- **Gates must pass unchanged:** `gates --all` green with no path edits, because the paths did not move. The rehearsal step and `check:published-refs` must also pass.
- **Archive the staged copies** to `fsh-guts/retired/cat-harness-split.md` and archive per D6, then add `cat-harness-split` to `bunfig` `pathIgnorePatterns` if any `.ts` file is unpacked.
- **Falsifier:** `gates --all` on the submodule checkout matches the pre-cutover run gate for gate.

### Later (not in this plan)

- **Stage 12:** first release, with plain `v0.1.0` tags and `/0.1.0/` and `/v0/` publication.
- **Stage 14:** `upstream-version-adoption` for each new pin.

---

## 5. Open decisions for the owner

### D1. May the higher instances' **code** import `cat-harness-tools`?

**Context.**
- Under this split every line of code leaves `cat-harness`, including the Zod schemas, `src/workflow/*` and `content/pipeline/*`.
- Today, 46 files in core, sci, who-iris, smart-trust, fhir-harness, smart-base and root `tools/` import cat-harness Zod. Another 27 files import cat-harness scripts and src.
- Your 2026-10-01 ruling Q1 says "core does not import cat-harness-tools". That ruling was made when cat-harness-tools was **only the MCP server**.
- The `kg-separation` skill's own table says the parent "imports the tools' Zod and writers". Here the parent is core, just as cat-harness imports bootstrap-tools today (bean `0lj4`).

**Options:**
1. **(Rec.) Code may, content may not, and never the server.**
   - Higher instances' **code** needs `cat-harness-tools`, but only its `schemas/`, `content/pipeline/` and `src/workflow/` subpaths. A subpath closure gate forbids `src/{index,server,routes,tools}`, which keeps Q1's intent: the document adapter's server half still moves.
   - Higher instances' content stays code-free when each of them is split in turn.
   - This mirrors bootstrap exactly.
2. **Keep a library layer in cat-harness.** `schemas/*.ts`, `src/workflow/` and the pipeline helpers stay in cat-harness. That leaves ≈450 `.ts` files in the content repository, which contradicts FR-7 and "exactly as bootstrap".
3. **Split every higher instance into X and X-tools now,** so only `-tools` repositories import `cat-harness-tools`. This is correct long-term but multiplies the work by about 5. It is out of scope here.

**Default:** option 1. Stage 1a proceeds on that basis. If you choose otherwise before stage 1b, only 1b's repointing changes.

### D2. How content that is written in `.ts` today becomes data

**Context.** These files all execute Zod at load time, through `validated(...)`, `defineTool` and the `SkillDefinition` types:
- 196 content-object manifests: 172 `prose({label})`, 17 `webpage({...})` and 7 translation nodes
- 100 `defineTool` tool definitions in 4 files (you ruled in w2gr that definitions stay in the harness)
- 8 `SkillDefinition` `.ts` files

FR-7 says content holds no code. A builder shim (`content/schema/builders.ts` re-exporting from tools), as folios use, would make `cat-harness` import `cat-harness-tools`. That is a cycle.

**Options:**
1. **(Rec.) Convert all three to JSON data**, validated by the tools on read. A codemod writes `<block>.json`, one JSON node per tool under `tools/<stub>/` and entries in `skill-definitions/*.json`. The generated `.jsonld` must stay byte-identical.
2. **Make the generated `.jsonld` authoritative** for blocks, and drop both the `.ts` and a separate `.json`. That gives fewer files, but the `.jsonld` carries derived fields (`contains`) that would then be authored.
3. **Move `content/docs/` and the tool definitions into `cat-harness-tools`.** This reverses w2gr option A and puts the harness's own documentation in the code repository.

**Default:** option 1.

### D3. Outputs about **higher** instances that cat-harness hosts today (≈560 files)

**Context.**
- These are UML overviews of core, who-iris, smart-base and others (`uml/overview/<instance>` 188, `docs/uml/overview` 94, `docs/assets/img/uml` ≈211) and `docs/cat-harness/{catalogue,library,voices}/<instance>` (27).
- Hosted outputs about **bootstrap** (109 files, including `test/results/bootstrap{,-tools}`) follow the skill's rule: the harness hosts output about its content.
- The higher instances are not cat-harness's content. A standalone cat-harness repository would describe instances that depend on it, which is an upward reference.
- PR0a already moves the checkout-wide directories to `folio-assistant.json`.

**Options:**
1. **(Rec.) Move them to the checkout root** (folio-assistant's `docs/` overlay and a root `uml/`), declared by `folio-assistant.json`. The tools still generate them, running from the checkout.
2. **Each instance hosts its own,** under `<instance>/uml/` and `<instance>/docs/`. That is clean per instance, but it scatters 10 generator targets.
3. **Keep them in cat-harness as hosted outputs.** That is the cheapest option, but the standalone repository then names about 15 instances above it.

**Default:** option 1.

### D4. Order relative to placement PR2–PR9

**Context.**
- PR2–PR6 and PR9 move KG files (skills, processes, roles, library, docs), which stage 1 does not touch.
- PR7 regroups tests into `scripts/tests/<group>/`, and PR8 regroups schemas. Both of those paths move in stage 1.
- `git mv` of whole directories rebases cleanly. Edits inside moved files do not always.

**Options:**
1. **(Rec.) Split after PR0 and PR1, before PR2.**
   - PR7 and PR8 are re-targeted to `cat-harness-tools/scripts/tests/<group>/` and `cat-harness-tools/schemas/`.
   - PR2–PR6 and PR9 are unaffected.
   - Every later placement PR then runs against the two-instance layout it is aiming for.
2. **Finish PR0–PR9 first, then split.** This gives the fewest rebases but delays the split by the whole placement programme.
3. **Interleave:** run stage 1a now and 1b–1d after PR8. This gives the most churn on `schemas/`.

**Default:** option 1.

### D5. The docs site, its browser JavaScript and the address base

**Context.**
- `cat-harness/docs` is the Jekyll base of `litlfred.github.io/folio-assistant/`, which `canonicalUrl` names. `iriBase` is already `https://litlfred.github.io/cat-harness/`.
- 5 site JS files (`docs-ui.js`, `work-plan.js`, `mermaid_config.js`, and vendored files) are code inside `docs/`.
- For bootstrap you ruled (Q3 A) that its own site serves only what the tools generate, rendered by Pages' Jekyll with no paid CI.

**Options:**
1. **(Rec.) Keep the full site built from the folio-assistant checkout** (both submodules), and keep `canonicalUrl`. The site chrome (`_includes`, `_layouts`, `assets/js`, `assets/css`) moves to `cat-harness-tools/site/` and is composed in at build time by `compose-docs`. cat-harness's own Pages at `iriBase` serves only the content and generated files (stage 12).
2. **Keep the chrome in `cat-harness/docs`** and exempt `docs/**/*.js` from FR-7 as browser assets, not imported code. That is simpler, but `check:content-code-free` then needs an exemption.
3. **Build the site from the cat-harness repository itself.** That needs tools and CI in the content repository, which contradicts FR-7 and "no paid runs".

**Default:** option 1.

### D6. How the staged copies are archived in `fsh-guts`

**Context.**
- For bootstrap, both directories were packed into a 156 KB `bootstrap-split.tar.gz`.
- `git archive` of `cat-harness/` today is **69.4 MB** gzipped, mostly `library/`.
- `bun run health` tracks clone size, and the same files remain reachable at the source SHA in history.

**Options:**
1. **(Rec.) Manifest only.** `fsh-guts/retired/cat-harness-split.md` names the source SHA and lists `git archive <sha> cat-harness`, with no tarball.
2. **A tarball of the code half only** (≈1,550 files, a few MB) plus the manifest.
3. **A full tarball,** as for bootstrap. This adds about 69 MB to every clone.

**Default:** option 1.

---

## 6. Summary of sizes

| stage | renames | edit sites (approx.) | new files |
|---|---|---|---|
| 0 | 0 | a few (planted-failure tests) | 0 |
| 1a | ≈1,340 | 1,000–1,500 (codemod) | declaration, `package.json`, `roots.ts` |
| 1b | 205 | ≈60, plus higher-instance repoints (46 files) | generator, ≈60 JSON Schemas |
| 1c | ≈300 converted | ≈10 readers | `check:content-code-free` |
| 1d | ≈560 (D3) | ≈700 authored mentions, plus regenerated output | 0 |
| 2 | 0 | as found | rehearsal script |
| 4–6 | – | `.gitmodules` (+2), `fsh-guts` manifest | 2 repositories |

---

## Owner rulings, 2026-10-01

- **D1:** "shouldn't we move cat-harness code to cat-harness-tools? … f-a-core (in general dependent harnesses) can reference and use cat-harness or other harness/tools in its dependency chain." → ALL cat-harness code moves to cat-harness-tools (widens w2gr). A dependent instance's code may import anything in its dependency chain, cat-harness-tools included; the import-direction gate only forbids upward edges.
- **D2:** Option 1 — convert `.ts` content (manifests, tool defs, skill defs) to JSON; generated `.jsonld` byte-identical; gate fails on code in content.
- **D3:** Option 2 — each instance hosts the generated outputs about itself.
- **D4:** Option 3 — interleave split stages with placement PRs.
- D5, D6: defaults (site built from folio-assistant at the current URL; fsh-guts manifest naming the source commit, no tarball).
