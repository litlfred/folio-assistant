---
# folio-assistant-70lx
$schema: bean/1.0.0
title: 'Separation stage 1a: stage cat-harness-tools/ as a sibling instance and git mv the unambiguous code'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-16T06:30:00Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-pyds
---

Stage 1a of the split plan: stage `cat-harness-tools/` as a sibling instance in this repo and `git mv` the unambiguous code (≈1,340 renames). Owner D1 (2026-10-01): ALL cat-harness code moves; dependents' code may import cat-harness-tools. D4 (2026-10-01): 1a runs NOW, before placement PR2.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

**Moves:** `scripts/` (980), `src/` (79), `adapters/` (19), `content/pipeline/` (153; its 86 `script-sidecars` go to `cat-harness/test/results/script-sidecars/`), `test/**` except results (60), `templates/`, `deploy/`, `types/`, `ui/`, `viewer/`, `schemas/{block-qa-schema/,package.json,tsconfig.json}`, `skills/kg/graph-management/{kg-detangle,group-depth}.ts`, `skills/framework/types.ts`, `tools/discover.ts`.
**New:** `cat-harness-tools/cat-harness-tools.json` (`needs [cat-harness, bootstrap, bootstrap-tools]`, `supports {cat-harness:[0]}`, `0.1.0`; takes the six `code` entries out of `cat-harness.json`), its own `package.json` (`w2gr` Q2, 2026-10-01: no compatibility re-exports), `scripts/lib/roots.ts` (`HARNESS_ROOT` from `--harness` → `$CAT_HARNESS_ROOT` → sibling `../cat-harness`; plus `TOOLS_ROOT`, `REPO_ROOT`).
**Edits:** blocker-3 codemod (≈204 `import.meta.dir/..` root sites), root `package.json` (338 scripts, `main`, `exports`, `files`), workflows (136 code-path mentions in 13 files; path filters list BOTH dirs), `tsconfig` (9 globs), `.mcp.json`, `.claude/settings.json` hooks, `playwright.config.ts`, `upstream-pins.json`, higher-instance code imports (27 files), `partition/instance-rules.ts` `REPOS`/`ROOT`, `kg:detangle` `SCAN`. The MCP server entry becomes `cat-harness-tools/src/index.ts` — this discharges `w2gr`'s server move (Q1: the document adapter's server half moves; core keeps the content logic).

## Done when
- [x] falsifier 1: every generator's `--check` output byte-identical to the stage-0 baseline except generated-by path strings (diff shows only those)
- [ ] falsifier 2: `bun test` pass count equal to the stage-0 baseline
- [x] falsifier 3: `mcp:capture` tool list identical; the server starts over stdio from `cat-harness-tools/src/index.ts`
- [x] falsifier 4: `check:import-direction --all` green, and the planted `cat-harness → cat-harness-tools` import red
- [ ] `bun run cat gates --all` green, or each failure shown pre-existing on the base SHA


## 2026-10-01 — absorbs w2gr step 3b (separation arc 7x5n, gap G2)
w2gr 3b and this stage are the same git mv. This bean survives. The move list from w2gr's handover:
- cat-harness/src server modules -> cat-harness-tools/src/: entry points, src/tools/*, src/routes/*, core/{rbac,github-auth}, src/auth, src/mcp. core/{git,feedback,cache,logging,anthropic,safe-path} STAY (until D1 moves all code).
- core's server wrapper + tool registrars, with tests; folio-assistant-core/scripts/sample-import-run.ts.
- document content-adapter declaration -> cat-harness-tools.json; adapter paths in src/builtin-adapters.ts; sci-adapters re-described as sci's server half.
- root package.json entries, .mcp.json, tsconfig, partition rules.
- traps: join(import.meta.dir, ...) paths and workflow paths: filters only show in CI.
NOTE cat-harness-tools/ already exists on main (#1742, w2gr step 3a).


## Owner ruling C1, 2026-10-01 (separation arc 7x5n): cat-harness-tools sits BELOW core
cat-harness-tools needs only cat-harness (+ bootstrap-tools); folio-assistant-core MAY depend on it. MCP-server / tool-implementation parts that need core move UP into folio-assistant-core. Supersedes the reading of the 2026-10-01 ruling 2 as 'core must not depend on cat-harness-tools': it now reads 'core must not depend on the MCP server'. Measured basis: 88 references from core into cat-harness code. Under D1 those would have formed a core<->tools cycle. Concretely: cat-harness-tools/cat-harness-tools.json drops needs: folio-assistant-core.


## Owner ruling 2026-10-01 late (~17:30) — S5 1a, trap 1

Source: owner, session_01ToWZR4RgTRCWeSsgxsSQfT.

- **Trap 1:** `inProcess("src/tools/...")` paths resolve against the IMPLEMENTING instance (`cat-harness-tools`), found through `needs`. **No `cat-harness-tools` paths are written into cat-harness.**
- **Still open (not ruled):** how a sidecar's `source_file` is resolved; whether sci-bound files ride to tools in 1a.

_2026-10-01T19:46:46Z_ — Claimed by claude/70lx-b0 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## 2026-10-04 — quiet claim taken; owner ruling; prep PR (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi)

**Claim taken** under `bean-coordination` §"A quiet claim": the holder `claude/70lx-b0` is merged into `main`, no open PR names `70lx`, and the bean was last touched 2026-10-01T19:46Z. Work continues on `claude/70lx-prep`.

**Owner ruling, 2026-10-04** (chosen from options in this session): core's document adapter (`folio-assistant-core/adapters/document/index.ts`) **stays in folio-assistant-core** and imports the registration API from `cat-harness-tools`. That settles the C1-vs-w2gr-Q1 question the scoping left open.

**Prep (no file moves), measured on `main` @ 0b7b9e4:**
- **Trap 1 — the server's loader did not resolve through `needs`.** `check-tools` already used `resolveImplementingPath`, but `registerDeclaredToolGroups` did a plain `join(root, module)`, so every `src/tools/*` Tool node would have gone `absent` the moment its module moved. Fixed: own copy first, then the one implementer; two implementers is `failed` naming both. Tested on a scratch checkout, and the two decisive tests fail against the old loader.
- **`no-content-adapter.ts` joins the move set** rather than needing a type split: its only importers are `src/index.ts` and `src/tool-groups.test.ts`, both moving, and it is the only staying-side importer of `src/types.ts`.

**For B1 (the move):** `server.ts` passes `PLATFORM_ROOT` (its own instance) as the tool groups' root. After the move that must be the **declaring** root, `cat-harness` (where `tools/` lives), not `cat-harness-tools` — routes keep `PLATFORM_ROOT`, since they move with the server. `capture-mcp-tools.ts`'s `TOOL_MODULES` moves with the server and stays relative to it. Baseline to compare against: `bun run cat split:baseline:check` (pyds, #2101).

## Completed on landed evidence
Landed on main in PR #2146 (Separation stage 1a: stage cat-harness-tools/ as a sibling instance and move unambiguous code).

## Reopened 2026-10-09 — "completed on landed evidence" was premature

The closure above was recorded when PR #2146 landed, with none of the
Done-when falsifiers ticked. Measured on `litlfred/cat-harness` main @
`712332dc` (2026-10-09), the move list has not happened in the separated
repository:

- `scripts/`, `src/`, `content/pipeline/` (156 `.ts`), `test/` (outside
  results/attestations/health), `templates/`, `deploy/`, `types/`, `ui/`,
  `viewer/` are all still in `cat-harness` — **1,233 code files** on this
  bean's own move list. `cat-harness-tools` holds only `adapters/mcp-server`
  and the server `src/` from w2gr 3a/3b.
- The cost of leaving it: `content/pipeline` and the rest of the harness code
  import each other (174 harness files → pipeline, 224 pipeline imports →
  harness), so no part of it can move to `cat-harness-tools` alone. Moved
  WHOLE, as this bean specifies, the cycle disappears: only **10 import
  edges** would remain from staying files into moving code (5 in `schemas/`
  tests and `schemas/test-run.ts`, 2 in `openapi/scripts/`, 3 in
  `test/health/`).
- Downstream naming the moving paths: `cat-harness-tools` 47 files,
  `folio-assistant-core` 44, `who-iris` 1, `bootstrap-tools` 1.

Owner, 2026-10-09: "split pipeline properly first" — i.e. this bean's D1 move
is the route, not a pipeline-only carve-out. Measurement scripts:
session scratchpad `pl/graph.ts`, `pl/residual.ts`.

## 2026-10-09 late — the code moved (litlfred/cat-harness-tools#22, litlfred/cat-harness#79, both merged)

Session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG. 1,488 files left cat-harness on `main` b798a12d, which landed in tools 09f713ff and harness 1571e4a4. `schemas/block-qa-schema/` and `skills/framework/types.ts` STAYED: the first is a schema package the registry names, and eight skill definitions import the second. `schemas/input-trace.ts` and `schemas/qa-record-shapes.ts` are new in the harness, so that its references resolve inside it.

Falsifier 2, measured per test (JUnit) in a 4-instance checkout against `main`: 588 failures after the move and 589 before, with 4 new ones.
- `harness-state` ×2: the health report is stamped with the old checker hash. It needs `bun run cat health` in a full checkout with remotes.
- `layout-norms` "at least one pair": cat-harness's three nestings are gone, so the guard needs a fixture rather than the corpus.
- `graph-index`: `beforeAll` takes about 25 s and also times out on `main`.

Still open:
- Falsifiers 1 and 3: generator `--check` byte-identity and `mcp:capture` were not run.
- Repoint downstream: folio-assistant-core's references and who-iris's pin.
- `cat` runner in the separated repos (`j3ls`).


## 2026-10-10 — downstream repointed, who-iris pinned past the move

Owner, 2026-10-10: "go" (move the pins); "merge when green and ready".
- **Core.** folio-assistant-core #18 changed 194 imports and 16 other references from `../cat-harness/` to `../cat-harness-tools/`. Core's 656 tests show no new failures against the pre-move layout. #19 fixed the `input-trace` import: that file moved to `cat-harness/schemas/`, not to the tools layer.
- **Tools fixes found by building who-iris.** cat-harness-tools #23: four modules still rooted the harness at their own directory, `gen-navbar-include` among them, which crashed the site build. #24: `ui/` and `viewer/` are undeclared again; they are the server's pages, and as declared they collided at `/code/cat-harness-tools/`. #25: no kind-route redirect is written to a viewer the site does not carry.
- **who-iris #25.** Pins: cat-harness 9ca7c32, cat-harness-tools 6313049, core 17bbe5f, with consent recorded. It also restores the `HARNESS_IS_MOUNTED` skip that the declared-visualisers refactor had dropped, and writes the catalogue page into who-iris's own site with its relative links re-based. Verified: mount 0, the five gates 0, 97 tests, publish steps 3–6 all 0, and 0 unresolved links over 1,646 files. The publish Routine now names `cat-harness-tools/scripts/…`.
- **bootstrap-tools.** No reference to the moved code.

Still open:
- The two `harness-state` tests need `bun run cat health` in a full checkout with remotes.
- layout-norms "at least one pair" fails only in a checkout too small to hold a nesting, like the existing `>5 instances` guard.
- Falsifiers 1 and 3 have not been run.
- gh-pages has not been republished at the new pins; it still serves the 2026-10-09 build.

## 2026-10-10 — falsifiers 1 and 3 measured; health report regenerated

**Falsifier 1.** All 106 `:check` checkoutScripts were run from the aggregate root at the commits just before the move (harness b798a12d, tools ea0b91a) and just after it (harness 1571e4a, tools 09f713f).
- 105 exit identically.
- `translate-kg-viewer:check` went 0 → 1. Its string table was read through a path *constant* under the harness, which the move's literal pass could not see.
- A sweep for that shape found three silent ones: `q-usage-audit`, `translation-block-qa` and `check-library-qa` each hashed a missing file, which reads as "unknown".
- All four are fixed in cat-harness-tools #28; `translate-kg-viewer:check` exits 0 again.
- `navbar:include:check`'s ENOENT was already fixed in #23.

**Falsifier 3.** `capture-mcp-tools --json` gives an identical before/after: 21 tools, the same input shapes and modules. The server starts over stdio from `cat-harness-tools/src/index.ts`, and `tools/list` returns the same 46 tools with identical input schemas before and after.

**Health.** cat-harness-tools #26 makes the probes read the harness's own checkout (`checkoutRootFor`): standalone, `dirname` held no repository. cat-harness #83 regenerated the report from a worktree with its state branches mounted: subject `litlfred/cat-harness`, all seven checks evaluated, and both harness-state hash tests pass.

**Remaining Done-when.** `bun run cat gates --all` has not been run as a whole; its parts were measured above.


## 2026-10-10 — why `gates --all` cannot be run as written

`bun run cat gates --all` reads its gate list from the monorepo's `.github/workflows/code-quality-gates.yml`. The separated repositories have no such aggregate workflow, so it exits 2 before running anything. That is not a gate failing. The last Done-when box cannot be checked in the form it is written; what it was meant to cover was measured part by part:
- all 106 `:check` scripts, before and after the move (falsifier 1);
- `check:import-direction --all` (falsifier 4);
- who-iris's five gates and 97 tests at the repinned closure (who-iris #27).

Closing the box needs one of two things: a gate list the gates runner reads from the declarations rather than from a workflow file, or an owner ruling that the per-part measurement stands in for it.

## 2026-10-16 — investigated, stays in progress (Owner ruling 2026-10-16, item 4)

The copies disagreed (folio-assistant store: completed 2026-10-07 "on landed evidence"; cat-harness store: reopened 2026-10-09). Reconciled to **in-progress** in both. What is unresolved, precisely:
- **Falsifier 2** (`bun test` pass count equal to the stage-0 baseline) is unticked: the 2026-10-09 measurement found 4 new failures; the two `harness-state` ones were fixed by cat-harness#83, and `layout-norms` "at least one pair" and `graph-index` were explained but not shown pre-existing on the base SHA.
- **`bun run cat gates --all`** is unticked. On cat-harness-tools main `scripts/gates.ts` still derives its gate list from `.github/workflows/code-quality-gates.yml` (`scripts/lib/gates-workflow.ts`). No owner ruling accepting the part-by-part measurement in its place was found in any bean store, in the PRs or in the commits of cat-harness, cat-harness-tools or folio-assistant main. Closing needs that ruling, or a `gates --all` run (for example from the folio-assistant index checkout, which carries the workflow) with each failure shown pre-existing.
Its blocks on other beans stay until then. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.
