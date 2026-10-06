---
# folio-assistant-7zz1
title: 'STANDALONE: whole-checkout tests move to a declared test home in the top-level folio-assistant instance'
status: todo
type: task
priority: normal
created_at: 2026-10-06T09:15:40Z
updated_at: 2026-10-06T09:15:52Z
parent: folio-assistant-iirv
---

Owner ruling 2026-10-06 ~08:50Z, relayed by the coordinating session (session_012qoycyCSGidZqW245vXhze) and recorded on 0r7u: "Top-level instance". The parent folio-assistant checkout, which holds every layer, gets a DECLARED test home: a directory in the top-level instance's declaration, never a literal path in a runner. Basis: whatever names every layer belongs at the top, so each layer stays standalone-green.

Measured on main b000302 after #2268 (ho66): cat-harness standalone = 194 failing. Groups that move here: Z (every-instance sweeps, ~50), C (sibling content data, ~40), V (voices, ~19); plus the B+E aggregate-root tests #2268 placed in cat-harness-tools/scripts/tests (gnnj precedent), which move again.

## Done when
- [ ] the top-level instance declares a test directory (folio-assistant.json), and bun test discovers it in the monorepo
- [ ] Z, C, V and the B+E tests live there; no test loosened, skipped or deleted; monorepo test names compared before and after
- [ ] standalone:baseline lowered for cat-harness; cat-harness-tools' own standalone count not raised
- [ ] gates green
