---
# folio-assistant-9791
title: 'QA SUMMARY: ''passing'' counts only script-checkable criteria — agent-judged criteria never run are not said (heat map reads it as QA passed)'
status: todo
type: bug
priority: normal
created_at: 2026-09-23T18:10:15Z
updated_at: 2026-09-29T18:14:48Z
parent: folio-assistant-q4jm
---

Found while doing tw61, 2026-09-23. On a freshly scaffolded document folio, a sweep records 46 criteria per block, and every recorded one passes or is n/a. `publish-block-qa` then says **"passing"**. But about 15 criteria that need an agent's judgement were never run: voice traps, exposition clarity, adversarial review. They appear in the sweep output as `[needs-agent]` and nowhere in the verdict file. So "passing" means "every script-checkable criterion passes". The heat map does not say so, and a reviewer reads it as "QA passed".

It is the same rule as stale-versus-passing, one level up: a verdict that was never given is not a pass.

## Done when
- [ ] the summary distinguishes "passing, scripts only (N criteria need an agent)" from "passing, every applicable criterion judged". The heat map says it in words, per section
- [ ] the criteria counted as "need an agent" come from the criteria's own declarations, never from a list written here



## Progress (2026-09-24)
- `publish-block-qa` now gives each block `needsAgent`: its applicable criteria declared `automated: false` (gated by `applies_to` and the active voices, as the sweep gates them) that have no fresh verdict. It also adds `passingScriptsOnly` to the file.
- The heat map reads "N passing on scripts only (M criteria need an agent)" or "passing, every applicable criterion judged" per section. A pre-9791 file reads "does not say", never "all judged".



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, and no holder recorded; the sessions that held theme C (rendered site) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.
