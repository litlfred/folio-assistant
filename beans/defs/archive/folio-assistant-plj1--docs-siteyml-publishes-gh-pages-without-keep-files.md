---
# folio-assistant-plj1
title: docs-site.yml publishes gh-pages without keep_files, so every main deploy deletes every open PR's STAGING preview
status: completed
type: bug
priority: normal
created_at: 2026-09-19T08:55:17Z
updated_at: 2026-09-19T10:01:17Z
---


_2026-09-19T08:55:32Z_ — Found while verifying PR #362's staging preview. Not claimed — recording the measurement so it is not lost.

## What was measured, 2026-09-19

`feature-staging.yml` deployed `STAGING/claude-pin-theme-upstream-watch/` at gh-pages commit `11b2415fb` and commented the URL on PR #362. The next `docs-site.yml` deploy, gh-pages `6e4c34f83` ("site from efd9eace"), landed ~5 minutes later and `git ls-tree --name-only 6e4c34f83 | grep -i staging` returns NOTHING. Every STAGING directory on the branch was deleted, for every open PR, not only mine.

## Cause

`peaceiris/actions-gh-pages@v4` replaces the publish branch's contents unless `keep_files: true`. `grep -rl keep_files .github/workflows/` lists five workflows — `lean_ci`, `publish`, `discoverability-docs`, `feature-staging`, `blueprint` — and `docs-site.yml` is NOT among them, while it is the workflow that fires on every push to main touching `docs/`, `processes/`, `schemas/` or three scripts. So the most frequently-run publisher is the only one that wipes.

## Why it matters more than it looks

This is NOT the `xd1s` / `eoix` race. Those were about two pushes contending for the ref and one being rejected or cancelled — loud, or at least visible as a cancelled check. This is quiet: the staging push SUCCEEDS, the bot comments a URL on the PR, the check run is green, and the artefact is deleted minutes later by an unrelated merge to main. A reviewer clicking the link gets a 404 with nothing anywhere saying why.

The repo's own merge discipline turns on this: AGENTS.md argues at length that a human cannot assess a rendered artefact from a description, and that holding a PR back is worse than merging because staging is where assessment happens. A staging URL with a half-life of one main merge undercuts exactly that.

## Not fixing it here

`keep_files: true` on `docs-site.yml` is the obvious one-line change and I have NOT made it, because it is not obviously safe: `keep_files` also stops the main site's own deleted pages from ever disappearing, so a renamed or removed doc page would linger indefinitely. The alternative — have `docs-site.yml` restore `STAGING/` explicitly, or exclude that prefix — needs whoever owns the publishing layout to choose. Related: `lx2s` (staging under gh-pages), `xd1s` (the push queue), `g4dv` (staging deep links).

_2026-09-19T09:40:53Z_ — Fixed on branch `claude/plj1-keep-staging`, PR #377. Chose to RESTORE `STAGING/` into `_site` immediately before the push rather than `keep_files: true`, so the main site keeps delete-on-remove semantics; `scripts/restore-staging.ts` plus a post-push `--verify`, a new `gh-pages-wipes-staging` rule in `check-workflows.ts`, and tests that replay the action's real clone/rm/copy sequence against a real git remote. The action has NO path-scoped retention input — read `action.yml` at v4 to confirm rather than assuming. Residual window: the action re-clones gh-pages itself at push time, so a preview landing in the few seconds between the restore and that clone is still lost — now loud (verify exits 1 naming it) instead of silent.
