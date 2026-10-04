---
# folio-assistant-70lx
title: 'Separation stage 1a: stage cat-harness-tools/ as a sibling instance and git mv the unambiguous code'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-04T15:59:51Z
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
- [ ] falsifier 1: every generator's `--check` output byte-identical to the stage-0 baseline except generated-by path strings (diff shows only those)
- [ ] falsifier 2: `bun test` pass count equal to the stage-0 baseline
- [ ] falsifier 3: `mcp:capture` tool list identical; the server starts over stdio from `cat-harness-tools/src/index.ts`
- [ ] falsifier 4: `check:import-direction --all` green, and the planted `cat-harness → cat-harness-tools` import red
- [ ] `bun run gates --all` green, or each failure shown pre-existing on the base SHA


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

**For B1 (the move):** `server.ts` passes `PLATFORM_ROOT` (its own instance) as the tool groups' root. After the move that must be the **declaring** root, `cat-harness` (where `tools/` lives), not `cat-harness-tools` — routes keep `PLATFORM_ROOT`, since they move with the server. `capture-mcp-tools.ts`'s `TOOL_MODULES` moves with the server and stays relative to it. Baseline to compare against: `bun run split:baseline:check` (pyds, #2101).
