---
# folio-assistant-k3ml
$schema: bean/1.0.0
title: 'CREDENTIALS (i): secrets skill — add/rotate/revoke per mechanism, GitHub App walkthrough for a personal account'
status: completed
type: task
priority: normal
created_at: 2026-10-02T06:31:22Z
updated_at: 2026-10-20T09:30:00Z
parent: folio-assistant-5a3l
---

From the proposal cat-harness/docs/proposals/credentials-needs-and-supply.md §6.3 (D1=A, the App). Write skills/sdlc/sdlc-core/secrets.md with the human steps per mechanism and the UI paths. Lead with the GitHub App setup on a personal account: register the App, generate its private key, install it on selected repositories, store HARNESS_BOT_ID as a variable and HARNESS_BOT_PRIVATE_KEY as a secret, add the mint step. Agents never handle values (§6.1). Register with skill:register. Not built yet.

## Done when
- [x] the skill exists and is registered (cat-harness#113 merged 3b59170); skill:register:check runs with the next re-pin
- [ ] the App walkthrough has been followed once by the owner without a question

## Progress (lane A, 2026-10-10)

Skill written and registered in the manifest: litlfred/cat-harness#113 (left for review). skill:register at cat-harness/cat-harness-tools main stops at a pre-existing orphan-page finding (skill-instructions/glossary-terms.md, review-comments.md) and re-renders every page in index mode, so generated artefacts ride the next folio-assistant re-pin (#2529). Remaining: merge #113; owner follows the App walkthrough once.

## Progress (2026-10-11)

cat-harness#113 merged (3b59170) under the owner's window. Remaining: the owner follows the App walkthrough once without needing to ask anything.

_2026-10-16T06:30:00Z_ — Store reconciliation: status `todo` → `in-progress` (Owner ruling 2026-10-16, item 9: "based on semantic content"; the copies said folio-assistant: in-progress, cat-harness: todo). Evidence: cat-harness#113 merged (3b59170); the owner walkthrough box is open. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-16T10:10:00Z_ — Store sync (owner, 2026-10-16 10:05Z, "1 2"): front matter taken from the folio-assistant copy, which carries the later evidence-backed change; notes only the cat-harness copy had are kept above. Session https://claude.ai/code/session_01K9Xi9QSxCNYju8QNu7EuHg.

**2026-10-20 — completed.** cat-harness#113 is merged. The owner chose to skip the walkthrough box ("1-3 as recommended", 09:27Z), so the skill is done. Session: https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP
