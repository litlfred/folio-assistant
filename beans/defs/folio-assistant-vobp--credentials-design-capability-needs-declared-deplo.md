---
# folio-assistant-vobp
title: 'CREDENTIALS: design — capability needs declared, deployment profile supplies; authenticating is not signing'
status: in-progress
type: task
priority: high
created_at: 2026-10-02T06:11:00Z
updated_at: 2026-10-02T06:11:08Z
parent: folio-assistant-5a3l
---

Owner, 2026-10-02 (lead session): credentials need a design before any secret
is created. *"keys have lots of deployment scenarios, and so will
folio-assistant (personal, organizational)"*. Wants a skill and a tool so
humans and agents can add, rotate and revoke secrets. Flagged the name
`BOOTSTRAP_PAGES_TOKEN` as bad and asked *"what exactly is being signed?"*.
Nothing is: that secret only authenticates a `git push`.

## What this bean is

The CRDM Phase 1–2 artefact for that feature request: a design proposal,
`cat-harness/docs/proposals/credentials-needs-and-supply.md`. **Document only.
No code, no secret created, no value written anywhere.**

## Measured needs it answers

- bootstrap-tools `publish-bootstrap.yml` pushes to litlfred/bootstrap gh-pages
  and expects `BOOTSTRAP_PAGES_TOKEN` (unset).
- folio-assistant `merge-main.yml` would like `MERGE_MAIN_TOKEN` (unset; falls
  back to dispatching `code-quality-gates.yml`).
- the smart-* repos and cat-harness / cat-harness-tools seeding.

## Done when

- [ ] Proposal merged under `docs/proposals/`, linked from the index
- [ ] The owner has ruled on the decisions it lists (at most four)
- [ ] Follow-up beans opened for the skill (`secrets`) and the tool
      (`secrets:check`) only after the ruling

Held by session https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT on branch claude/credentials-design (2026-10-02).
