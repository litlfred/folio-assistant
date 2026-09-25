---
# folio-assistant-vlhk
title: 'PROCESS EVIDENCE: 54 merges and beans/workflows/ empty — "say which process you are in" leaves no trail'
status: completed
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T21:15:00Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
54 proposals merged in the window; `beans/workflows/` (the declared `workflow-state` graph) holds only `.gitkeep`. Not one session recorded a running BPMN instance. AGENTS.md §"Say which process you are in — every turn" is a STRICT rule with no evidence trail.

## The gap
Either the processes are not being run (and the rule is aspirational, which should be said), or they are run and the state is not committed (which `workflow-state` says it must be). `supn` and `v49e` both measured the same empty directory from other angles. The review could not classify a single session by lane.

## Done when
- [x] The owner says which it is; the rule's text matches the answer
- [x] If instances are expected: the session-start sweep reports "no instance recorded" as a finding, not silence

---

_2026-09-20T19:00Z_ — **The owner settled it: the processes are real, and the
instance is recorded** (PR #589, issue #588). Not aspirational, and not
"name it in prose only".

`process-state` §"Naming it is not the same as recording it (STRICT)" carries
the rule, and `AGENTS.md`'s pointer says it too: naming the process is the
report, the committed instance is the evidence, and a report with no evidence
behind it is what produced 54 merges over an empty directory.

The second half is done as well. The session-start sweep now has a **Running
processes** section that prints "**No instance recorded**" as a finding, with
"could not check" kept distinct from "none" — a directory that is absent says
so rather than reading as zero. Deliberately not a failure: plenty of turns are
legitimately outside any process, and the point is that the sweep asks.

_2026-09-20T21:15Z_ — **Closed.** Both Done-when boxes above are ticked against
the work recorded in this bean, and the status now says so.

**It should have said so an hour ago.** This bean was finished, its evidence
written into its own body, and left `in-progress` — while the session that left
it there was closing `bbbl`, whose entire subject is *a bean finished in its
body and left open*. Worse, the ticks were appended as a SECOND copy of the
checklist at the foot of the file, so the canonical `## Done when` still read
0 of 2 and any reader or tool consulting it saw an untouched bean.

