---
# folio-assistant-n98f
title: Retire the content-pipeline-navigator subagent
status: completed
type: task
priority: normal
created_at: 2026-09-19T08:06:05Z
updated_at: 2026-09-19T08:54:16Z
---


## Done, 2026-09-19

Owner: *"get rid of content-pipeline-navigator"*.

Removed `.claude/agents/content-pipeline-navigator.md` and its generated
`.claude/agent-memory/` directory. Two subagents remain.

## The memory was the whole problem

Twelve entries reached it. **Three** also reached `platform-boundary-guard` and
survive untouched. **Nine** reached it and nothing else — and two of those were
TRAPs written by OTHER sessions (`never-assert-on-a-qa-verdict-from-the-published-corpus`,
37 lines, migrated from a sibling's hand-edit this morning; and
`derive-the-gate-list-from-the-workflow`, which arrived from `main`).

Deleting the agent must not mean deleting their work.

**And there was nowhere to put it.** `platform-boundary-guard` was already at
**189 of its 200-line injection budget** — the harness injects the first 200
lines and silently drops the rest — so it could not absorb even two of the nine
without pushing an entry past the line.

## Two outcomes, and the split is by whether a reader exists

- **Two re-homed to `ci-health-watcher`** (104 → 154 lines, comfortably under).
  Both are about not over-claiming from CI/QA state, which is that agent's
  entire discipline: *"could not check" is never green*, *re-measure, do not
  quote*. The fit for the QA-verdict one is good rather than perfect — it is
  about test fixtures — and injection into an approximate reader beats
  archiving into none.
- **Seven archived.** `archived: "true"`, a new field: retained as graph
  nodes, injected into nobody's prompt. Still greppable, still readable, still
  in the graph. The same reason a bean is `scrapped` and not deleted — the
  record of what was learned outlives the mechanism that carried it.

## The bug I wrote and then committed, within ten minutes

I added a comment to `memoryForAgent` saying an archived entry must be checked
BEFORE the untagged rule, because an archived entry has no agent tag once its
agent is gone — so checking it second hands it to every agent.

Then I removed the retired agent's name from two entries **without** archiving
them, which left `agents:` present and empty. Both went untagged, reached every
agent, and pushed `platform-boundary-guard` **39 lines over budget**, dropping
its own `three literals worth recognising in new code` TRAP past the truncation
line.

Caught by the overflow warning I had built for exactly this, which named the
entry that fell off. Both directions now have a test.

## Verified

119/119 e2e, 2249 unit tests, tsc, eslint, and 8 gate scripts. Both remaining
agents under budget with no overflow: `ci-health-watcher` 154,
`platform-boundary-guard` 189.
