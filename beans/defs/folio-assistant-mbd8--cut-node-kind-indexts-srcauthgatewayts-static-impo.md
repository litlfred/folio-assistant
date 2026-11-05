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
updated_at: 2026-11-05T12:45:16Z
parent: folio-assistant-x35i
---

`node-kind-index.ts` statically imports `src/auth/gateway.ts`. That one edge keeps the 142 shared-closure gates from using the input-hash cone after the harness-config `traced` change (cat-harness-tools#1499, "CI speed 8"). Move what node-kind-index needs into `schemas/` and drop the import.

## Done when
- [ ] node-kind-index.ts no longer imports src/auth/gateway.ts
- [ ] the 142 gates are shown to use the input-hash cone (run cited)

_2026-11-05T12:35:29Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.
