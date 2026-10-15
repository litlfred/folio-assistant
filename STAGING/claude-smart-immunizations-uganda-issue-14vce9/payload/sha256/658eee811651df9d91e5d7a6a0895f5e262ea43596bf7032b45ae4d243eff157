---
# folio-assistant-mgxw
$schema: bean/1.0.0
title: 'S7 seed staging repos the sibling''s way: one seed PR per litlfred/<name> repo, on a branch'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:14:34Z
updated_at: 2026-10-09T17:42:07Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-ybsz
---

Mirrors n3ni. G6: litlfred/{folio-assistant-core,folio-assistant-sci,fhir-harness} needed (large-datasets, agent-skills fold into cat-harness per owner 2026-10-01); not visible to this account. G7: litlfred/cat-harness and cat-harness-tools already carry commits (09-29, 09-30): read first.

## Done when
- [x] contents of litlfred/cat-harness and cat-harness-tools recorded: both EMPTY (0 commits), 2026-10-01
- [ ] owner authorisation (smbc)
- [ ] seed PR per repo; fresh-clone QA (w1gy)
- [x] missing repos created by owner: litlfred/{folio-assistant-core,folio-assistant-sci,fhir-harness}, verified empty 2026-10-01

## State 2026-10-09
Seeding has landed for every instance, by a different route than this story planned (single-commit seed, then cutover to a remote mount, rather than a seed PR on a branch):
- [x] **seeded** — all 11 instances are live repositories and are remote-mounted from them in `index.config.json` (cat-harness, cat-harness-tools via #2517; core cd8293fd; sci #2477; fhir-harness #2474; who-iris #2472; smart-* #2320; bootstrap/-tools #2470). Bean `iai8` (stage 4 seeding) is completed.
- [ ] **owner authorisation** — `smbc` is tagged `ready-to-close`: the seeding happened, the dated quote of the owner's go was not found.
- [ ] **fresh-clone QA** — `w1gy` still open (no QA reports; the standalone ratchet holds with a 15-entry baseline, see `w1gy`).
Closes when `smbc` and `w1gy` do. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
