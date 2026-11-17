---
doc_id: hmans-2026-beans-readme
doc_title: "beans"
section_id: s008-claude-code
section_title: "Claude Code"
file: "README.md"
lines: 87-103
source_sha256: 85b9eb0aaedd41bb
granularity: heading
---
### Claude Code

An official Beans plugin for Claude is in the works, but for the time being, please manually add the following hooks to your project's `.claude/settings.json` file:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "beans prime" }] }
    ],
    "PreCompact": [
      { "hooks": [{ "type": "command", "command": "beans prime" }] }
    ]
  }
}
```
