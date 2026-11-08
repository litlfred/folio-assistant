---
# folio-assistant-mbd8
$schema: bean/1.0.0
title: Cut node-kind-index.ts → src/auth/gateway.ts static import (move what it needs into schemas/)
status: in-progress
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:36:36Z
updated_at: 2026-11-08T07:03:00Z
parent: folio-assistant-x35i
---

`node-kind-index.ts` statically imports `src/auth/gateway.ts`. That one edge keeps the 142 shared-closure gates from using the input-hash cone after the harness-config `traced` change (cat-harness-tools#1499, "CI speed 8"). Move what node-kind-index needs into `schemas/` and drop the import.

## Done when
- [ ] node-kind-index.ts no longer imports src/auth/gateway.ts
- [ ] the 142 gates are shown to use the input-hash cone (run cited)

_2026-11-05T12:35:29Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

*2026-11-05* — PR https://github.com/litlfred/cat-harness-tools/pull/1502 (stacked on #1499). The edge was not a static import: `node-kind-index.ts`'s validator `imports` input-site still claimed `src/**`/`*/src/**`. It now carries #1499's exact glob, and the input-sites test holds both annotations. Measured with a static closure walk over 209 `task-io.ts` tasks: 142 reach node-kind-index; those reaching `src/auth/gateway.ts` went from 142 to 0. Their shared core (node-kind-index's closure) went from 600 to 494 files, and `src/` files in their union from 96 to 23. They still share that core through the harness-config plugin tables (bean vgfp). The CI-run criterion is still open.

_2026-11-05T13:26:35Z_ — litlfred/cat-harness-tools#1502 merged (f97b2ab) into #1499's branch, `claude/kind-validator-imports-exact`, not into main. The change reaches cat-harness-tools main when #1499 merges (the merge steward has it, in chain order after #1495, #1497 and #1498). Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.
