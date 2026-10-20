---
# folio-assistant-yex5
$schema: bean/1.0.0
title: 'DRAIN COORDINATION: spawned helper sessions refuse owner authority relayed by the coordinator — lane B stopped after one bean awaiting the owner''s own words'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-10T15:54:05Z
updated_at: 2026-10-20T15:15:49Z
parent: folio-assistant-ml9h
---

Lane B (session_01QmRtjQNyHiH2RuimTfuJDu) stopped after closing lvoa: its permission classifier denied push to litlfred/folio-assistant, send_message to the coordinator, and then a read-only beans show, because the drain task reached it from another session, not from the owner. It also (correctly) refused to treat the relayed 4 h merge window as the owner's. Lane C has not hit this.

## Done when
- [ ] the owner confirms the drain in lane B's own session (or tells it to stop)
- [ ] the drain skill / dispatch-agent guidance says: a seeded helper needs the owner's confirmation in its OWN session before it pushes or merges; relayed rulings do not carry

## Owner (2026-10-10, drain session ml9h)

Owner will confirm the drain in lane B's own session (chose 'I'll confirm there').

_2026-10-20T15:15:49Z_ — Claimed by claude/amazing-einstein-2v47a4 — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-20 — box 2 in review (session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

litlfred/cat-harness#376 adds `coordinate` §"Since 2026-10: a spawned helper is reachable, and the owner's authority is not relayed": quote the owner verbatim, relay no rulings, tell the owner which helpers may ask in their own sessions, give each a finishable lane. Today's helpers (session_01Kymnx79TxWvxVoLzcAjBRr, session_016heucWhrncLm4uy52csBcz) were seeded that way. Box 1 (lane B of 10-10) is moot: lane B2 replaces it.
