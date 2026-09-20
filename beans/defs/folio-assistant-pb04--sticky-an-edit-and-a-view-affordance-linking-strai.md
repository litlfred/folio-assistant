---
# folio-assistant-pb04
title: 'STICKY: an edit AND a view affordance, linking straight to GitHub, gated on the rendering pipeline''s GitHub capability'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T11:41:28Z
updated_at: 2026-09-20T13:32:34Z
parent: folio-assistant-o3xy
---


Owner request, 2026-09-20, verbatim because the wording carries three distinct
requirements a paraphrase would merge:

> stckynnotes should have edit tool = link to github pages edit directrly , liek
> with other content blocks. rendeding shows edit src icon (and also need view
> icon) if github tools avaialable in rendering pipeline. they get a pass at the
> content rendering (it layered content generation based on depedency chain)

## What already exists, measured

Not a build from scratch — three pieces are in `docs/assets/js/docs-ui.js`:

- `.fa-node-edit` — the pencil, with its own section comment at :1681 saying it
  is a LINK, not an editor.
- `class: "fa-node-edit fa-sticky-edit"` at :1944 — stickies already carry an
  edit affordance in at least one place.
- `REPO_BLOB = "https://github.com/litlfred/folio-assistant/blob/main/"` at
  :2913, and :639 composes `links.source + "/blob/main/" + node.sourcePath`.

So the gap is narrower than the request sounds, and worth stating precisely
before anybody rebuilds what is there.

## The four things actually asked for

1. **`/edit/` not `/blob/`.** The existing links are `blob` — read-only. An
   *edit* affordance is `https://github.com/<owner>/<repo>/edit/<branch>/<path>`,
   which opens GitHub's own editor. `bun run upload-url` already composes the
   sibling `/upload/` form, so the shape is established here.
2. **A VIEW icon as well as an edit icon.** Two affordances, not one — the
   request says "also need view icon". `blob` is the view target; `edit` is the
   new one. They are different URLs and should be different controls.
3. **Gated on capability, not assumed.** "if github tools avaialable in rendering
   pipeline" — the icons appear only when the rendering pipeline actually has
   GitHub available. This repository already has the vocabulary for that
   (`--check-deps`, `.claude/skills/capabilities/*.json`, e.g. `git-read.json`),
   so the gate is a capability probe rather than a hardcoded `true`. **A dead
   edit link is worse than no edit link**: it invites a click that 404s, and on a
   private repository it 404s for exactly the reader who lacks access, which
   reads as "this page is broken" rather than "you cannot edit this".
4. **Stickies get a pass at content rendering** — "it layered content generation
   based on depedency chain". A sticky is rendered content like any block, so it
   belongs in the layered generation pass rather than being special-cased. This
   is the part to design rather than patch: the landing stickies are a LAYER'S
   CONTRIBUTION composed from each `harness.json`, so "its source path" is the
   contributing instance's declaration, not one file.

## Done when

- [ ] A sticky renders an edit control pointing at `/edit/<branch>/<path>` and a
      view control pointing at `/blob/<branch>/<path>`, for the file that
      actually declares it.
- [ ] Both are absent — not broken, absent — when the rendering pipeline has no
      GitHub capability. Tested in BOTH directions; a test that only checks the
      present case passes equally for a control that is always shown.
- [ ] For a landing sticky, the path resolves to the CONTRIBUTING instance's
      `harness.json`, not to `cat-harness/` by default. Three contributors exist
      today (`cat-harness`, `bootstrap`, `folio-assist-core`), so a wrong default
      is silently right one third of the time.
- [ ] The affordance comes from the layered content-generation pass, not from a
      branch in the landing template.

## Not in scope

An in-page editor. The existing comment at `docs-ui.js:1681` already draws this
line for `.fa-node-edit` and the request says "link to github pages edit
directrly" — a link, which is what makes this small.
