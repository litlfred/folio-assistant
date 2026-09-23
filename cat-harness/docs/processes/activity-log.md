---
title: 'Agent activity log'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/activity-log.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Agent activity log

`Process_ActivityLog` · advisory · 8 step(s)

What an agent writes down about its own run, and what a person can do with it afterwards: task starts and ends, messages and errors, persisted where somebody can read them. You are in this process on every task, whether or not capture is on — the first gateway is what decides, and an agent that does not check it logs into nothing. The log operator's lane is the other half: a person discards one entry or a whole session, and the scheduled sweep does neither on its own. This is not the work plan. `beans` records WHAT is being worked on and survives the session; this records what happened during it. The two answer different questions and a reader reaching for one is badly served by the other.

<img src="../assets/img/workflows/activity-log.svg" alt="BPMN diagram: Agent activity log" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none
- **Skill:** [`activity-log`](../reference/skill-instructions/activity-log.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Agent (this session) | — | Brackets its own work with a start and an end entry rather than leaving either implied, and reads Gateway_Capture rather than assuming it: persisting when capture is on, but merely reporting the setting — never silently dropping the entry — when it is off or could not be determined. |
| Activity log | — | — |
| Log operator (human) | — | The only lane in this diagram that chooses: one entry by id, or everything. It was split out from a single conflated lane because a person's choice and a scheduled sweep's fixed program are not the same actor, which is why the sweep below has a lane of its own rather than sharing this one. |
| Scheduled log sweep | — | — |

## Steps

**8** of 8 step(s) carry no documentation — `activity-documented` lists them.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Log task-start**<br>`A_LogStart` | Agent (this session) | [`activity-log`](../reference/skill-instructions/activity-log.html) | — |
| **Do the work**<br>`A_DoWork` | Agent (this session) | — | — |
| **Log a message or an error**<br>`A_LogMessage` | Agent (this session) | [`activity-log`](../reference/skill-instructions/activity-log.html) | — |
| **Log task-end**<br>`A_LogEnd` | Agent (this session) | [`activity-log`](../reference/skill-instructions/activity-log.html) | — |
| **Persist the log to the data store**<br>`A_PersistLog` | Agent (this session) | [`activity-log`](../reference/skill-instructions/activity-log.html) | — |
| **Report the capture state**<br>`A_ReportCaptureState` | Agent (this session) | [`activity-log`](../reference/skill-instructions/activity-log.html) | — |
| **Discard one entry by id**<br>`A_EmptyOne` | Log operator (human) | [`activity-log`](../reference/skill-instructions/activity-log.html) | — |
| **Discard all entries, or a whole session**<br>`A_EmptyAll` | Log operator (human) | [`activity-log`](../reference/skill-instructions/activity-log.html) | — |

{% endraw %}
