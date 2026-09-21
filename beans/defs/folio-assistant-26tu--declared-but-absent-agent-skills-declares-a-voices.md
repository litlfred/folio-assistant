---
# folio-assistant-26tu
title: 'DECLARED-BUT-ABSENT: agent-skills declares a voices graph at voices/ and ships none, now also on the old path'
status: todo
type: task
priority: normal
created_at: 2026-09-21T16:55:33Z
updated_at: 2026-09-21T16:55:33Z
parent: folio-assistant-vuip
---

Pre-existing, surfaced while migrating voices to <stub>/skills/voices (bean btuv).

agent-skills/agent-skills.config.json declares id=voices path=voices/ and agent-skills/voices/ does not exist. That is the dh4f defect: a consumer scans nothing and reports a clean run over it.

Left ALONE deliberately rather than removed. The entry's description states real intent — 'a shared base plus one override per vendor, on the owner's ruling of 2026-09-20' — so it is a declaration ahead of content, not an accident, and deleting another instance's roadmap is not a migration decision.

Two things are now true of it at once: the directory is absent, and the path names the PRE-migration layout while who-style-guide and folio-assistant-sci have moved to skills/voices/.

## Done when

- agent-skills either ships its voices at skills/voices/ or drops the declaration until it does;
- whichever way, the path matches the convention the other instances now use.
