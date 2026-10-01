---
# folio-assistant-63es
title: 'DEPLOY-ONLY CHECKS: a built-site check that runs only on main lets a PR stay green and break every publish'
status: in-progress
type: bug
created_at: 2026-10-01T06:31:51Z
updated_at: 2026-10-01T06:31:51Z
parent: folio-assistant-o3xy
---

Follow-on to #1726 / #1730. Owner 2026-10-01: build the early catch.

check:escaped-markup and check:maintained-artefacts ran only in docs-site.yml (the main deploy). A code span wrapped so a line began '<slide>' (introduced in #1615) broke every publish for ~6h while each PR's 'stage' stayed green.

## Measured
- Ran both checks on real staging trees from gh-pages: pass on this branch, #1615 and #1716 trees; check:escaped-markup FAILS on #1687's preview tree (built while main had the bug), on exactly reference/skill-instructions/library-ingestion.html. So staging does build the page when reference/ is carried, and the check in 'stage' would have caught it.
- check:invocation-parity (already gated) compares preview vs deploy, but matched script PATHS only; both checks are invoked by NAME, so they were invisible to it.

## Fix
- feature-staging.yml runs both checks after the mount, beside check:duplicate-ids.
- check-invocation-parity counts 'bun run check:<name>' as an obligation. Reproduced: with the old staging workflow the gate fails naming exactly the two checks; with the fix it passes.

## Done when
- [x] both checks run in stage
- [x] parity gate covers named checks, falsified against the old workflow
- [ ] PR green and merged
