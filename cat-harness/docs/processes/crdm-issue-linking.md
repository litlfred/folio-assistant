---
title: 'CRDM — link the work to an issue'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/crdm-issue-linking.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# CRDM — link the work to an issue

`Process_CRDM_Issue` · strict (defaulted) · 4 step(s)

Feature work must be linked to a GitHub issue. First find the related work (beans, issues, open PRs) and ask whether to coordinate; then scan before creating, and never create one without the BA's permission — an issue is the stakeholder's record, not the agent's scratchpad.

<img src="../assets/img/workflows/crdm-issue-linking.svg" alt="BPMN diagram: CRDM — link the work to an issue" style="max-width:100%">

## How it connects

- **Called by:** [CRDM requirements](crdm-requirements.html)
- **Calls:** [Related work: find, sort, summarize, ask to coordinate](related-work.html)
- **Presented on:** no docs page section shows this diagram

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Agent | `authoring-agent` | The only CRDM sub-diagram in this slice where the BA has no lane of its own: A_AskCreate is still an Agent-lane activity, so the permission this process exists to enforce is obtained out of band rather than modelled as a cross-lane handoff, unlike crdm-requirements-definition.bpmn and crdm-close.bpmn elsewhere in the same methodology. |

## Steps

Every one of the 4 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Related work: find, sort, ask**<br>`Call_RelatedWork` | Agent | calls [Related work: find, sort, summarize, ask to coordinate](related-work.html) | When the requirement is initiated or updated through a human-agent chat, search the beans and the repository's issues and open PRs for relevance, categorize and summarize them, and ask the user whether and how to coordinate. Judgement decides the categories; the user decides the coordination. Owner, 2026-09-23 (issue #1023). |
| **Scan open issues for match**<br>`A_ScanIssues` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | Search open issues, then recently closed ones, by title and body keywords for one this request belongs to. Requirements may span several issues; note every relevant one. |
| **Ask BA to create or link issue**<br>`A_AskCreate` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | Ask — never create. Creating an issue without the BA's permission is the thing this step exists to prevent. |
| **Link to existing issue**<br>`A_LinkIssue` | Agent | [`crdm-requirements-workflow`](../reference/skill-instructions/crdm-requirements-workflow.html) | A match was found: ask the person whether the requirements go on #NNN, then link the work there. The issue is where stakeholders sign off, so no phase proceeds without one. |

## Decisions

Every one of the 1 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **Issue found?**<br>`GW_Issue` | Answered by the scan of open issues: does one already cover this work? `yes` links to it; `no` asks the BA to create or name one. The agent does not create an issue on its own. | **no** → Ask BA to create or link issue<br>**yes** → Link to existing issue |

{% endraw %}
