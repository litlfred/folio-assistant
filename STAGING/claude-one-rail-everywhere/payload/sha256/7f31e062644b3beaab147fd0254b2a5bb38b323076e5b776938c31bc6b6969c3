---
# folio-assistant-8mlt
$schema: bean/1.0.0
title: 'CREDENTIALS (iv): rename BOOTSTRAP_PAGES_TOKEN -> PUBLISH_SITE_BOOTSTRAP (bootstrap-tools) and MERGE_MAIN_TOKEN -> PUSH_BRANCH_TRIGGERING_CI (merge-main.yml)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T06:31:23Z
updated_at: 2026-10-11T06:52:45Z
parent: folio-assistant-5a3l
blocked_by:
    - folio-assistant-vobp
---

From the proposal cat-harness/docs/proposals/credentials-needs-and-supply.md §4.3 (D2=A). Edit the secret references and the error and help messages in bootstrap-tools/.github/workflows/publish-bootstrap.yml and .github/workflows/merge-main.yml. With the App (D1=A), add the create-github-app-token mint step and expose the job variable under the capability name. Both secrets are unset, so the rename breaks nothing. An agent creates no secret; the owner does that through the secrets skill.

## Done when
- [x] neither old name appears in any workflow (folio-assistant#2532, bootstrap-tools#17)
- [ ] the owner has created the App or the secret, and publish-bootstrap.yml runs green once

## Progress (lane A, 2026-10-10)

PRs: folio-assistant#2532 (merge-main → PUSH_BRANCH_TRIGGERING_CI) and bootstrap-tools#17 (publish-bootstrap → PUBLISH_SITE_BOOTSTRAP). Each mints from the harness App when vars.HARNESS_BOT_ID is set, else reads a secret of the capability name. Follow-up: cat-harness-tools check-head-has-run.ts advice text + its test still name MERGE_MAIN_TOKEN. Remaining owner step: create the App (cat-harness skill 'secrets', #113) so publish-bootstrap runs green once.

## Progress (2026-10-11)

Follow-up merged: cat-harness-tools#93 (check-head-has-run advice + test name the harness App / PUSH_BRANCH_TRIGGERING_CI). Remaining: folio-assistant#2532 (merge-main rename; waits on #2529) and the owner creating the App.
