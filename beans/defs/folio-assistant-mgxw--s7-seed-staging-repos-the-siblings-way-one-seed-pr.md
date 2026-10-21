---
# folio-assistant-mgxw
$schema: bean/1.0.0
title: 'S7 seed staging repos the sibling''s way: one seed PR per litlfred/<name> repo, on a branch'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:14:34Z
updated_at: 2026-10-21T17:10:00Z
parent: folio-assistant-7x5n
---

Mirrors n3ni. G6: litlfred/{folio-assistant-core,folio-assistant-sci,fhir-harness} needed (large-datasets, agent-skills fold into cat-harness per owner 2026-10-01); not visible to this account. G7: litlfred/cat-harness and cat-harness-tools already carry commits (09-29, 09-30): read first.

## Done when
- [x] contents of litlfred/cat-harness and cat-harness-tools recorded: both EMPTY (0 commits), 2026-10-01
- [x] owner authorisation (smbc — scrapped 2026-10-16 per owner ruling item 8b, superseded by iai8 which completed the stage 4 seeding)
- [ ] seed PR per repo; fresh-clone QA (w1gy)
- [x] missing repos created by owner: litlfred/{folio-assistant-core,folio-assistant-sci,fhir-harness}, verified empty 2026-10-01

## State 2026-10-09
Seeding has landed for every instance, by a different route than this story planned (single-commit seed, then cutover to a remote mount, rather than a seed PR on a branch):
- [x] **seeded** — all 11 instances are live repositories and are remote-mounted from them in `index.config.json` (cat-harness, cat-harness-tools via #2517; core cd8293fd; sci #2477; fhir-harness #2474; who-iris #2472; smart-* #2320; bootstrap/-tools #2470). Bean `iai8` (stage 4 seeding) is completed.
- [x] **owner authorisation** — `smbc` was closed (`scrapped`, superseded by `iai8` per owner ruling 2026-10-16 item 8b).
- [ ] **fresh-clone QA** — `w1gy` still open (no QA reports; the standalone ratchet holds with a 15-entry baseline, see `w1gy`).
Closes when `w1gy` does. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

_2026-10-21T17:10Z_ — Block lifted (`folio-assistant-ybsz` completed) and `smbc` marked satisfied (`scrapped`, superseded by `iai8` per owner ruling 2026-10-16 item 8b). Remaining item: `w1gy` fresh-clone QA.
