---
layout: default
title: Content Publication
parent: Skill instructions
---

{: .note }
> Generated from [`skills/content-lifecycle/content-publish.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/content-lifecycle/content-publish.md) — do not edit here. Typed contract: [schema reference](../skills/content-publish.html).

{% raw %}
# Content Publication

Package, version, and publish approved content.

## Responsibilities
- Update version numbers (semantic versioning: major.minor.patch)
- Create publication metadata (publication-request.json for FHIR IGs)
- Build final artifacts (IG Publisher build, LaTeX compilation)
- Create release branches and tags
- Create GitHub releases with release notes
- Deploy to publication platform (smart.who.int, arXiv, etc.)
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
