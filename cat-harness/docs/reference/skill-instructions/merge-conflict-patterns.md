---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Merge-conflict patterns'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/merge-conflict-patterns.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/merge-conflict-patterns.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/merge-conflict-patterns.md){: .fa-edit-source }

{% raw %}
# Merge-conflict patterns — what a merge may resolve on its own

`bun run merge:main` is the command; `processes/sdlc/merge-base.bpmn` is the
process it executes, called from `Task_PrepareMerge` in
`code-change-review.bpmn`. The patterns themselves are data in
`cat-harness/scripts/merge-conflict-patterns.ts`. This page says what each one
is FOR, so a reader can tell a deliberate refusal from a gap.

## Why this exists

Measured 2026-09-30 over 300 `main`-into-branch merges on `origin/claude/*`
(bean `y7b3`, issue #1707): **235 conflicted, and 147 (63 %) conflicted only on
generated files.** Every one of those resolves the same way — take the base's
copy, regenerate — and each cost an agent a round and the PR another CI run.
Owner, 2026-10-01: *"1 + new skills/tools for each common churn/conflict
pattern"*, and *"put in merge process bpmn"*.

## The two rules that make it safe

1. **All or nothing.** Every conflicted path is classified before anything is
   touched. One refusal ABORTS the merge and restores the tree. Resolving nine
   generated files and leaving one authored conflict half-done reads as
   progress, and is not.
2. **Proved, not assumed.** After resolving, `bun run regen` asks every check
   the CI workflow runs and runs each stale one's writer until the tree
   settles. Anything `unrepaired` aborts the merge. No pattern names its own
   check: the gate set is derived from the workflow and cannot drift, a
   hand-kept list of check names can.

A path that **no** pattern names is refused. Adding automation is adding a
pattern, deliberately, with its reason — never widening a glob on a hunch.

## The patterns

Counts are conflicted files in the 2026-09-30 measurement.

### `kg-qa-sidecar` — delegated (53)

`**/test/results/kg-qa/**`. A kg-audit sidecar can carry an attestation that
an earlier run or a person recorded, which no generator reproduces.
`qa:resolve-conflicts` reads git's stages and refuses such a file, so this
pattern hands over rather than taking either side. Listed FIRST: these paths
are also under `test/results/`, and falling through to `take-base` would drop
a recorded adjudication silently.

### `kg-qa-manifest` — take the base, regenerate

`**/test/results/**/kg-qa.manifest.json`. One per instance (hosted ones one level deeper), holding only the
auditor's script hash, so any change to `kg-audit.ts` restamps every one at
once. Not in the first measurement's top list; found when a replay of 40 real
merges refused one merge on these files alone. It holds no attestation, unlike
the sidecars it indexes.

### `qa-results` — take the base, regenerate (292)

`**/*.qa-results.json`. Whole-artefact QA results, rewritten whole by their
producer. They carried `updated_at` until #1714; they still change whenever
any finding does.

### `derived-results` — take the base, regenerate (142)

LSI indexes, detangle sidecars and tool-run records under `test/results/`.
Recomputed from the whole corpus, so any concurrent skill or schema change
touches them.

### `docs-auto` — take the base, regenerate (352)

The generated docs index pages, already `-merge` in `.gitattributes`. One page
per directory, so a new file anywhere changes one.

### `uml` — take the base, regenerate (201)

Generated overview diagrams and their SVGs.

### `glossary` — take the base, regenerate (207)

The generated glossary and LSI pages: whole-corpus aggregates where concurrent
term additions always collide.

### `translated-glossary` — take the base, regenerate

`cat-harness/docs/{ar,es,fr,ru,zh}/glossary/index.md`. The per-locale glossary
pages `glossary-page.ts` writes whole beside the English one (`check:glossary`),
so they collide exactly when it does. Not in the first measurement; found
2026-10-01 when a `merge:main` on #1754 refused on all five. Only the glossary
page is named: the rest of each locale directory is authored translation, and
a locale no generator writes (`de/`) is refused.

### `viewer-pages` — take the base, regenerate

`docs/external-schemas/index.md`, `docs/methodologies/index.md`,
`docs/processes/*.md`, `docs/qa/index.html` and
`docs/translation-status/index.html`: whole-file viewer pages, each with its
writer's `--check` in the CI workflow (`external-schemas:viz`,
`methodologies:viz`, `processes:viz`, `state:visualizer`,
`translation:status`). A new schema, diagram or translation anywhere rewrites
them. Found the same way, on the same merge.

It also holds `state:visualizer`'s other pages, `docs/{beans,todos,health,
issue-marks,swimlane-glossary,uploads}/index.html`, each headed "Generated by
scripts/state-visualizer.ts". **`docs/uploads/index.html` is the viewer OF
`uploads/`, not an upload** — before 2026-10-01 the `uploads` refusal's
`**/uploads/**` caught it, and #1764 refused on it. First match wins, so the
viewer entries sit above the refusal.

### `viewer-namespace` — take the base, regenerate

`docs/cat-harness/{catalogue,folio,library,schemas,uploads,voices}/**`: the
pages `gen-library-viz`, `gen-folio-viz` and `gen-schema-viz` place through
`viewerPlacement`, each rewritten whole from the corpus and checked by its
`:viz --check`. Same false positive as above: its `uploads/` pages render
uploads rather than being them (#1775). `docs-auto/` under the same prefix
keeps its own `docs-auto` entry.

### `navbar-include` — take the base, regenerate

`docs/_includes/generated/**`: the navbar/footer include written whole by
`gen-navbar-include.ts` (`navbar:include --check`). Any new page, graph or tile
rewrites it. Its authored neighbours in `docs/_includes/` stay refused.

### `viewer-nav-qa` — take the base, regenerate

`test/results/viewer-nav/viewer-nav.qa.json`: `check-viewer-nav`'s mechanical
layout verdict over every viewer page. Recomputed from the pages, and it
carries no reviewer's attestation — unlike a kg-qa sidecar, which is why it is
not delegated to `qa:resolve-conflicts`.

### `handler-index` — take the base, regenerate

`docs/cat-harness/published-graphs.md`, the handler's index of every published
graph and declared viewer, written whole by `gen-handler-index.ts`
(`handler:index:check`). Any new graph or viewer rewrites it. Found on #1754's
third merge, 2026-10-01.

### `health-report` — take the base's measurement

`test/health/results/*.health-report.json`. Not a derivation of the tree but a
**measurement** of external state (publish branch, clone size, the work plan),
written by `bun run health` and refreshed daily on the base by the
health-check workflow, so the base's copy is simply the newer measurement and
a branch's older one carries nothing worth keeping. `check:harness-state`
judges its producer hash; if the merge changed the producer, `bun run health`
rewrites it. Found on the same merge.

### `qa-witnesses` — take the base, regenerate

`test/results/witnesses/**`: witness projections (`qa-witness/v1`) and page
verdict indexes, written by `gen-docs-pages.ts` from the kg-qa sidecars and the
live subject. A projection, never an attestation — the sidecars it reads are
the delegated `kg-qa-sidecar` family — and the docs-site build regenerates them
at publish. Found on #1754's eighth merge, 2026-10-01.

### `pot-templates` — take the base, regenerate

`translations/**/*.pot`: gettext templates extracted from the English pages by
`pot-for-pages.ts` (`translation:pot:check`), so every edit to a source page
rewrites its template in every locale. The `.po` files beside them are
**authored translations** and stay refused. Found on the same merge.

### `site-data` — take the base, regenerate (36)

Generated site data indexes under `docs/assets/**/*.json` and `docs/_data/`.

### `readme-generated-regions` — hunk by hunk (209)

Directory READMEs mix authored prose with generated regions
(`<!-- kg:subgraph:begin -->` … `:end -->`) whose file counts and listings
change on every concurrent addition. A hunk **inside** a region takes the
base's side and the generator rewrites the region; a hunk in authored prose,
or one that moves a region boundary, **refuses**. The file-count churn
(`beans/README.md`, 76 alone) is resolved here rather than by changing what
the README shows — the owner kept the exact counts (#1707).

### `beans` — refused, by declaration (44)

Bean definitions are authored work-plan state. Two sessions editing one bean
is a coordination question (`bean-coordination`), and a duplicated
`updated_at` from a careless resolution is `check-bean-front-matter`'s
recorded defect.

### `uploads` — refused, by declaration (30)

Uploaded source material: provenance-bearing input, never regenerated.

## Adding a pattern

1. Measure first: replay recent merges with `git merge-tree --write-tree` and
   look at what the conflicting **lines** are, not just which files.
2. Add an entry with its `why` and the narrowest glob that covers it. Order
   matters: the first match decides.
3. Add a test that the unsafe neighbour is refused, not only that the case
   resolves.
4. Add a section here.

## In CI — opt in with the `merge-main` label

`.github/workflows/merge-main.yml` is a second CALLER of the same command,
never a second resolver (bean `d33q` part B). When `main` moves, it runs
`bun run merge:main` on every open, same-repository PR labelled `merge-main`
that is behind `main`, one live run per PR (a newer run cancels an older one).

- **It pushes only a proved merge**, as a fast-forward of the branch it checked
  out; if the author pushed meanwhile the push is rejected and nothing is
  overwritten.
- **A refusal pushes nothing**, labels the PR `needs-merge-human`, and lists
  the ✗ paths. Adding a pattern stays a person's change, made here.
- **One comment per PR, edited in place** on every run.
- **The merge commit is still judged by CI**: pushed with `MERGE_MAIN_TOKEN`
  when that secret exists, otherwise followed by a dispatch of
  `code-quality-gates.yml` on the branch, because a GITHUB_TOKEN push triggers
  no workflow.

Why it is worth a runner: on #1754 (2026-10-01) one round took 19–46 min in a
shared agent container while `main` moved every few minutes, and GitHub runs no
`pull_request` CI on a conflicted PR — a 28-conflict resolution went 'dirty'
again within a minute of its push. Use the label on a PR that is waiting on
review rather than on its author; leave it off a branch somebody is pushing to.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Merge the base branch in](../../processes/merge-base.html) | Classify every conflicted path against the declared patterns; Resolve each by its declared strategy; Abort, restore the tree, list what was refused |

