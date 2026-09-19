---
# folio-assistant-plj1
title: docs-site.yml publishes gh-pages without keep_files, so every main deploy deletes every open PR's STAGING preview
status: completed
type: bug
priority: normal
created_at: 2026-09-19T08:55:17Z
updated_at: 2026-09-19T09:36:27Z
---


_2026-09-19T08:55:32Z_ — Found while verifying PR #362's staging preview. Not claimed — recording the measurement so it is not lost.

## What was measured, 2026-09-19

`feature-staging.yml` deployed `STAGING/claude-pin-theme-upstream-watch/` at gh-pages commit `11b2415fb` and commented the URL on PR #362. The next `docs-site.yml` deploy, gh-pages `6e4c34f83` ("site from efd9eace"), landed ~5 minutes later and `git ls-tree --name-only 6e4c34f83 | grep -i staging` returns NOTHING. Every STAGING directory on the branch was deleted, for every open PR, not only mine.

## Cause

`peaceiris/actions-gh-pages@v4` replaces the publish branch's contents unless `keep_files: true`. `grep -rl keep_files .github/workflows/` lists five workflows — `lean_ci`, `publish`, `discoverability-docs`, `feature-staging`, `blueprint` — and `docs-site.yml` is NOT among them, while it is the workflow that fires on every push to main touching `docs/`, `skills/workflows/`, `schemas/` or three scripts. So the most frequently-run publisher is the only one that wipes.

## Why it matters more than it looks

This is NOT the `xd1s` / `eoix` race. Those were about two pushes contending for the ref and one being rejected or cancelled — loud, or at least visible as a cancelled check. This is quiet: the staging push SUCCEEDS, the bot comments a URL on the PR, the check run is green, and the artefact is deleted minutes later by an unrelated merge to main. A reviewer clicking the link gets a 404 with nothing anywhere saying why.

The repo's own merge discipline turns on this: AGENTS.md argues at length that a human cannot assess a rendered artefact from a description, and that holding a PR back is worse than merging because staging is where assessment happens. A staging URL with a half-life of one main merge undercuts exactly that.

## Why it was not fixed on sight (superseded below)

`keep_files: true` on `docs-site.yml` is the obvious one-line change and I have NOT made it, because it is not obviously safe: `keep_files` also stops the main site's own deleted pages from ever disappearing, so a renamed or removed doc page would linger indefinitely. The alternative — have `docs-site.yml` restore `STAGING/` explicitly, or exclude that prefix — needs whoever owns the publishing layout to choose. Related: `lx2s` (staging under gh-pages), `xd1s` (the push queue), `g4dv` (staging deep links).

## Fixed 2026-09-19 — carried forward rather than `keep_files`

`docs-site.yml` gains one step, between "Disable Jekyll" and "Publish to gh-pages", that fetches `origin/gh-pages` shallow and extracts `STAGING/` into `./_site` before the publish replaces the branch. The publish still replaces everything else, so a doc page removed from `main` still disappears from the site.

**What decided it.** Re-measured on this branch: `git ls-tree --name-only origin/gh-pages | grep -ci staging` returns **0**, so at the time of the fix every open PR's preview was already gone. And of **eleven** `peaceiris/actions-gh-pages@` publish sites across six workflows, `docs-site.yml` is the only one with `keep_files` absent — which is what made the most frequently-run publisher the only wiping one.

Both routes are sound and they are different designs, so the choice is on the merits rather than on convenience. `keep_files: true` never deletes, which is right for a publisher that owns one subtree; `discoverability-docs`'s three parallel jobs rely on exactly that. `docs-site.yml` owns the site ROOT, so `keep_files` there buys preview survival with permanent stale pages — a renamed doc would linger on the branch forever. Carrying `STAGING/` forward keeps both properties.

**Tested before pushing**, in a synthetic git repo, across the three states the step can meet:

| state | behaviour |
|---|---|
| `gh-pages` with two `STAGING/<slug>/` dirs | both extracted into `_site/STAGING/`, names printed |
| `gh-pages` with no `STAGING/` | `note: gh-pages carries no STAGING/`, exit 0 |
| no `gh-pages` branch at all | `note: no gh-pages branch yet`, exit 0 |

The last two matter because `set -euo pipefail` plus a bare `git cat-file` would have failed the whole publish job on a first-ever deploy. The step only ever ADDS to `_site`; it cannot cause the publish to delete the main site, which is the only failure mode that would be worse than the bug.

**Guarded by a test, and PARSED rather than grepped.** `scripts/tests/workflow-yaml.test.ts` gains "a gh-pages publish either keeps files or carries STAGING/ forward": for every publish step in every workflow it requires `with.keep_files === true` OR a sibling step whose `run` contains `FETCH_HEAD:STAGING`. It reads the parsed step's own `with:`, because the sibling test in that file already records why — "a COMMENT naming the action is not a use of it" — and this fix's own comment block contains the literal `keep_files: true` while the step deliberately does not set it, so a text search would read the fixed file as fixed the other way. `expect(sites).toBeGreaterThan(8)` guards the vacuous green.

Probed by removing the mechanism: 82 pass → 81 pass / 1 fail naming `docs-site.yml:build-and-deploy`. The guard fires.

## What this does NOT fix

It **narrows** the window, it does not close it. A staging deploy that lands between this step's fetch and the publish below is still lost — the same interleaving `xd1s` (the gh-pages push queue) exists for. Recording that here so the next reader does not mistake a narrowed window for a closed one.

Unrelated and pre-existing: `bun run scripts/gen-docs-pages.ts --check` reports **113 stale pages** (`assets/todos/index.json (3 todo(s))`). Confirmed by stashing this work and re-running on clean `main` — exit 1 there too. Not caused by this change and not folded into it; a 113-file regeneration does not belong in a workflow fix.
