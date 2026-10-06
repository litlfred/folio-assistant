---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Rendered impact'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/rendered-impact.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/rendered-impact.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/rendered-impact.md){: .fa-edit-source }

{% raw %}
# Rendered impact — which rendered files a Change Set changes

> Skill id: `rendered-impact` · Package: `sdlc-core` · Bean: `bnjs` · Epic: `q4jm` · Issue #971

A Change Set's PR is approved against **what it does to the rendered site**,
not only against its source diff. A one-line FSH edit can re-render one page
of 722 or all of them, and a reviewer cannot tell which from the diff. So
every renderer answers one question, and the PR shows the answer.

## The owner's rulings this follows

- 2026-10-06: *"for a Change Set ... and Issue -> create PR with change set.
  see a list of rendered justthedocs files (fhir IG, whatever) that changed
  due to the described changeset. use that as part of review process of
  changeset PR approval."*
- 2026-10-06: *"each renderer should be able to give you from list of input
  changed files, the list of output changed rendered files ... from the
  dependency cone"*.
- 2026-10-06: the public-comment Change Set (`changeset/1.0.0`) is the Change
  Set for ANY folio change, and the rendered list is one of its fields.
- 2026-10-06: *"original stays in library/ ... materialized to folio/ to make
  changes on"*. A Change Set applies to the materialised folio, never to the
  library source.

## The contract: `rendered-impact/v1`

Declared in `cat-harness/schemas/rendered-impact.ts`. A renderer takes the
changed input files and returns:

| field | says |
|---|---|
| `files[]` | each rendered file the change alters: `path` in the built site, `change` (changed, added, removed), `role` (content, data, index) and `via`, the chain that reached it |
| `files[].anchors` | for a page that assembles many units (a document page), the fragment ids the change alters; the review list links `path#anchor` |
| `undetermined[]` | each input the renderer could NOT place, with its reason, and `scope: all` when it can change any page |
| `method` | `cone` (predicted before a build) or `build-diff` (measured after one) |

Three rules, each one a refusal:

1. **Could-not-determine is never "no change".** An empty `files` with a
   non-empty `undetermined` is "not known", and the PR says so in those
   words. A renderer that drops an input it cannot map is broken.
2. **Index files are listed and marked, not dropped.** The reviewer's list
   (`reviewList`) leaves out `role: index` (search data, sitemaps, an
   artefact index) because the owner reviews content, not indexes. The
   renderer marks the role; the reader filters.
3. **A page whose bytes do not change can still change.** An AST artefact
   page loads its resource in the browser, so the cone names the page AND
   its data file, and a build diff sees only the data file. That is
   `unconfirmed`, not a defect.

## Checking a prediction: the one comparison that matters

`comparePrediction(predicted, measured)` sorts every file into three groups:

- **`missed`**: the build changed it, the cone did not predict it. **A cone
  defect, never a pass.** Report it on the PR and fix the renderer: the next
  Change Set relies on the same cone to tell the reviewer what to open.
- **`confirmed`**: predicted and measured.
- **`unconfirmed`**: predicted, not measured. Expected for content pages that
  load their data (rule 3). For anything else it means the cone is too wide:
  it is safe, but say so.

## The renderers today

| renderer | maps | how | status |
|---|---|---|---|
| `fhir-ig-pages` | `.fsh`, `.cql`, `input/pagecontent/*.md` | `fsh-cone` forward cone → SUSHI's `fsh-index.json` → AST artefact page + served JSON; a page → itself and every page that includes it | in the FHIR layer, documented with its AST tooling (`skill_fetch ig-ast-delta`) |
| `document-site`, `public-comment-site` | a block, a document/chapter/section manifest, `media/*`, the public-comment store | loaded from the published `changeset.json` (each changed block's label and file) and `outline.json` (the documents), never from source: a block lands on its document's page, anchored at its label (`anchors`); a file no builder of the site reads is an input with no page: each builder in the folio's build command exports `siteReads` (the folio; the comment store; every directory of a typology holding a kind it renders), and a file outside all of them, the submodules, `.github/` and the root's non-Markdown files reaches nothing — so `beans/` reaches no page, while `todos/`, whose pages are rendered, still may. A step that exports no `siteReads` excludes nothing; never decide it from the instance's declaration, which also declares what no builder reads | in the document layer, with the ChangeSet Tool |
| `docs-site` | any file | a file in the COMPOSED Jekyll tree (`docsLayers`, `composedInstances`) → its page (permalink, or `.md` → `.html`) or asset; an include → the pages that include it, transitively; `_data` → the pages and includes that read it; a layout, a THEME include (read from the installed theme; unreadable means every include) or an include nothing calls → any page; any page change → the search index; a file outside the tree → `undetermined` when the staging cone carries any directory, nothing when it reaches none | `cat-harness/scripts/docs-rendered-impact.ts` |

**Measured on the docs-site renderer** (this repository's site, two local builds, 2026-10-06): a page, a data file read through an include, an include, a stylesheet and a script gave 8 predicted files and 8 measured. 7 were confirmed. The 1 miss differs between two builds of the same commit anyway (where QA data was fetched from), and 1 unconfirmed page includes the changed include behind a Liquid condition. Two builds of one commit first differed in 826 files, every one by a `?v=<build time>` cache-buster. So `diffBuiltSites` blanks `BUILD_STAMPS` before hashing; without that, every page reads as missed.

**Measured on the FHIR renderer** (a real IG, bean `c65n`):
- An FSH edit to one PlanDefinition gave 4 predicted files and 3 measured: 0 missed, and 1 unconfirmed (the artefact page, rule 3). It took 0.34 s, against 165 s for SUSHI.
- A page edit gave 2 predicted and 2 measured: an exact match.

A renderer's command line belongs to the layer that owns it; this layer
names none above it.

## In the review process

`content-change-review.bpmn`:

- **Produce**: the staging build writes `rendered-impact.json` beside the
  preview and puts the review list in the PR comment. Each entry links to
  the preview and to `main`'s copy of the page.
- **Read**: at *Compare main vs staging*, the reviewer opens every file on
  the review list, not only the pages the author mentions. Use
  [`before-after-preview`](before-after-preview.md) for the pairs, and
  [`visual-diff`](visual-diff.md) for figures.
- **Measure**: the staging job diffs its build against `main`'s published
  site (`measure-rendered-impact.ts`, before the banner goes on) and writes
  `rendered-measured.json`: what changed, and what the prediction MISSED.
  Only when that site was built from the PR's base does it count
  (`status: known`); otherwise main's own changes would read as misses
  (`not-base`). No published main site, no file: "not measured", never
  "nothing missed".
  The review page shows it under the list, as the PR comment does: a run
  started by dispatch finds its PR from the branch, so the comment is not
  lost when no `pull_request` event started the run (bean `ehh6`).
- **Gate**: `review-coverage-gate.dmn` reads three page counts beside the
  block counts, each with a status fact so an uncomputed count is never 0:
  - `unreviewedPages`: review-list files nobody has reviewed at their
    current pin. A page is reviewed by a `page:` verdict, or block by block
    when every block anchored on it has a verdict; a data file goes with a
    reviewed page that shares its pin.
  - `undeterminedInputs`: inputs no renderer placed, until an `input:`
    verdict or waiver (with a reason) says somebody looked.
  - `missedPages`: measured but not predicted, until a `page:` verdict.

  A pin is the hash of the git blobs of the changed inputs on a file's
  `via` (`pinImpact`), never the built bytes, which carry a per-build
  banner. An edit after review reopens exactly the pages it touched.
  The tag is in [`review-comments`](review-comments.md).

## Adding a renderer

1. Map each input kind the renderer reads to the rendered files it writes,
   through the dependency information the renderer ALREADY has. Never
   re-derive a mapping the renderer's own tool records (SUSHI's `fsh-index`
   is the authority for FSH → resource).
2. Put every other input in `undetermined`, unless the renderer cannot read
   it at all: then it is an input with no file. Decide that from what the
   instance declares, never from a list of names here.
3. Test it against a real build with `comparePrediction`: 0 missed is the bar.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Content Change and Review](../../processes/content-change-review.html) | Compare main vs staging; Slice the change and assign reviewers; Comment staging URL on PR |

