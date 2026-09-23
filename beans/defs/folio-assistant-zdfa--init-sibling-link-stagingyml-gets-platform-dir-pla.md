---
# folio-assistant-zdfa
title: 'INIT SIBLING LINK: staging.yml gets platform_dir ../platform, outside the Actions checkout; a subfolder folio''s workflow lands where GitHub never reads it'
status: todo
type: bug
created_at: 2026-09-23T18:06:56Z
updated_at: 2026-09-23T18:06:56Z
parent: folio-assistant-q4jm
---

Found by ojcx's real run, 2026-09-23. `init-folio --link sibling --assistant ../platform` writes `platform_dir: ../platform` into `.github/workflows/staging.yml`. In Actions, that path is outside the checkout, so the reusable workflow's "Check out the platform" step cannot place the platform there. A sibling checkout exists on the author's machine, never in CI. The folio-test run worked only because the caller was hand-written with `platform_dir: platform`.

A related problem: a folio scaffolded into a SUBFOLDER gets its workflow at `<sub>/.github/workflows/`, which GitHub never reads.

## Done when
- [ ] for `--link sibling`, the written caller checks the platform out inside the workspace, and the builder shim resolves to it in CI as well as locally
- [ ] scaffolding into a subfolder of an existing repository writes the caller at the repository root, or says clearly that it cannot
- [ ] a test covers both cases
