---
# folio-assistant-smbc
title: 'Separation stage 3: owner authorises seeding litlfred/cat-harness and litlfred/cat-harness-tools'
status: todo
type: task
priority: normal
tags:
    - ready-to-close
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-09T17:41:06Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-ho66
---

Stage 3 of the split plan: authorise. Report what moves, the sizes and what breaks (plan §1–§2, updated with the stage 0–2 measurements) in this bean and the PR, and **wait for the owner's go** (`deletion-requires-confirmation`). An agent does not discharge this bean's first box.

Also before asking: confirm both target repositories exist and are empty — `litlfred/cat-harness-tools` measured empty 2026-09-30; `litlfred/cat-harness` not yet checked. Placement PR9 should have landed (zero upward references before the cut — placement §5).

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] the owner's explicit go is quoted here with its date
- [ ] both repositories measured empty, with the command and date recorded

## Measured 2026-10-04 — `litlfred/cat-harness` is empty

`git clone --depth 1 https://github.com/litlfred/cat-harness` → *"warning: You appear to have cloned an empty repository"*; `git rev-parse HEAD` fails (no commits). Same result for `litlfred/cat-harness-test`, which the `zmdo` proof then used. Recorded by session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi. (`litlfred/cat-harness-tools` is not re-measured here.)

## Evidence

_2026-10-09 — ready-to-close:_
What this stage authorises has happened, so its question is moot; what I cannot re-derive is the owner's words.
- Both repositories were seeded: litlfred/cat-harness at 6e8a3f85 and litlfred/cat-harness-tools at cf670c6a, one commit each naming source 6db07109 (bean `iai8`, completed; PR #2517 merged 2026-10-08). Both now carry many later commits (pins in `index.config.json`: cat-harness bd72c68, cat-harness-tools 3ce5100), and the owner consented to those pins on 2026-10-09 (the `trust.consent` entries in `index.config.json`).
- Box 2 (both repositories measured empty) is overtaken: they were empty on 2026-10-01 (`mgxw`) and 2026-10-04 (this bean), and are seeded now.
- **Not re-derivable here:** box 1 asks for the owner's explicit go *quoted with its date*. I found none in this bean, `iai8`, PR #2517 or issue #2521; the seeding commits are on the owner's account but an agent session can push under it, so that is not a quote. The owner confirms or supplies the quote. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
