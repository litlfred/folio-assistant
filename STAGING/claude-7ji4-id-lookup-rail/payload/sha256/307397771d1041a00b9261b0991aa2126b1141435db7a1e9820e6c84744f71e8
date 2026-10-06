---
# folio-assistant-fwtz
title: docs-site must rebuild when the bean branch moves (ref + concurrency)
status: todo
type: task
created_at: 2026-10-04T06:29:09Z
updated_at: 2026-10-04T06:29:09Z
parent: folio-assistant-fs43
---

Arc fs43 §4 `site` row, second half. `docs-site.yml` now MOUNTS the tip-keyed graphs before the generators run (PR #2052), so the build reads the work plan wherever it lives. What is missing is the TRIGGER: after the cutover a bean edit is a push to `cat/cat-harness/beans` and nothing rebuilds the site.

Adding `branches: [main, cat/cat-harness/beans]` is NOT the fix on its own, and that is the finding:

- the job checks out `github.ref`, which for such a push is a branch carrying no code — no scripts, no `docs/`. It needs an explicit `ref: main`, and the build stamp then has to say which `main` it rendered (`build.json` already carries that field);
- `concurrency.group: docs-site-${{ github.ref }}` makes a bean push a DIFFERENT group from a main push, so two deploys could race over `gh-pages`; and
- a bean edit lands far more often than a code change, so the trigger needs a think about rate before it is switched on.

NOT a regression meanwhile, and worth stating in that order: `beans/**` is not in this workflow's path filter TODAY either, so a bean edit does not rebuild the site now.

## Done when

- [ ] a push to the bean branch rebuilds the site from main's code
- [ ] the concurrency group is one group with main's deploys, not a second
- [ ] the published `assets/beans/index.json` is measured fresh after a bean-only edit
