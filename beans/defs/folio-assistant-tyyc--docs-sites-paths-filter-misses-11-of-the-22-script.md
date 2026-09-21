---
# folio-assistant-tyyc
title: docs-site's paths filter misses 11 of the 22 scripts it runs, so a fix to the publisher never rebuilds the site
status: completed
type: task
priority: high
created_at: 2026-09-21T14:12:00Z
updated_at: 2026-09-21T22:14:52Z
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

## Closed 2026-09-21 — re-derived, not taken on trust

Every Done-when box was already ticked and the bean was still `in-progress`.
Verified from a clean checkout of `main` at `645dd7dd91` rather than from the
boxes:

- `docs-site.yml` carries `cat-harness/scripts/**` (14 globs), not the eight
  named scripts this bean opened against. Same for `feature-staging.yml` (8)
  and `jsonld-gen-check.yml` (15).
- Coverage re-derived independently, resolving `bun run <name>` through
  `package.json` so a script reached via an npm-script indirection is counted:
  **0 uncovered across all three** (20, 29 and 11 invoked files).
- `bun run check:workflow-script-paths` passes over 39 workflows, and is
  registered in BOTH `package.json:91` and `code-quality-gates.yml:707` — the
  second is what makes it a gate rather than a script somebody may run.
- Its third states are intact in the output: 35 workflows declaring no filter
  are reported as *nothing to under-cover* rather than folded into the pass,
  and one filtered workflow invoking no script is named separately.

**What prompted the check.** This session predicted that merging a change to
`kg-export.ts` would NOT rebuild the site, on this bean's premise. A
`docs-site` run fired on the merge (`645dd7dd91`, run 407). The prediction was
wrong because the premise was stale — which is the bean's own lesson about
hand-maintained lists, arriving from the other direction.
