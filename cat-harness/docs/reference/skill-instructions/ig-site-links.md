---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'ig-site-links'
parent: Skill instructions
---

{: .note }
> Generated from [`fhir-harness/skills/fhir-ig-base/ig-site-links.md`](https://github.com/litlfred/folio-assistant/blob/main/fhir-harness/skills/fhir-ig-base/ig-site-links.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/fhir-harness/skills/fhir-ig-base/ig-site-links.md){: .fa-edit-source }

{% raw %}
# ig-site-links

> Skill id: `ig-site-links` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Issue #2235

An IG's pages are written for the IG Publisher's output directory: a flat
folder of the IG's pages, every artefact page, its QA report, its download
archives, and whatever its template copies. Our site renders the same pages
inside just-the-docs and holds only some of that. **Every link a page makes
therefore resolves somewhere specific, or is said to resolve nowhere.**
Measured on 2026-10-05 before this existed: 408 dead links across the three
smart-* IG sections of the main site, 395 on the smart-immunizations fork. After:
one, which is the IG's own.

## Where each link goes

| a link to | goes to | by |
|---|---|---|
| an artefact page (`StructureDefinition-X.html`) | `artifact/…` on our site | `relinkArtifacts` |
| …differing only in CASE (`-hcert` for `-HCert`) | the one page it can mean; two candidates leave it alone | `relinkArtifacts` |
| a Publisher download (`package.tgz`, `*.zip`) | the IG's published site (sushi `canonical`) | `relinkPublisherOutputs` |
| a Publisher-only page (`qa.html`, `toc.html`, …) | the published site | `relinkOffSite`, `PUBLISHER_PAGES` |
| a FILE of the IG's repository (`.github/…`, `bpmn/x.bpmn` from `input/bpmn/`) | that file on GitHub, at the edit branch | `relinkOffSite` |
| `openapi/index.html` (Swagger's deep links too) | the OpenAPI graph's own index, which forwards `#/<tag>/<operationId>` | `gen-openapi-pages` |
| a `.html` page nothing serves | **left as written and reported** — `DEAD in the IG's own source` in the stage log | `relinkOffSite` |

The last row is deliberate. smart-trust links `video_tutorial.html`, which is
in no source anywhere: it is dead on WHO's own site too. Pointing it at the
published site would trade our visible dead link for WHO's invisible one.
Report it to the IG instead.

## Liquid the Publisher accepts and Jekyll does not

The Publisher's Liquid (Java) reads `"<a href=\"x.html\">X</a>"` with escaped
quotes; Ruby Liquid has no escapes and ends the string at the first `\"`.
`rubyLiquidStrings` writes such an `{% assign %}` single-quoted with plain
quotes — the same string in both engines — and leaves one holding an
apostrophe as written, since it has no faithful Ruby form. Found as smart-base's
`smart.liquid` page showing `<a href=\` for every link variable.

## The gate: a generator never links what it does not write

`gen-ig-pages` refuses (exit 1) when a page it generates links, within its own
directory, a page that run does not write. That is how 388 artefact pages came
to link `.schema.json.html` views that were only written when the index is
`served`: the link and the page were decided by two different conditions. The
rule for any generator here: **write a link and the page it points to under ONE
condition, and check it.**

## Verify on the built site, not on the source

These are found by link-checking the BUILT pages, not by reading the
generator: a full main-site build or the fork's site, and a check over every
relative link in the IG sections. The stage log's `DEAD` line is the start,
not the whole — it cannot see what a later step (the mount pass) serves.
{% endraw %}
