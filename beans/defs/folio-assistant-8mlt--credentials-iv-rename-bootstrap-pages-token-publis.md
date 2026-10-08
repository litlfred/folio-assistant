---
# folio-assistant-8mlt
title: 'CREDENTIALS (iv): rename BOOTSTRAP_PAGES_TOKEN -> PUBLISH_SITE_BOOTSTRAP (bootstrap-tools) and MERGE_MAIN_TOKEN -> PUSH_BRANCH_TRIGGERING_CI (merge-main.yml)'
status: todo
type: task
created_at: 2026-10-02T06:31:23Z
updated_at: 2026-10-02T06:31:23Z
parent: folio-assistant-5a3l
blocked_by:
    - folio-assistant-vobp
---

From the proposal cat-harness/docs/proposals/credentials-needs-and-supply.md §4.3 (D2=A). Edit the secret references and the error and help messages in bootstrap-tools/.github/workflows/publish-bootstrap.yml and .github/workflows/merge-main.yml. With the App (D1=A), add the create-github-app-token mint step and expose the job variable under the capability name. Both secrets are unset, so the rename breaks nothing. An agent creates no secret; the owner does that through the secrets skill.

## Done when
- [ ] neither old name appears in any workflow
- [ ] the owner has created the App or the secret, and publish-bootstrap.yml runs green once
