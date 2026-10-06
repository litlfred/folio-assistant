---
name: block-actions
description: >
  Every block of a rendered document links back to where it can be changed:
  [edit] opens the block's Markdown source in GitHub's editor, and [feedback]
  opens a GitHub issue about that block, from the folio's own issue form when it
  has one, listing the change-sets that already discuss the block. Use when a
  reader, reviewer or agent needs to propose a change to one block, when setting
  up a folio's feedback issue form, or when a document site's links point
  nowhere.
---

# Block actions: [edit] and [feedback] on every block

A reader who finds something wrong in a block should be one click from
proposing the fix or saying what is wrong, and that click should land on the
block, not on the repository. The owner asked for it on 2026-10-06, looking at
the DPI-H document on staging, *"like smart-immiz does"* (the IG builder puts
"Edit this page on GitHub" and a 📣 feedback icon on every heading). This is
the same affordance per **block**, because a block is what a comment, a
change-set and an edit are about. Bean `uphx`, REQ-17.

The code is `folio-assistant-core/scripts/block-actions.ts`; the Tool is
`block-actions`; the document build (`build-document-site.ts`) draws the links
on every labelled block, and the public-comment overlay adds the issues that
already discuss the block.

## What each link does

| link | opens | what the person does next |
|---|---|---|
| **✎ edit** | the block's source (`folio/<doc>/<chapter>/<root>.md`, or its `.ts` if it has no `.md`) in GitHub's editor, on `main` | edits and proposes the change; GitHub makes the branch and the pull request, which is reviewed like any content change (`content-change-review.bpmn`) |
| **📣 feedback** | a new issue about the block | describes the problem; the issue is intake, and a public-comment folio triages it like any other comment (`public-comment` skill) |
| **discussed in #n** | the issue of each change-set the block's comments are in | joins the existing discussion instead of opening a duplicate |

## The issue form is the folio's, and optional

With no form, [feedback] opens a blank issue whose body already says which
block, which section, the source link and the block's address on the site. It
works on day one.

A folio that wants structured feedback adds a GitHub issue form at
`.github/ISSUE_TEMPLATE/block-feedback.yml` (another name with
`--issue-template`). The link then names the form and prefills **only the
fields the form declares**, matched by `id`:

| field id | filled with |
|---|---|
| `block` | the block's label (its anchor) |
| `section` | the heading the block is under |
| `source` | the block's source path in the repository |
| `page` | the page it renders on |
| `url` | the block's address on the published site (needs `--site-url`) |

A form may declare any subset, and fields it does not declare are not sent.
Add the questions you want answered (what is wrong, a suggested wording, the
reviewer's organisation) as further fields; they are left for the person.

## Where the repository comes from

`GITHUB_REPOSITORY` in CI, else the checkout's `origin` when it is on GitHub,
else `--github <owner/repo>`. **No repository, no links**: a page with no
links is honest, a page with broken ones is not. `--no-block-actions` turns
them off for a build that should have none.

## Using it as an agent

```sh
# one block's links, to hand a reader
bun run folio-assistant-core/scripts/block-actions.ts --repo <folio> --block prose:1-1-4-a8e0b3
# every block's, as JSON
bun run folio-assistant-core/scripts/block-actions.ts --repo <folio>
```

When someone in a chat says "this paragraph is wrong", give them the block's
**feedback** link, not the repository's issue page, and the **edit** link if
they can propose the wording themselves.

## What not to do

- Do not point [edit] at the frozen review version under `library/`. Comments
  cite it, so it is never edited; the folio's blocks are.
- Do not point [edit] at the staging branch. An edit is a proposal to the
  published text, so it starts from `main`; a different branch is an explicit
  `--edit-branch`.
- Do not hand-write issue URLs in a folio's pages. They drift when a block is
  renamed; the build recomputes them from the manifests every time.
