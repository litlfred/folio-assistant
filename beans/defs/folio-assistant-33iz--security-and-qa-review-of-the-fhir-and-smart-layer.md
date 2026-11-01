---
# folio-assistant-33iz
$schema: bean/1.0.0
title: 'Security and QA review of the FHIR and SMART layers (2026-10-31)'
status: completed
type: epic
priority: high
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-11-01T21:00:00Z
tags:
    - security
    - security-review-2026-10-31
---

Group C of the owner's full security and QA review of KG-harnessed code (2026-10-31): fhir-harness `21d0fc5`, smart-base `a9d57a2`, smart-ra `f8d210b`, smart-immunizations `0f2b0d9`. Sibling of cat-harness-tools epic `cat-tools-sr31`.

Method: cat-harness `skills/conduct/security/` (security.md boundary table, injection-boundaries, path-containment, zero-trust-handover), the 16 rules of `voices/secure-code-authoring`, RED FLAG categories from cat-harness-tools `schemas/sdlc/red-flag.ts`. Ran `check-workflow-injection.ts` against each repo, `bun audit` / `npm audit`, a secret-pattern grep, and a sink sweep (shell strings, external ids in path joins, innerHTML, `${{ }}` in run blocks, pull_request_target, unpinned actions, outbound fetches).

Four further findings describe how to attack a build or a published site. They are held out of this public store until the owner decides how to disclose them (project file `security-review-2026-10-31/held-findings-fhir-smart.md`).

No committed secrets found. No `pull_request_target` or `issue_comment` trigger is live in any of the four repos (all such workflows are `workflow_dispatch` only).

Children are the filed findings. Session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T08:25Z_ — Open PRs for all remaining Group C beans: `fhir-harness#247` (`avcq`, `wyez`), `smart-base#255` (`plxg`, `towy`, `vl71`, `ylu8`), `smart-ra#181` (`x09n`, `ylu8`), `smart-immunizations#105` (`hgxs`, `ylu8`). (`fg31` completed in `fhir-harness#244` and `smart-base#251`.)

_2026-11-01T21:00Z_ — Completed. Every Group C finding is fixed and merged: fhir-harness#244/#247, smart-base#251/#253/#255, smart-ra#175/#177/#181, smart-immunizations#104/#105. The four held findings are filed as completed beans 98uf, ytsf, jo5h, 10rg (owner Q-SEC-1 A), and hf33 is completed. Re-check 2026-11-01: bun audit shows no high or critical advisory in folio-assistant, core or tools. MVP security review, session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS
