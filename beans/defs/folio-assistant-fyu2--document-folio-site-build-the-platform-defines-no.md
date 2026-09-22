---
# folio-assistant-fyu2
title: 'DOCUMENT FOLIO SITE BUILD: the platform defines no command that builds a document folio''s site, so staging has nothing to publish'
status: todo
type: task
created_at: 2026-09-22T23:35:05Z
updated_at: 2026-09-22T23:35:05Z
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
- [ ] one command builds a document folio's site into a directory, and it is documented
- [ ] `init-folio` writes it as the staging caller's `build_command`, and the PR trigger is on by default
- [ ] a freshly initialised document folio produces a non-empty preview
