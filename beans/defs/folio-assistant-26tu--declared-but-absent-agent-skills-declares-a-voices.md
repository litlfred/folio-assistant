---
# folio-assistant-26tu
title: 'DECLARED-BUT-ABSENT: agent-skills declares a voices graph at voices/ and ships none, now also on the old path'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T16:55:33Z
updated_at: 2026-09-22T06:13:55Z
parent: folio-assistant-vuip
---

Pre-existing, surfaced while migrating voices to <stub>/skills/voices (bean btuv).

agent-skills/agent-skills.config.json declares id=voices path=voices/ and agent-skills/voices/ does not exist. That is the dh4f defect: a consumer scans nothing and reports a clean run over it.

Left ALONE deliberately rather than removed. The entry's description states real intent — 'a shared base plus one override per vendor, on the owner's ruling of 2026-09-20' — so it is a declaration ahead of content, not an accident, and deleting another instance's roadmap is not a migration decision.

Two things are now true of it at once: the directory is absent, and the path names the PRE-migration layout while who-style-guide and folio-assistant-sci have moved to skills/voices/.

## Done when

- agent-skills either ships its voices at skills/voices/ or drops the declaration until it does;
- whichever way, the path matches the convention the other instances now use.


## 2026-09-21 — the PATH is realigned; ship-or-drop is still open

`agent-skills.json` declared `path: "voices/"`, the pre-migration layout,
while `who-style-guide` and `folio-assistant-sci` moved to `skills/voices/`
because a voice IS a skill (bean `btuv`). Now `skills/voices/`.

**This closes the second `Done when`, not the first.** The directory is still
absent either way — realigning it only means that when the voices arrive they
land where every consumer already looks, instead of at a path the convention
has left behind. The declaration's own description says the entry is
deliberate, roadmap ahead of content, so dropping it is this instance's call
and not a migration decision (`deletion-requires-confirmation`).

Visible in the voices viewer as `agent-skills  agent-skills/skills/voices
DECLARED BUT ABSENT` — the `dh4f` state reported rather than smoothed over.

- [ ] agent-skills either ships its voices at `skills/voices/` or drops the
      declaration until it does — **the owner's**
- [x] whichever way, the path matches the convention the other instances use
