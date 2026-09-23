---
title: 'Publishing the docs site, and keeping the previews alive'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/docs-site-publish.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Publishing the docs site, and keeping the previews alive

`Process_DocsSite` · strict · 5 step(s)

PUBLISHING THE SITE IS A FULL REPLACE, AND THAT IS THE WHOLE REASON THIS IS DRAWN. Bean `7yvd`. The workflow is 432 lines and its shape is not legible from them: what a reader needs to know is that `gh-pages` is REPLACED wholesale, so anything on that branch which this build did not produce is gone unless something puts it back.&#10;&#10;That is bean `plj1` — every open pull request's review preview deleted by an unrelated merge, silently, for months. The repair is the two steps either side of the publish, and they are a PAIR: `Restore the open PRs' staging previews` copies them into the publish directory before the replace, and `Did the previews survive?` reads the deployed ref afterwards. Neither is sufficient alone — a restore nobody verifies is a restore that can silently stop working, which is exactly how the original defect lasted.&#10;&#10;BOTH GATEWAYS REFUSE RATHER THAN WARN, and the second is three-state: it fails on a preview that is missing AND on a check that could not tell, because a verification that has gone blind must not read as permission. Same rule as `ci-health` — could-not-determine is never rendered as clean.&#10;&#10;`Regenerate every derived reference from its source` stands for five separate generators (schema reference, skill instruction pages, content-backed docs, the translation index, the BPMN renders). They are drawn as one task on purpose: they are independent of each other and sequential only because a single job runs them, so five boxes would assert an ordering the workflow does not have.&#10;&#10;Mechanical throughout. There is no human lane, which is what makes `build-pipeline` the right lane rather than a convenient one.

<img src="../assets/img/workflows/docs-site-publish.svg" alt="BPMN diagram: Publishing the docs site, and keeping the previews alive" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| CI/CD Pipeline | — | Before it will even attempt the risky part, GW_Complete can refuse outright and end at End_Refused if a maintained artefact is missing — so an incomplete build never reaches Task_Publish's full replace at all, which is a harder stop than the restore/verify pair further down the same lane makes for a partial one. |

## Steps

**5** of 5 step(s) carry no documentation — `activity-documented` lists them.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Regenerate every derived&#10;reference from its source**<br>`Task_Regenerate` | CI/CD Pipeline | — | — |
| **Build the Jekyll site&#10;and the API reference**<br>`Task_Build` | CI/CD Pipeline | — | — |
| **Export the knowledge graph&#10;and its schema**<br>`Task_Export` | CI/CD Pipeline | — | — |
| **Restore the OPEN PRs'&#10;staging previews**<br>`Task_Restore` | CI/CD Pipeline | [`feature-staging`](../reference/skill-instructions/feature-staging.html) | — |
| **Publish to gh-pages&#10;(FULL REPLACE)**<br>`Task_Publish` | CI/CD Pipeline | — | — |

{% endraw %}
