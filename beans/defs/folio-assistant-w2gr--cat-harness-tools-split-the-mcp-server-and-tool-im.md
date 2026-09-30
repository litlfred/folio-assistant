---
# folio-assistant-w2gr
title: 'cat-harness-tools: split the MCP server and tool implementations into their own instance, depending on cat-harness'
status: todo
type: task
created_at: 2026-09-30T08:12:08Z
updated_at: 2026-09-30T08:12:08Z
parent: folio-assistant-vuip
---

Owner 2026-09-29/30: 'i want to split out cat-harness-tools too https://github.com/litlfred/cat-harness-tools' — 'see sibling work' (#1514, bootstrap-tools, bean 81tw). Direction ruled 2026-09-30: **tools depend on the harness** — cat-harness never imports the new instance.

Measured 2026-09-30: litlfred/cat-harness-tools is EMPTY (no commits). In scope: cat-harness/tools/ (8 files: discover, index, mcp, sessions, viewers, templates) and cat-harness/src/tools/ (17 MCP tool implementations). 40 files elsewhere in cat-harness import src/tools, because the MCP server registers the tools directly — so the server moves WITH the tools, and those 40 import sites are the work.

Recipe (from #1514): stage `cat-harness-tools/` as an instance in this repo first, own namespace, nothing in cat-harness names it; a published contract that stays byte-identical; move to the repo last.

## Done when
- [ ] The 40 import sites are listed and each classified (moves with tools / reads a harness schema / must invert)
- [ ] cat-harness-tools/ staged with its own declaration and namespace; cat-harness imports nothing from it
- [ ] gates green; the MCP server still starts and lists the same tools
- [ ] pushed to litlfred/cat-harness-tools
