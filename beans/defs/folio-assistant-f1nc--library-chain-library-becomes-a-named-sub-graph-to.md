---
# folio-assistant-f1nc
$schema: bean/1.0.0
title: 'Library chain: library/ becomes a named sub-graph (tools#1479, cat-harness#1032, core#639)'
status: in-progress
type: task
priority: high
tags:
    - harness-drain-2026-11-02
created_at: 2026-11-05T12:59:09Z
updated_at: 2026-11-05T12:59:09Z
parent: folio-assistant-4j43
---

Land in order: litlfred/cat-harness-tools#1479, then litlfred/cat-harness#1032 (re-pin tools, ready, green), then litlfred/folio-assistant-core#639 (re-pin both, merge). Picked up from a session stalled on weekly limit; handover from drnh.

## Done when
- [ ] tools#1479 merged
- [ ] cat-harness#1032 re-pinned, ready, merged
- [ ] core#639 re-pinned, merged


_2026-11-05T12:59Z_ — Claimed. Step 1 blocked: add_repo for litlfred/cat-harness-tools (push) was refused by the session permission classifier, so tools#1479 cannot be read or merged from here. cat-harness and folio-assistant-core attached. #1032 head 0013b50 (draft), #639 head b009169 (draft); both wait on #1479. Asked owner.

_2026-11-05T13:05Z_ — Owner allowed cat-harness-tools access (card, option 1). tools#1479 had one red, Standalone (no new failures): 2 agent-memory-repo-root tests not red on main. Cause: head commit 5b9510a changed the agent-memory generator, so the per-agent files committed in cat-harness go stale; they cannot be regenerated inside this chain. Reverted it on #1479 (d190ce7, no history rewrite), parked the commit on branch claude/agent-memory-rebase-skill-links for its own PR with the cat-harness regen, merged main (e47016f). CI re-running. PR subscriptions fail in this session; self check-ins instead.
