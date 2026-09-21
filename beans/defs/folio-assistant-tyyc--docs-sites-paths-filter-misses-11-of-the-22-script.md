---
# folio-assistant-tyyc
title: 'docs-site''s paths filter misses 11 of the 22 scripts it runs, so a fix to the publisher never rebuilds the site'
status: in-progress
type: task
priority: high
created_at: 2026-09-21T14:12:00Z
updated_at: 2026-09-21T14:30:00Z
parent: folio-assistant-vke6
---

## What

`docs-site.yml` has a `paths:` filter naming eight scripts. It **runs 22**.

Found by consequence, not by audit: `40fl` fixed a `kg-export` defect that had
kept `docs-site` red for over two hours, merged it to `main` — and **no run
fired**. `cat-harness/scripts/kg-export.ts` is not in the filter, so a fix to
the publisher did not rebuild what it publishes. The outage and the silence
after the fix are the same defect seen twice.

Derived over each workflow's own `run:` steps:

| workflow | invoked | uncovered |
|---|---|---|
| `docs-site.yml` | 22 | **11** — incl. `kg-export.ts`, `publish-gh-pages.sh` |
| `feature-staging.yml` | 28 | **14** — the PR previews |
| `jsonld-gen-check.yml` | 11 | **4** — the test files it executes |

`publish-gh-pages.sh` is the deploy itself: the script that ships the site was
not a reason to rebuild it.

## Why the list drifted, and why it was going to

Every entry was added with a comment arguing — **correctly** — that a change to
*that* generator changes the published page while touching nothing under
`docs/`. The reasoning was right each time. A hand-maintained list is edited by
whoever remembers, and **the symptom of forgetting is invisible**: a run that
never fired looks exactly like a run nobody needed. `xom7` in its quietest
form — not a red workflow, an absent one.

`jsonld-gen-check.yml` already carries this argument in its own comments, about
`*/library/**` after `frs5` moved the libraries. It learned it for directories
and never applied it to its scripts.

## The fix

`cat-harness/scripts/**` in all three, plus `*.config.json` in `docs-site`
(the declaration holds `canonicalUrl`, which decides every `@id` the graph
documents mint, and no script path covers it).

A wildcard **over-triggers** — a change to a script a workflow never runs now
rebuilds. That is the cheap direction and it is the trade
[`incremental-render`](../../cat-harness/skills/folio-core/incremental-render.md)
already states: over-declaring costs a needless run, under-declaring serves a
stale page that looks fresh.

`bun run check:workflow-script-paths` holds the line by **deriving** the
invoked set from each workflow's `run:` steps.

## Two things the check refuses to do

**It does not follow imports.** `kg-export.ts` imports a dozen modules; whether
a change to one changes the published bytes is a question about the import
graph. Claiming to check it here would be a broader promise than the evidence
supports. A directory wildcard is the honest way to cover the transitive set.

**It does not read one block per workflow.** The first draft did, and reported
`jsonld-gen-check.yml` clean while four of its scripts were uncovered in
**both** its `push` and `pull_request` blocks — a parser's partial read
reported as a pass. Each trigger gates independently: covered on push and
missing on pull_request is a preview that never builds, which is the half a
reviewer actually looks at.

## Done when

- [x] All three workflows cover the scripts they run
- [x] A gate derives the set rather than listing it, registered in
      `package.json` and `code-quality-gates.yml`
- [x] Third states kept apart: no filter is `unfiltered` (total coverage, not a
      pass), no scripts is `no-scripts`, an empty workflow sweep exits 2
- [x] Falsified — restoring the narrow list turns `docs-site.yml` red
- [x] `docs-site` green on `main` — **observed**, run dispatched against `2d20850562`;
      `check:ci-health` went from *"8 consecutive failure(s)"* to `✓ green`
