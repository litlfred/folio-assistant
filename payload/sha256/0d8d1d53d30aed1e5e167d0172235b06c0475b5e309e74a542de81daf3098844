---
# folio-assistant-nbp9
$schema: bean/1.0.0
title: 'Move the deploy-folio secrets into the production environment, with a required reviewer'
status: todo
type: task
priority: normal
created_at: 2026-11-01T21:22:00Z
updated_at: 2026-11-01T21:22:00Z
parent: folio-assistant-rwmf
tags:
    - security
    - security-review-2026-10-31
    - owner-action
    - post-MVP
---

Known open item from the 2026-10-31 security review (follow-up to `folio-assistant-aso6`). Owner action only: repository settings cannot be changed by an agent.

Since litlfred/folio-assistant#2827, `deploy-folio.yml` runs only on main and only through the `production` environment. The secrets it reads (`HETZNER_API_TOKEN`, `GOOGLE_CLIENT_ID/SECRET`, `GH_OAUTH_CLIENT_ID/SECRET`) are still repository secrets, so any workflow can name them, and the environment has no required reviewer yet.

**Deferred by the owner, 2026-11-01 21:20Z ("Not doing now").** Not part of the MVP freeze (folio-assistant#2894); it does not block it.

## Done when

- [ ] The five secrets are environment secrets of `production` and removed from the repository secrets
- [ ] `production` has a required reviewer

_2026-11-01T21:22Z_ — Filed by the MVP security review thread, session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS
