---
# folio-assistant-p4vj
title: 'FEATURE-DEV: context before the question — every handover of a decision'
status: completed
type: task
priority: normal
created_at: 2026-09-18T16:37:55Z
updated_at: 2026-09-18T16:38:55Z
---

Feature-development skills told an agent to ask before implementing, but nothing said what an askable question looks like. Result: a question that is correct and unanswerable — jargon undefined, options unstated, no recommendation, context living in a GitHub issue the reader must open.

Measured failure, 2026-09-18: a turn ended with "next x4mt — ... I'd want your call on prefix-at-rest vs prefix-at-install". Both option names were coined by that agent inside issue #247, so answering meant opening and reading it; neither option carried its cost. The author types with difficulty. The question cost minutes and should have cost one keystroke.

Rule added: context -> options -> recommendation -> question, with one checkable test — can the reader answer WITHOUT opening anything. Binds every handover surface, not just an explicit question tool: the end-of-turn next line, a bean's Done when, a PR body, an issue comment.

Note AGENTS.md already asserted this frame existed ("the same discipline as the AskUserQuestion frame") when it did not. That gap is what this fills.
