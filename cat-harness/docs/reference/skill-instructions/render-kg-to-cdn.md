---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Render a Knowledge Graph to a CDN'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/process/workflow/render-kg-to-cdn.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/process/workflow/render-kg-to-cdn.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/process/workflow/render-kg-to-cdn.md){: .fa-edit-source }

{% raw %}
# Render a Knowledge Graph to a CDN

Owner, 2026-09-30: *"render content of a KG (or list of subgraphs within) for
publication to a CDN at a given publication root URL … independent of staging
vs publication … just rendering … output is status of push to CDN +
message"*, and *"gh-pages is one specific tool of general 'publish to CDN'"*.

Drawn as [`render-kg-to-cdn.bpmn`](../../processes/render-kg-to-cdn.html).

## Inputs and output

| input | what |
|---|---|
| Knowledge Graph | an instance root — or a tree the caller has already rendered and verified |
| Subgraphs | optional: declared directory ids; absent means the whole graph |
| publication root URL | where the rendering is served |
| CDN target | which Tool performs the push — a Tool that `satisfies: ["render-kg-to-cdn"]` |

| output | what |
|---|---|
| status | `pushed`, `not-pushed`, or `could-not-determine` — a check that could not look is never `pushed` |
| message | one line, postable as it stands: what is live (a commit), where, and the QA result |

## Staging and release are the same step

A preview is this with a root under the release root; a release is this with
the release root. **What differs belongs to the caller**: who may start it,
what must be reviewed or verified first, what else lives on the same host and
must survive the push. That is why [`feature-staging`](feature-staging.md)
and `docs-site-publish` both *call* this process rather than restating it, and
keep their own steps — the slug, the render log, restoring the open previews,
the publication-manager alert — around the call.

## Name the Tool, not its steps

The general process has one call activity, **bound by the Tool**: the
activity names this skill, the Tool for the chosen target `satisfies` it, and
the Tool lists its own `subprocesses` — the diagram of *its* steps
([`skills-and-tools`](skills-and-tools.md),
[`bpmn-processes`](bpmn-processes.md)). The general skill never lists them.

| target | Tool | its subprocess | its message |
|---|---|---|---|
| GitHub Pages | `gh-pages` | bootstrap-tools `processes/render-kg-to-github-pages.bpmn` | the commit merged onto `gh-pages` + the QA of what is staged and what is served |

**A target may need provisioning before it accepts a push; the Tool's
subprocess owns that.** For GitHub Pages a `gh-pages` branch has to exist
before Pages can be switched on to serve it (owner, 2026-10-01), so the
`gh-pages` subprocess creates it first — the general step does not.

Another CDN is another Tool with its own subprocess, and nothing here changes.
A CDN in front of an origin is a *layer*, not a publication host
([`kg-to-portal`](kg-to-portal.md)): the publication root URL
stays the origin's canonical one even when a CDN serves it.

## What this is not

Not the verification of what a build produced — that is
[`publish-verification`](publish-verification.md), and it runs
*before* a caller hands its tree over. Not the decision to release —
[`content-publish`](content-publish.md) and
[`release-lifecycle`](release-lifecycle.md). This step renders, pushes, and says
whether the push landed.
{% endraw %}

## Processes that run this skill

This skill has its own process: **[Render a Knowledge Graph to a CDN](../../processes/render-kg-to-cdn.html)**.

<img src="../../assets/img/workflows/render-kg-to-cdn.svg" alt="BPMN diagram: Render a Knowledge Graph to a CDN" style="max-width:100%">

| process | step(s) that name it |
|---|---|
| [Render a Knowledge Graph to a CDN](../../processes/render-kg-to-cdn.html) | Resolve the Subgraphs, the root URL and the target's Tool; Render and push with the target's Tool [its own subprocess]; Report the push: status and message |
| [Publishing the docs site, and keeping the previews alive](../../processes/docs-site-publish.html) | Push to the CDN [render-kg-to-cdn] gh-pages, FULL REPLACE (calls a sub-process) |
| [Staging a feature branch preview, and taking it down](../../processes/feature-staging.html) | Push to the CDN at STAGING/&lt;slug&gt;/ (calls a sub-process) |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Version, tag and publish |

