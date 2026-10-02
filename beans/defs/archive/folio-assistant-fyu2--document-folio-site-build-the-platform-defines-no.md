---
# folio-assistant-fyu2
title: 'DOCUMENT FOLIO SITE BUILD: the platform defines no command that builds a document folio''s site, so staging has nothing to publish'
status: completed
type: task
priority: normal
created_at: 2026-09-22T23:35:05Z
updated_at: 2026-09-23T14:44:37Z
parent: folio-assistant-q4jm
---

Found 2026-09-22 building ojcx (folio staging).

**The gap.** `publish.yml` is the platform's reusable build for folios, and it builds a PAPER: LaTeX, then PDF and blueprint HTML. The document adapter's `document_render_md` / `document_render_pdf` (pandoc) produce single documents, not a browsable site. Nothing produces a document folio's SITE, which is the thing a staging preview publishes and the `review/` page (txut) sits on. So `init-folio` writes the staging caller OFF, with a `build_command` that refuses, because any command it wrote would be a guess.

**Why under q4jm.** A reviewer of an L1 handbook needs a rendered "after" to open. Without this, ojcx's reusable workflow has nothing to deploy for exactly the folios the epic is for. The rendering epics (o3xy, yj32) were the alternative parent, but read alongside this one's siblings, the review blocker is the point.

**Candidates to look at before designing one:**
- the just-the-docs pipeline the platform uses for its own docs;
- `gen-folio-viz.ts` (the folio graph projection);
- the WHO IG path (IG Publisher) for DAK-shaped folios.

## Done when
- [x] one command builds a document folio's site into a directory, and it is documented: `cat-harness/scripts/build-document-site.ts --out _site`
- [x] `init-folio` writes it as the staging caller's `build_command`, with the PR trigger on by default, for DOCUMENT folios. Paper folios stay off (see round 1)
- [x] a freshly initialised document folio produces a non-empty preview. Tested (`build-document-site.test.ts`) and rehearsed end to end (see round 1)

## Round 1: 2026-09-23

**Correction to this bean's own premise.** It said the platform had "no command that builds a document folio's site". Half wrong: the document adapter already renders HTML (`document_render_html`: `buildDocumentMarkdown`, then pandoc), but only as an MCP tool call into a build directory. What was missing was a **command** a CI job can name, and one that does not need pandoc installed.

**`cat-harness/scripts/build-document-site.ts`** reuses the adapter's own `buildDocumentMarkdown`, which already puts `<a id="<label>">` before every labelled block, section and chapter. It renders through `remark-html`, already a dependency. Output is `<out>/index.html` plus `<out>/<slug>/index.html`. A folio with no document, or an assembly error, exits non-zero.

**Rehearsed end to end** on a folio `init-folio` scaffolded, with the platform symlinked as a folio links it. The rehearsal mirrored `folio-staging.yml` step by step:
1. `git` base.
2. An edit to one block's prose.
3. The site build.
4. The ChangeSet, which reported exactly one change, `prose:overview` with the `prose` aspect.
5. The staging banner, injected into 2 pages.

The only step not exercised is the push to gh-pages.

**`init-folio`** now writes the staging caller **on** for document folios, and adds `_site/` to `.gitignore`, which the rehearsal found missing. **Paper folios stay off**: they build through `publish.yml`, and their site is the folio's to name.

## Closed with evidence — 2026-09-23

Re-derived against `main` at `948afb5` rather than read off the ticks.

- `cat-harness/scripts/build-document-site.ts` exists and is the one command
- `cat-harness/scripts/tests/build-document-site.test.ts` green

No open pull request mentions this bean and it has no children.
