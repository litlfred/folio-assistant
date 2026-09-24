---
# folio-assistant-9791
title: 'QA SUMMARY: ''passing'' counts only script-checkable criteria — agent-judged criteria never run are not said (heat map reads it as QA passed)'
status: todo
type: bug
created_at: 2026-09-23T18:10:15Z
updated_at: 2026-09-23T18:10:15Z
parent: folio-assistant-q4jm
---

Found while doing tw61, 2026-09-23. On a freshly scaffolded document folio, a sweep records 46 criteria per block, and every recorded one passes or is n/a. `publish-block-qa` then says **"passing"**. But about 15 criteria that need an agent's judgement were never run: voice traps, exposition clarity, adversarial review. They appear in the sweep output as `[needs-agent]` and nowhere in the verdict file. So "passing" means "every script-checkable criterion passes". The heat map does not say so, and a reviewer reads it as "QA passed".

It is the same rule as stale-versus-passing, one level up: a verdict that was never given is not a pass.

## Done when
- [ ] the summary distinguishes "passing, scripts only (N criteria need an agent)" from "passing, every applicable criterion judged". The heat map says it in words, per section
- [ ] the criteria counted as "need an agent" come from the criteria's own declarations, never from a list written here
