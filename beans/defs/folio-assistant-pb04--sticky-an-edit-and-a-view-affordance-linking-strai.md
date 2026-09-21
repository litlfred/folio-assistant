---
# folio-assistant-pb04
title: 'STICKY: an edit AND a view affordance, linking straight to GitHub, gated on the rendering pipeline''s GitHub capability'
status: completed
type: task
priority: normal
created_at: 2026-09-20T11:41:28Z
updated_at: 2026-09-20T19:17:14Z
parent: folio-assistant-yj32
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

---

## Done, 2026-09-20 — and the gap was narrower AND wider than the bean said

The bean was right that this is not a build from scratch. It was wrong about
which half was missing, in a way worth recording because the shape recurs.

### The landing half's DATA was already complete, and nothing rendered it

`sourceLinks` in `schemas/landing-sticky.ts` already returned `{viewHref,
editHref}`, already resolved `/blob/` and `/edit/` separately, already gated on
`detectRepoUrl` returning a github.com `origin`, and already used the
sticky's own `declaredIn` so a bootstrap card links to
`bootstrap/harness.json`. `gen-landing-data.ts` called it and SPREAD the
result, so an absent link is an absent key rather than `null`.

`docs/_data/stickies.json` has carried both URLs, correct, for some time. **The
landing template rendered neither.** A value nothing renders is
indistinguishable on the page from one nothing computes — and this one had
every design decision the bean asks for already made and paid for.

So the landing half was one template block, not a feature.

### The todo half had three separate defects, and one was a dead link

1. **Only EDIT existed.** No view control at all.
2. **The address was a LITERAL** — `EDIT_BASE`, built from a hardcoded
   `https://github.com/litlfred/folio-assistant`. The comment beside it argued
   that a folio's own address does not belong in shared client code, and then
   wrote one down one layer up. A fork or a rename published links to this
   repository.
3. **There was no capability gate**, so the pencil appeared whether or not the
   pipeline had a forge behind it.

**And the pencil was DEAD.** `readTodoFiles` reports paths relative to the
cat-harness INSTANCE while `todos/` sits at the repository root, so it returns
`../todos/items/x.md` — and the old link shipped that verbatim as
`.../edit/main/../todos/items/x.md`. A browser normalises the `..` away before
the request is sent, so GitHub received `/edit/todos/items/x.md`: the branch
segment eaten, a path that has never existed. **Every todo sticky's edit link
on the published board was broken**, and the generated JSON looked entirely
correct. Found by resolving the link rather than by reading it.

All four fixed by routing the todo side through the SAME `sourceLinks` seam the
landing side uses, with a `repoRelative` helper for the path. One answer to
"where is this file on the forge", not two.

### Done when

- [x] A sticky renders an edit control at `/edit/<branch>/<path>` and a view
      control at `/blob/<branch>/<path>`, for the file that declares it
- [x] Both are ABSENT — not broken, absent — with no GitHub capability, tested
      in BOTH directions
- [x] A landing sticky resolves to the CONTRIBUTING instance's `harness.json`
- [x] The affordance comes from the layered generation pass, not from a branch
      in the landing template

The last one deserves a note. The template now has an `{%- if st.viewHref or
st.editHref -%}`, which *looks* like the branch the bean forbids and is not:
the branch tests for a value the GENERATOR decided, and the generator decided
it by probing. The template makes no judgement about whether a forge exists —
it renders what it was handed. The forbidden version is a template that
composes a URL itself.

### Two controls, two classes, deliberately

`.fa-sticky-view` and `.fa-sticky-edit` share one CSS rule (the 2.75rem touch
target and restored opacity that `y8cm` measured — `opacity: 0.35` was
**2.22:1** against the floating card where AA asks 4.5:1) but keep separate
classes, because they ARE different controls and a test needs to tell them
apart. Two existing tests were selecting on the shared `.fa-node-edit` class
and started matching two links; both were made specific rather than loosened,
and one of them — the inline-sticky case the bean says must keep working —
now asserts BOTH affordances by name, because a count over the shared class
would silently accept two pencils.

### Verified

38 sticky e2e pass, including three new ones: both controls present with
DIFFERENT URLs, both absent with nothing greyed in their place when the index
carries no links, and neither URL containing a `..`. 32 a11y e2e pass,
including the per-node edit link's contrast in both schemes. `bun test` 4106
pass / 0 fail. Eight repository gates rc=0; `check:escaped-markup` returns 2
(could-not-determine, no built site) both before and after this change.
