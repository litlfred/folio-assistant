---
# folio-assistant-r6ly
title: 'GETTING STARTED: rewrite docs/getting-started.md + answer the two research questions'
status: completed
type: task
priority: normal
created_at: 2026-09-18T14:49:11Z
updated_at: 2026-09-18T15:27:12Z
---

## What

`docs/getting-started.md` currently starts at "install and verify" and assumes
the reader already knows they want a folio. Rewrite it around the first
conversation, with the list of top-level content types the agent offers.

Plus `docs/accessibility.md`, answering the two questions asked on the issue:
options and best practice for disability support, and options for forcing
agentic Q&A into guided questions under DMN logic. Both answers are posted to
the issue, not only to the PR.

## Done when

Both pages build, links resolve (`bun run readme:audit` where applicable), and
the summary comment is on issue #232.

Issue: https://github.com/litlfred/folio-assistant/issues/232
