---
# folio-assistant-2lfx
$schema: bean/1.0.0
title: Provenance footer and audit-coverage page on every document page
status: in-progress
type: task
created_at: 2026-11-05T12:59:26Z
updated_at: 2026-11-05T12:59:26Z
parent: folio-assistant-4j43
---

Owner answered 1A, 2B, 3A on the oz5w test / footers / audit-coverage questions (2026-11-05). Finish the shared provenance-footer module (both page types routed through site data so the footer can show their provenance), the audit-coverage page, Chromium checks, screenshots to owner. Picked up from stalled sessions (drnh).

_2026-11-05T13:30:00Z_ — Picked up (session_01VQDpPfwYbADcuuX2ZBXvqn). The stalled `provenance-footer.ts` was never pushed (only in the dead container); rebuilt from the design recovered from the owner's gist: collapsed "Provenance" in the shared footer, entries grouped by section, a publish-time gitignored index keyed like the todo index. Built as site-data slices `_data/provenance/<producer>.json` (docs-pages: 88 pages / 438 entries; skill-instructions: 214 pages / 1954 entries). Branch `claude/provenance-footer` in cat-harness-tools (module, both generators, 6 unit tests pass) and cat-harness (footer include, CSS, gitignore). cat-harness#1037 found already merged 11:59Z; tools#1486 branch updated with main to re-run CI. Not covered yet: process (`.bpmn`) and tool pages have logs but are not mapped to pages.

_2026-11-05T13:30:00Z_ — Pickup C: #1037 was already merged; tools#1486 re-running on current main; footer rebuilt under new bean folio-assistant-2lfx (session_01VQDpPfwYbADcuuX2ZBXvqn).

_2026-11-05T13:40:00Z_ — PRs open: litlfred/cat-harness-tools#1510 (generator) and litlfred/cat-harness#1051 (footer include + CSS). Local Jekyll build + Chromium: 282 page files carry the footer, collapsed by default, no horizontal scroll at 390px; screenshots sent to owner. Fixed after first look: theme's !important h3 size, backticks in refs, **bold**/*italic* shown raw. Open: audit-coverage regeneration (3A) — the 're-pin session' it was handed to is not identifiable; asked owner. Follow-up: .bpmn and tool pages' logs not mapped.
