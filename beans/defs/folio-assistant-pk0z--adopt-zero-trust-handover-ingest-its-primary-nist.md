---
# folio-assistant-pk0z
title: 'ADOPT zero-trust-handover: ingest its primary (NIST SP 800-207), split node from skill, flip status'
status: completed
type: task
priority: normal
created_at: 2026-10-07T19:29:09Z
updated_at: 2026-10-07T21:38:22Z
parent: folio-assistant-ieum
---

Owner 2026-10-07 asked to adopt the zero-trust-handover methodology (drafted, NOT adopted in #2390), with an adversarial analysis. methodology-adoption step 7: its named origin, NIST SP 800-207, is not held. It is a US-government work, so it can be ingested in full.

## Done when
- [x] NIST SP 800-207 ingested as library evidence, cited in the node
- [x] node holds the METHOD; application lives in a skill (methodology-adoption, Node, skill, or both)
- [x] the ROAST findings are answered, accepted-as-cost, or left open by name
- [x] status flipped to adopted, quoting the owner
- [x] check:methodology-evidence passes

Session: https://claude.ai/code/session_01FWGdsHong3XHiU7CMRWmfo


## Summary of Changes

NIST SP 800-207 ingested in full (`library/nist-sp-800-207`, all 12 figures described). New adopted node `methodologies/zero-trust-architecture.md` renders the method from that text, cited by section, with its refusals (score-based trust algorithm, enterprise network machinery). The house rules H1–H9 moved (git mv) to skill `skills/conduct/security/zero-trust-handover.md`, which names the node. Owner's option 1, 'make it a proper methodology', 'ingest completely'. Merged in #2454.
