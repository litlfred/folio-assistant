---
# folio-assistant-vobp
$schema: bean/1.0.0
title: 'CREDENTIALS: design — capability needs declared, deployment profile supplies; authenticating is not signing'
status: completed
type: task
priority: high
created_at: 2026-10-02T06:11:00Z
updated_at: 2026-10-16T10:10:00Z
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

- [x] Proposal merged under `docs/proposals/`, linked from the index
- [x] The owner has ruled on the decisions it lists (at most four)
- [x] Follow-up beans opened for the skill (`secrets`) and the tool
      (`secrets:check`) only after the ruling

Held by session https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT on branch claude/credentials-design (2026-10-02).

## Rulings, owner, 2026-10-02 ~06:40

- D1 = A, one owner-owned GitHub App. **Default applied** on "no preference"; can be reopened.
- D2 = A, capability names: PUBLISH_SITE_BOOTSTRAP, PUSH_BRANCH_TRIGGERING_CI. **Default applied** on "no preference"; can be reopened.
- D3 = A, a credentials/ directory per instance. **Default applied**, not answered; can be reopened.
- D4 = A, declare sign-artefact now and build it after wallet-custody Q1 and Q7. **Ruled by the owner.**

Recorded in the proposal's Rulings section (PR #1829). The follow-up beans are under 5a3l.

## Closed 2026-10-16 on re-derived evidence

- Proposal merged at `cat-harness/docs/proposals/credentials-needs-and-supply.md` and linked from `cat-harness/docs/proposals/index.md:36`.
- Owner rulings D1–D4 recorded in the proposal and above (2026-10-02).
- Follow-up beans `k3ml`, `jzba`, `9hxd`, `8mlt` opened under `5a3l`.

- [ ] Proposal merged under `docs/proposals/`, linked from the index
- [ ] The owner has ruled on the decisions it lists (at most four)
- [ ] Follow-up beans opened for the skill (`secrets`) and the tool
      (`secrets:check`) only after the ruling

_2026-10-16T10:10:00Z_ — Store sync (owner, 2026-10-16 10:05Z, "1 2"): front matter taken from the folio-assistant copy, which carries the later evidence-backed change; notes only the cat-harness copy had are kept above. Session https://claude.ai/code/session_01K9Xi9QSxCNYju8QNu7EuHg.
