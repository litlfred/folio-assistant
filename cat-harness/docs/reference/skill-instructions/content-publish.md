---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Content Publication'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring/content-lifecycle/content-publish.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring/content-lifecycle/content-publish.md) — do not edit here. Typed contract: [schema reference](../skills/content-publish.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring/content-lifecycle/content-publish.md){: .fa-edit-source }

{% raw %}
# Content Publication

Package, version, and publish approved content.

## Responsibilities
- Update version numbers (semantic versioning: major.minor.patch)
- Create publication metadata (publication-request.json for FHIR IGs)
- Build final artifacts (IG Publisher build, LaTeX compilation)
- Create release branches and tags
- Create GitHub releases with release notes
- Deploy to publication platform (smart.who.int, arXiv, etc.) — the push is
  the general [`render-kg-to-cdn`](render-kg-to-cdn.md)
  step with the release root as its publication root URL; the target's Tool
  (`gh-pages` for GitHub Pages) carries the platform-specific steps
- Reset development branch to draft status for next cycle

## Actors
- Publication Manager (lead)
- Programme Manager (release authorization)

## Inputs
- Approved and tested content
- Version increment decision (major/minor/patch)
- Release notes

## Outputs
- Published artifacts (IG, PDF, etc.)
- GitHub release with tags
- Publication URL
- Updated version in development branch
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Incremental IG build](../../processes/ig-incremental-build.html) | Deploy the preview site; Deploy the site [content-publish] |
| [L3 FHIR IG pipeline](../../processes/l3-fhir-pipeline.html) | Publish the IG site |
| [Authoring a document](../../processes/authoring-a-document.html) | 9 · Publish |
| [Content Change and Review](../../processes/content-change-review.html) | Rebuild main site |
| [Content lifecycle](../../processes/content-lifecycle.html) | Draft, review and publish (calls a sub-process) |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Build the draft publication; Authorise the release; Version, tag and publish |
| [Authoring a paper](../../processes/authoring-a-paper.html) | 9 · Publish |

