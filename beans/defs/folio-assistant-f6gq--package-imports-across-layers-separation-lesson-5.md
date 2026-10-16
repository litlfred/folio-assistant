---
# folio-assistant-f6gq
title: 'PACKAGE IMPORTS ACROSS LAYERS: replace ../ climbs between repositories with package imports, bottom-up (separation lesson 5)'
status: todo
type: epic
priority: normal
created_at: 2026-10-09T15:29:13Z
updated_at: 2026-10-16T10:45:00Z
parent: folio-assistant-vuip
---

Owner, 2026-10-09: "go with option 1 and option 2 now" — option 1 (who-iris resolves core through its in-checkout mount, who-iris PR 18) now, option 2 (package imports) as the target, built bottom-up.

Why: kg-separation lesson 5 says every cross-repository import MUST be a package import, never a `../` climb; nothing tracked it. Measured 2026-10-09, imports that climb into another repository: bootstrap-tools 0; cat-harness 42 (36 files, 40 into bootstrap-tools); folio-assistant-core 228 (75 files); cat-harness-tools ~740 (286 files); who-iris 6 (platform.ts only). The release workflows (`bun pm pack` + npm publish) would today publish packages whose own `../../` imports cannot resolve.

The platform has three definitions of a standalone checkout in force — aggregate monorepo, sibling clones (seed-ready / check:standalone), remote mounts inside the checkout (index.config / mount:remote) — and package imports are the one shape that works in all three. The ruling settling which layout is canonical is still the owner's.

## Done when
- [ ] every child below is completed or scrapped with reasons
- [ ] a check fails a new cross-repository `../` import in any layer (ratchet: may only fall)

## 2026-10-12 — the layout question put to the owner (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG, task 7)
The open ruling this bean records is now a proposal, NOT decided: cat-harness `docs/proposals/checkout-layout-2026-10-12.md` (cat-harness#182, merged). It frames three layouts as four options:
1. remote mounts inside the checkout everywhere, with this bean's package imports (recommended);
2. sibling clones;
3. the aggregate index;
4. keep all three, gated.

It asks the owner for rulings L1–L3. Measured for it:
- The graph-typology registry gave one declaration two answers in two layouts. Fixed in #182 as kg-separation lesson 19.
- 31 cat-harness-tools scripts compute a root as `import.meta.dir/../..`.
- cat-harness-tools' own CI runs only inside the folio-assistant index.
- cat-harness-tools as a lone checkout still carries 90 wiring references into `folio-assistant/`, measured by `separation:cutover:check` (cat-harness-tools#170).

Status unchanged: todo, waiting on the ruling.

_2026-10-16T10:45:00Z_ — Parented to `vuip` (GOAL 1) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).
