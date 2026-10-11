---
# folio-assistant-k3ml
title: 'CREDENTIALS (i): secrets skill — add/rotate/revoke per mechanism, GitHub App walkthrough for a personal account'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T06:31:22Z
updated_at: 2026-10-11T05:44:48Z
parent: folio-assistant-5a3l
blocked_by:
    - folio-assistant-vobp
---

From the proposal cat-harness/docs/proposals/credentials-needs-and-supply.md §6.3 (D1=A, the App). Write skills/sdlc/sdlc-core/secrets.md with the human steps per mechanism and the UI paths. Lead with the GitHub App setup on a personal account: register the App, generate its private key, install it on selected repositories, store HARNESS_BOT_ID as a variable and HARNESS_BOT_PRIVATE_KEY as a secret, add the mint step. Agents never handle values (§6.1). Register with skill:register. Not built yet.

## Done when
- [x] the skill exists and is registered (cat-harness#113 merged 3b59170); skill:register:check runs with the next re-pin
- [ ] the App walkthrough has been followed once by the owner without a question

## Progress (lane A, 2026-10-10)

Skill written and registered in the manifest: litlfred/cat-harness#113 (left for review). skill:register at cat-harness/cat-harness-tools main stops at a pre-existing orphan-page finding (skill-instructions/glossary-terms.md, review-comments.md) and re-renders every page in index mode, so generated artefacts ride the next folio-assistant re-pin (#2529). Remaining: merge #113; owner follows the App walkthrough once.

## Progress (2026-10-11)

cat-harness#113 merged (3b59170) under the owner's window. Remaining: the owner follows the App walkthrough once without needing to ask anything.
