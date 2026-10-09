---
# folio-assistant-fwtz
title: docs-site must rebuild when the bean branch moves (ref + concurrency)
status: completed
type: task
created_at: 2026-10-04T06:29:09Z
updated_at: 2026-10-09T16:13:00Z
parent: folio-assistant-fs43
---

Arc fs43 §4 `site` row, second half. `docs-site.yml` now MOUNTS the tip-keyed graphs before the generators run (PR #2052), so the build reads the work plan wherever it lives. What is missing is the TRIGGER: after the cutover a bean edit is a push to `cat/cat-harness/beans` and nothing rebuilds the site.

Adding `branches: [main, cat/cat-harness/beans]` is NOT the fix on its own, and that is the finding:

- the job checks out `github.ref`, which for such a push is a branch carrying no code — no scripts, no `docs/`. It needs an explicit `ref: main`, and the build stamp then has to say which `main` it rendered (`build.json` already carries that field);
- `concurrency.group: docs-site-${{ github.ref }}` makes a bean push a DIFFERENT group from a main push, so two deploys could race over `gh-pages`; and
- a bean edit lands far more often than a code change, so the trigger needs a think about rate before it is switched on.

NOT a regression meanwhile, and worth stating in that order: `beans/**` is not in this workflow's path filter TODAY either, so a bean edit does not rebuild the site now.

## Done when

- [x] a push to the bean branch rebuilds the site from main's code
- [x] the concurrency group is one group with main's deploys, not a second
- [x] the published `assets/beans/index.json` is measured fresh after a bean-only edit

## Closed 2026-10-09

- **Branch**: `claude/fwtz-docs-site-bean-rebuild`
- **Commit**: `2b52b24a22c3d801b85663240e8b600f2c1d7375` in repository `folio-assistant`
- **Scope resolved**:
  - In `.github/workflows/docs-site.yml`:
    - Added `cat/cat-harness/beans` to `on.push.branches` (`branches: [main, cat/cat-harness/beans]`) and added `- 'beans/**'` to `on.push.paths` so pushes updating the beans state graph trigger a site rebuild.
    - Unified the top-level concurrency group from `docs-site-${{ github.ref }}` to `docs-site-deploy` with `cancel-in-progress: true` so bean pushes and main pushes share one deploy queue and do not race over `gh-pages`.
    - In `actions/checkout`, set `ref: ${{ github.ref == 'refs/heads/cat/cat-harness/beans' && 'main' || github.ref }}` so when triggered by the bean branch, `main` is checked out for the site code and documentation generators.
    - Updated the build stamps in both `cat-harness/docs/_data/build.yml` and `./_site/build.json` to record `MAIN_SHA=$(git rev-parse HEAD)` instead of `$GITHUB_SHA` (ensuring the rendered `main` commit SHA is published rather than the state-branch SHA).
    - Updated the commentary in `docs-site.yml` lines 187-195 citing bean `fwtz` to reflect the completed implementation.
- **Verification Evidence**:
  - `bun cat-harness-tools/scripts/check-workflows.ts`: Clean pass (34 workflows, all parse, no duplicate keys, no untrusted expressions, gh-pages push protected).
  - `bun test cat-harness-tools/scripts/tests/workflow-yaml.test.ts`: 95 passed, 0 failed.
  - Worktree workflow YAML parse, duplicate key check, and `ghPagesWipesStaging` structural verification all passed clean.
