---
name: rendered-impact
description: >-
  The list of rendered files a Change Set alters, and how a reviewer approves
  against it. Each renderer maps the input files a change touched to the
  rendered files of its site through its dependency cone, before any build;
  a build diff then confirms the prediction. Use when opening or reviewing a
  Change Set PR, when asked "which pages does this change", when a
  prediction and a build disagree, or when adding a renderer.
user_invocable: true
allowed-tools: Read Grep Glob Bash
---

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
| `fhir-ig-pages` | `.fsh`, `.cql`, `input/pagecontent/*.md` | `fsh-cone` forward cone → SUSHI's `fsh-index.json` → AST artefact page + served JSON; a page → itself and every page that includes it | `fhir-harness/scripts/ig-rendered-impact.ts` |
| document folio | blocks | block ChangeSet (`folio-changeset/v1`) → page anchors | to do (bean `bnjs`) |
| docs site | any file | `staging-cone.ts`, refined from directories to pages | to do (bean `bnjs`) |

**Measured on the FHIR renderer** (smart-immunizations, bean `c65n`):
- An FSH edit to one PlanDefinition gave 4 predicted files and 3 measured: 0 missed, and 1 unconfirmed (the artefact page, rule 3). It took 0.34 s, against 165 s for SUSHI.
- A page edit gave 2 predicted and 2 measured: an exact match.

```sh
bun run fhir-harness/scripts/ig-rendered-impact.ts --ig <IG root> --base origin/main --head HEAD \
  [--ast <output-ast>] [--site-prefix <instance>] --out rendered-impact.json
```

## In the review process

`content-change-review.bpmn`:

- **Produce**: the staging build writes `rendered-impact.json` beside the
  preview and puts the review list in the PR comment. Each entry links to
  the preview and to `main`'s copy of the page.
- **Read**: at *Compare main vs staging*, the reviewer opens every file on
  the review list, not only the pages the author mentions. Use
  [`before-after-preview`](before-after-preview.md) for the pairs, and
  [`visual-diff`](visual-diff.md) for figures.
- **Gate**: the coverage gate counts every review-list page that has no
  verdict, as it counts unreviewed blocks. Two cases block approval until a
  person waives them with a reason: any `missed` file, and any
  `undetermined` input with `scope: all`.

## Adding a renderer

1. Map each input kind the renderer reads to the rendered files it writes,
   through the dependency information the renderer ALREADY has. Never
   re-derive a mapping the renderer's own tool records (SUSHI's `fsh-index`
   is the authority for FSH → resource).
2. Put every other input in `undetermined`.
3. Test it against a real build with `comparePrediction`: 0 missed is the bar.
