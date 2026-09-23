---
title: 'CRDM — link the work to an issue'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/crdm-issue-linking.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# CRDM — link the work to an issue

`Process_CRDM_Issue` · strict (defaulted) · 3 step(s)

Feature work must be linked to a GitHub issue. Scan before creating, and never create one without the BA's permission — an issue is the stakeholder's record, not the agent's scratchpad.

<img src="../assets/img/workflows/crdm-issue-linking.svg" alt="BPMN diagram: CRDM — link the work to an issue" style="max-width:100%">

## How it connects

- **Called by:** [CRDM requirements](crdm-requirements.html)
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Agent | — | The only CRDM sub-diagram in this slice where the BA has no lane of its own: A_AskCreate is still an Agent-lane activity, so the permission this process exists to enforce is obtained out of band rather than modelled as a cross-lane handoff, unlike crdm-requirements-definition.bpmn and crdm-close.bpmn elsewhere in the same methodology. |

## Steps

**2** of 3 step(s) carry no documentation — `activity-documented` lists them.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Scan open issues for match**<br>`A_ScanIssues` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | — |
| **Ask BA to create or link issue**<br>`A_AskCreate` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | Ask — never create. Creating an issue without the BA's permission is the thing this step exists to prevent. |
| **Link to existing issue**<br>`A_LinkIssue` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | — |

{% endraw %}
