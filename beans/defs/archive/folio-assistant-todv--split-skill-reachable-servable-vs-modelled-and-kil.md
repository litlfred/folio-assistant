---
# folio-assistant-todv
title: 'Split skill-reachable: servable vs modelled, and kill the stale 6'
status: completed
type: task
priority: normal
created_at: 2026-09-18T23:41:01Z
updated_at: 2026-09-18T23:41:01Z
---


**The "6 unreachable skills" was stale, and I repeated it to the author as
live.** It sat in `AGENTS.md` after the finding was resolved. Measured
2026-09-18: `skill-reachable` reports **0**. That is the exact failure the
repo's own "do not quote a count from here" rule exists to prevent, so the
paragraph now says so rather than just carrying a corrected number.

**The criterion was honest but misnamed, and the name is what let the stale
number survive.** It passes if a skill is servable, held by the harness,
carried by a role, or named by an activity. The servable clause alone covers
nearly the whole corpus, so it passes near-trivially — and its green was read
as an answer to the question the name implied.

Measured, same run: **143 known skills, 47 carried by a role, 46 named by an
activity, 96 reached by neither.** Both numbers are true; only one was visible.

## Summary of Changes

- `skill-reachable` → **`skill-has-entry-point`**, with the summary saying
  plainly that it does NOT mean the process model reaches the skill.
- New **`skill-in-role-or-process`** (`minor`) reporting the 96, and `unknown`
  when no role graph is declared — with no roles the count would be the whole
  corpus, a number that says nothing about the corpus and everything about the
  missing file.
- `AGENTS.md` and `role-model.md` corrected.

**The 96 must never gate, and `minor` is what stops it.** A skill invoked
directly by name — `corpus-grep`, `diff`, `kg-export`, `mcp-contract`, the
watcher family — is doing its job without appearing in any diagram, and
`skill_fetch` by name is a first-class entry point. Driving it to zero means
inventing roles and activities to absorb tools that do not want them. Watch it
move; do not read it as debt.
