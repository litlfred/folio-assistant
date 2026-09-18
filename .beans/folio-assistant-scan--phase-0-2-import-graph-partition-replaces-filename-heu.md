---
# folio-assistant-scan
title: 'Phase 0.2 — import-graph partition replaces the filename heuristic (#223)'
status: completed
type: task
priority: high
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
---

The 101 sci / 94 WHO file counts in
[current state](../docs/architecture/current-state.md) come from matching
filenames. That is a **lower bound**: it finds `lean-build-bg.sh` and misses a
Lean special case inside a generic validator.

Build the real import/call graph and partition it against the five proposed
repos. Output: per-repo module lists, plus the list of edges crossing a proposed
boundary **in the wrong direction** (a would-be `folio-assist-core` module
importing a Lean module). That cross-edge list is Phase I's actual worklist.

Independent of 0.1 — can run in parallel.

---

## Outcome

`scripts/repo-partition.ts` + `bun run check:partition` (`--edges`, `--markdown`,
`--repo <id>`, `--strict`). 7 tests in `scripts/tests/repo-partition.test.ts`.

**331 modules, 655 internal import edges, 41 wrong-direction edges.**

| proposed repo | modules | rule | keyword | fell through |
|---|---:|---:|---:|---:|
| agentic-harness | 43 | 43 | 0 | 0 |
| folio-assist-core | 119 | 119 | 0 | 0 |
| folio-asst-sci | 28 | 8 | 20 | 0 |
| smart-kg | **0** | 0 | 0 | 0 |
| smart-base | 4 | 1 | 3 | 0 |
| (test material) | 110 | 107 | 3 | 0 |
| unassigned | 27 | — | — | 27 |

| importer | imports from | edges |
|---|---|---:|
| folio-assist-core | folio-asst-sci | 19 |
| agentic-harness | folio-assist-core | 17 |
| agentic-harness | folio-asst-sci | 3 |
| folio-assist-core | smart-base | 2 |

**Two results that changed the plan rather than confirming it:**

1. `smart-kg` partitions to **zero** modules — it is new construction, not an
   extraction, like the Test repos.
2. **17 of 41 edges are harness → core** — the harness importing the
   content-object model, i.e. its defining constraint ("does not *do*
   anything") failing in practice. Extracting the harness is therefore harder
   than extracting sci, which re-orders Phase II.

**41 is a floor, not a burn-down number.** The first run reported 33 with 135
modules unassigned; classifying the test material and the standalone MCP server
raised it to 41. Classifying more modules finds more violations. 27 platform
meta-scripts remain deliberately unassigned — a guessed assignment would be
indistinguishable in the report from a derived one.

Gate at close: `tsc` 0 errors, `eslint` clean, `bun test` 1465 pass / 0 fail.
