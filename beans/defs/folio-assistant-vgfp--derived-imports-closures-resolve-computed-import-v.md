---
# folio-assistant-vgfp
$schema: bean/1.0.0
title: 'Derived imports closures: resolve computed-import verdicts (kind-validator, harness-config tables) from the declarations at fingerprint time, instead of static globs'
status: todo
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:36:36Z
updated_at: 2026-11-05T12:36:36Z
parent: folio-assistant-x35i
---

From "CI speed 8" (litlfred/cat-harness-tools#1499): narrowing showed that the 142 gates sharing one closure are held there by real imports. Computed imports (the kind-validator and harness-config tables) are matched today by static globs, which pull in far more than they read.

Fix: work out the verdicts of those computed imports from the declarations at fingerprint time, so each gate's closure is exactly what it imports.

## Done when
- [ ] the computed-import verdicts are resolved from the declarations at fingerprint time
- [ ] the share of the 142 gates that fall out of the shared closure is measured (run IDs cited)

_2026-11-05T12:35:29Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.
