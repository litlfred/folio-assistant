---
# folio-assistant-k2fp
title: 'GETTING STARTED: interaction modality + accessibility preferences'
status: completed
type: task
priority: normal
created_at: 2026-09-18T14:49:11Z
updated_at: 2026-09-18T14:49:11Z
---

## What

Detect the right communication modality for a new user and respect it:
audio, ordinary chat, **structured Q&A for limited hand function**, large-font /
low-vision. Preferences are durable (a committed file agents read at session
start), surfaced in the published site behind a settings control, and drive
whether the agent asks open questions or presents selectable options.

Records that **@litlfred has very limited hand functionality due to disability**
— so every question put to that user is selectable rather than free-text.

## Done when

`skills/folio-core/interaction-modality.md` exists, a preferences file is read
by the session-start surface, the docs site carries a settings control, and
WCAG-grounded guidance is written down rather than improvised.

Issue: https://github.com/litlfred/folio-assistant/issues/232
