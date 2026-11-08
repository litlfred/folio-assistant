---
# folio-assistant-mbd8
$schema: bean/1.0.0
title: Cut node-kind-index.ts → src/auth/gateway.ts static import (move what it needs into schemas/)
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:36:36Z
updated_at: 2026-11-08T07:20:00Z
parent: folio-assistant-x35i
---

`node-kind-index.ts` statically imports `src/auth/gateway.ts`. That one edge keeps the 142 shared-closure gates from using the input-hash cone after the harness-config `traced` change (cat-harness-tools#1499, "CI speed 8"). Move what node-kind-index needs into `schemas/` and drop the import.

## Done when
- [x] node-kind-index.ts no longer imports src/auth/gateway.ts
- [x] the 142 gates are shown to use the input-hash cone (run cited)

_2026-11-05T12:35:29Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

*2026-11-05* — PR https://github.com/litlfred/cat-harness-tools/pull/1502 (stacked on #1499). The edge was not a static import: `node-kind-index.ts`'s validator `imports` input-site still claimed `src/**`/`*/src/**`. It now carries #1499's exact glob, and the input-sites test holds both annotations. Measured with a static closure walk over 209 `task-io.ts` tasks: 142 reach node-kind-index; those reaching `src/auth/gateway.ts` went from 142 to 0. Their shared core (node-kind-index's closure) went from 600 to 494 files, and `src/` files in their union from 96 to 23. They still share that core through the harness-config plugin tables (bean vgfp). The CI-run criterion is still open.

_2026-11-05T13:26:35Z_ — litlfred/cat-harness-tools#1502 merged (f97b2ab) into #1499's branch, `claude/kind-validator-imports-exact`, not into main. The change reaches cat-harness-tools main when #1499 merges (the merge steward has it, in chain order after #1495, #1497 and #1498). Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.

_2026-11-08T07:20:00Z_ — Verified and closed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3):
- `litlfred/cat-harness-tools#1502` (`f97b2ab20493`) landed on `cat-harness-tools` `main` via `#1499` (`e73570592e18`), followed by `#1525` (`fa13d2c`, `RECIPE_VERSION = 6`, bean `vgfp`), and re-pinned into `litlfred/folio-assistant` `main` via `#3012` (`2808845b5236`), `#3029` (`46a8ffbce4b9`), and `#2985` (`da3ca528562a`).
- Post-merge CI runs proving the `node-kind-index.ts` gates record and skip via the input-hash cone under `RECIPE_VERSION = 6`:
  - **`litlfred/folio-assistant` `Code-quality gates` (`code-quality-gates.yml`)**: `main` push run `42412126727` (`46a8ffbce4b9`, `#3029`, 2026-11-07T20:39:49Z; and `42406566912` at `2808845b5236`) recorded **36 `{tracked}` CQG gates** across the 3 cone-enabled repository-gates jobs (`128526554515`: 15, `128526554628`: 20, `128526554570`: 1), including **22 of the `node-kind-index.ts` gates** (with independent traced path counts from 346 to 17,423 paths); PR run `42413770441` (PR `#3031` @ `131a43067c86`, 2026-11-07T21:00:42Z, restoring against `46a8ffbce4b9`) skipped **23 CQG gates** via `SKIPPED — inputs unchanged since 46a8ffbce4b9c3782c2449fe9609811ac1a13afe`, including **14 of the `node-kind-index.ts` gates** (`kg:detangle:direction`, `upload-step:docs:check`, `skill:commands:check`, `library:readmes:check`, `agent-memory:check`, `translation:index:check`, `check:workflow-policy`, `check:declared-dirs`, `check:workflow-refs`, `check:tools`, `check:voice-skills`, `check:skills`, `lsi:viz:check`, `check:soft-hyphens`).
  - **`layer-pr-checks.yml` (`PR checks` across the full ~296-gate derived set, including the 142 `node-kind-index.ts` gates)**: `litlfred/smart-base` `main` push runs `42415774450` (`907c4cbe96`) and `42416920286` (`2944eebf7d`) recorded/carried **105 gates** in `cone/records.json` under recipe 6 and skipped **79 of 296 gates** (`18/73` + `22/75` + `14/74` + `25/74`); `litlfred/smart-base` PR run `42417250994` (`9c5402cc1d`) skipped **60 of 296 gates** on base and **54 of 296 gates** on head across all 4 shards (`check:avatar-coverage:check`, `check:bean-parents`, `check:bean-restates-skill`, `check:navbar-consistency:check`, `check:ready-to-close`, `check:requirements`, `check:schema-nodes`, `check:skills`, `themes:css:check`, `upload-step:docs:check`, `agent-memory:check`, `check:bean-archive`, `check:bean-blocks`, `check:declared-dirs`, `check:partition`, `check:tabular-stubs`, `check:voice-skills`, `check:wireframes:check`, `translate-bpmn:bootstrap:check`, `translation:obsolete:check`, `vocab-mappings:check`, `check:avatar-instances`, `check:bean-bodies`, `check:bean-parent-prose:check`, `check:folio-mount`, `check:harness-dirs`, `check:instance-themes:check`, `check:layout-norms:check`, `check:soft-hyphens`, `check:stale-paths`, `check:uploads-retired`, `harness:dirs:check`, `check:artefact-verification`, `check:bean-front-matter`, `check:concern-groups`, `library:readmes:check`, `translation:pot:check`, etc.); `litlfred/folio-assistant-core` PR runs `42389441966` (`4621582fef`) and `42389452657` (`f2913941cd`) skipped **71 of 278 gates** across shards 1–5 (`0/1` + `24/101` + `17/53` + `10/57` + `20/66`).
