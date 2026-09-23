---
# folio-assistant-5uuf
title: 'FOLIO PREVIEW BEFORE-SIDE: no main-site publish, so before pictures and ''view on main'' are empty; stacked PRs compare with the wrong base'
status: todo
type: bug
created_at: 2026-09-23T18:06:56Z
updated_at: 2026-09-23T18:06:56Z
parent: folio-assistant-q4jm
---

Found by ojcx's real run, 2026-09-23 (litlfred/folio-test#6). The visual diff's "before" picture, and the review page's "view on main" link, both read the published main site at the root of `gh-pages`. Two gaps follow:
- **A folio has no main-site publish.** Neither `init-folio` nor `folio-staging.yml` publishes `main`'s document site to the `gh-pages` root. So every before picture reads *"Its page is not in the published site"*, and the "view on main" link 404s.
- **A stacked PR is compared with the wrong "before".** Its ChangeSet uses the PR's base branch (`base_ref`), but its pictures use the main site. The two disagree.

## Done when
- [ ] a folio's `main` builds and publishes its document site to the `gh-pages` root (a push-to-main job, written by `init-folio`), so the before side exists
- [ ] for a PR whose base is not `main`, the before side is that branch's preview (`STAGING/<base-slug>/`) when it exists, and the page says which one it used
