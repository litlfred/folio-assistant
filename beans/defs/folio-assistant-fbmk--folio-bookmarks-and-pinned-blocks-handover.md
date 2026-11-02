---
# folio-assistant-fbmk
$schema: bean/1.0.0
title: 'Folio bookmarks and pinned blocks: pin any graph-kind block to the folio glass (handover bean)'
status: in-progress
type: task
priority: normal
created_at: 2026-11-02T18:30:00Z
updated_at: 2026-11-02T18:30:00Z
parent: folio-assistant-4j43
tags:
    - folio-glass
    - bookmarks
    - handover
---

## How to resume (read this first)

1. Read this bean, newest comment last. The last comment is the current state.
2. Project thread: "Add bookmarks and pinned blocks to folio" (cmsg_017WNUkNK8kdDziPK58Pv6G9RCjaQapmrcxejK8nANXnjj).
3. Check whether the left-gutter rework has merged: folio-assistant-core#616, cat-harness-tools#1411, cat-harness#981. Build on top of it, not beside it.
4. Check whether the owner answered the design card (Q-BMK-1). Do not build before that.
5. After each step append `_<UTC>_ — <what changed, links>` and bump `updated_at`. Commit straight to `cat/cat-harness/beans`.

Resume prompt: "read bean folio-assistant-fbmk on branch cat/cat-harness/beans of litlfred/folio-assistant and continue folio bookmarks".

## What the owner asked (2026-11-02 18:24Z)

- A bookmark icon in the document display's block gutter. Clicking it adds a `bookmark` kind item to the folio that links to that point of the document. Same front-page avatar as a library item, with bookmark iconography.
- Any content block can be pinned to the folio to return to it (glossary of a harness or ingested library, a BPMN diagram, a FHIR resource instance): "any graph kind really", "should be core infra of the viewer/graph kind", not per-kind code.

## Where the code is (found 18:28Z)

- Folio store and glass: `cat-harness/site-chrome/assets/js/docs-ui.js`. localStorage key `fa-folio-assets`; `displayInFolio(key, {title, href, avatar, kind})` (~l.5450), `shelveFromGlass`, `placeOnGlass`, `folioStateOf`. Library rows opt in by attributes `data-fa-library-item/-title/-href/-avatar/-kind`, picked up by `mountLibraryPullouts` (delegated click on `.fa-pullout`).
- Avatars: `avatarOf` in `cat-harness-tools/scripts/library-graph.ts`; covers via `library-covers.ts`; avatar kinds in `avatars.css` (from `gen-avatars-css.ts`).
- Block gutter icons (✎ edit, 📣 feedback, 🔗): `folio-assistant-core/scripts/block-actions.ts`, drawn by `build-document-site.ts`. Skill `folio-assistant-core/skills/content/folio-document-adapter/block-actions.md`.
- Glass rules: skill `cat-harness/skills/ui/ui-core/board-windows.md` and `folio-assistant-core/.../folio-board-windows.md` (three states library / folio / glass; put-back happens from the source, not from the glass).
- Copilot instructions: none in folio-assistant-core, cat-harness-tools (checked 18:28Z). cat-harness: to check.

## Plan

- [ ] Mockups (bookmark in gutter; bookmark card on glass; pinned block card for glossary / BPMN / FHIR) and card Q-BMK-1 for the owner.
- [ ] GitHub issue (cat-harness, the glass owner).
- [ ] Core infra: one generic opt-in, e.g. `data-fa-pin="<iri>"` + title/href/avatar/kind on any rendered block of any graph kind, so docs-ui.js gives it a pin control and calls `displayInFolio`. Store key = the node IRI.
- [ ] Bookmark = kind `bookmark`, href = document URL + block anchor, avatar = the document's cover + bookmark badge.
- [ ] Tests (docs-ui specs, block-actions tests), PRs, watch.

## Log

_2026-11-02T18:30Z_ — bean created; code located; mockups next.
