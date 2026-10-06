---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Block actions: [edit] and [feedback] on every block'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-core/skills/content/folio-document-adapter/block-actions.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/skills/content/folio-document-adapter/block-actions.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-core/skills/content/folio-document-adapter/block-actions.md){: .fa-edit-source data-fa-link="edit" data-src="folio-assistant-core/skills/content/folio-document-adapter/block-actions.md" data-repo="litlfred/folio-assistant" }

{% raw %}
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

## Every issue is coded with its content

[feedback] codes the issue with the slug of the document it came from: the
title reads `Feedback [dpi-h-ra]: <section> — <block>` and the body opens with
`**Content:** \`dpi-h-ra\``. A folio with several documents, or a repository
that takes issues about more than one thing, can then sort feedback by what it
is about without opening it. The code is in the **title** rather than only a
label because GitHub silently drops a prefilled label when the reporter has
no triage rights, and most public reviewers do not (owner, 2026-10-06:
*"plain issues + coding for content slug"*).

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
| `content` | the document's slug, the code the issue is triaged by |

A form may declare any subset, and fields it does not declare are not sent.
Add the questions you want answered (what is wrong, a suggested wording, the
reviewer's organisation) as further fields; they are left for the person.

## Where the repository comes from

`GITHUB_REPOSITORY` in CI, else the checkout's `origin` when it is on GitHub,
else `--github <owner/repo>`. **No repository, no links**: a page with no
links is honest, a page with broken ones is not. `--no-block-actions` turns
them off for a build that should have none.

## Two forms of the same links

- **Full** (`blockActionsHtml`): every href written into the page. Used on a
  one-page document and on `index.hydrated.html`, so the links work without
  JavaScript.
- **Compact** (`compactActionsHtml` + `compactActionsScript`): the block's
  facts as data attributes, and the hrefs built in the browser when a pointer
  or focus reaches them. Used on a lazy page's shell, where 933 prefilled
  feedback URLs cost 864 KB. The browser builder, `BLOCK_URLS_JS`, is held
  equal to `editUrl` and `feedbackUrl` by `block-actions.test.ts`; change both
  together or the test fails.

The recipe lives in the harness, `cat-harness/src/core/edit-links.ts`, so
every layer can use it; this package re-exports it. It is published once as
`assets/js/edit-links.js` (held equal to the code by a test). On a page, mark
a link `data-fa-link="edit|source|feedback"` and either give its host the
facts (`data-src`, optional `data-repo`, `data-line`, `data-block`,
`data-sec`) or leave a GitHub `blob`/`edit` href, which the runtime reads the
facts from. Generators that write Markdown use `markdownEditLink`.

Two pages keep their own link on purpose: the public-comment dashboard's
**Discuss** (it opens a change-set discussion, not feedback on a block) and
the bootstrap site's **Improve this page** (`bootstrap-tools` may import
nothing outside itself).

**Any page that shows edit or feedback links uses these,** not a URL of its
own: one recipe, so a change to the issue form or the branch reaches every
page at once (owner, 2026-10-06: *"make sure feedback/edit links are changed
across all harness/visualizers to be dynamic"*).

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
{% endraw %}
