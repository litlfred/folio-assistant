---
# folio-assistant-zdfa
title: 'INIT SIBLING LINK: staging.yml gets platform_dir ../platform, outside the Actions checkout; a subfolder folio''s workflow lands where GitHub never reads it'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-23T18:06:56Z
updated_at: 2026-09-24T19:19:05Z
parent: folio-assistant-q4jm
---

Found by ojcx's real run, 2026-09-23. `init-folio --link sibling --assistant ../platform` writes `platform_dir: ../platform` into `.github/workflows/staging.yml`. In Actions, that path is outside the checkout, so the reusable workflow's "Check out the platform" step cannot place the platform there. A sibling checkout exists on the author's machine, never in CI. The folio-test run worked only because the caller was hand-written with `platform_dir: platform`.

A related problem: a folio scaffolded into a SUBFOLDER gets its workflow at `<sub>/.github/workflows/`, which GitHub never reads.

## Done when
- [ ] for `--link sibling`, the written caller checks the platform out inside the workspace, and the builder shim resolves to it in CI as well as locally
- [ ] scaffolding into a subfolder of an existing repository writes the caller at the repository root, or says clearly that it cannot
- [ ] a test covers both cases



## Progress (2026-09-24)
- Sibling link: `folio-staging.yml` (stage and publish-main) now resolves `platform_dir`. A path outside the workspace is checked out at `.folio-platform` inside it, then symlinked to the named path, so the shim and build command resolve the same in CI as locally. The written caller is unchanged. Tested by running the workflow's own step scripts (`folio-staging-platform.test.ts`).
- Subfolder: `init-folio` detects an enclosing repository. It writes no staging workflow there and says why in its notes (the reusable workflow builds from the repository root). It also no longer runs a nested `git init`.
- Not done, possible follow-up: supporting a folio BELOW the repository root would need a `folio_root` input threaded through every step (paths, the ChangeSet's `git archive`, and the pages checkout).
