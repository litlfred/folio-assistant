---
# folio-assistant-audl
$schema: bean/1.0.0
title: 'cat-harness: French translation of the rewritten docs/guides/agent-onboarding.md'
status: in-progress
type: task
priority: normal
tags:
    - translation
created_at: 2026-11-05T14:22:39Z
updated_at: 2026-11-06T05:52:40Z
parent: folio-assistant-rwmf
---

Docs QA passes d6e155a6, 756943ad and 7c759481 rewrote cat-harness's `docs/guides/agent-onboarding.md`. Then 944dbd62 regenerated `translations/fr/guides/agent-onboarding.po`: 41 msgids, 25 of them empty. That is an inherited `translation:block-qa` finding, one of 16 inherited at `qa-reports:main/83c80d73`.

Found by "CI speed 12" while judging smart-base#307.

Sign-off follows the translation process: the owner or a translator signs off, not an agent. An agent may draft the 25 strings for review.

## Done when
- [ ] the .po file is complete
- [ ] `translation:block-qa:check` shows the finding gone

No translation epic exists in this work plan, so this hangs from the platform milestone. Move it if one is made.

_2026-11-05T14:22:39Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the CI-speed parent session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-06T05:39:32Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-06T05:52:40Z_ — PR https://github.com/litlfred/cat-harness/pull/1096 (`ce29e80eb`, branch `agy/bean-audl-fr-agent-onboarding`, ready for owner/translator review and sign-off, not merged). Drafted French translations for all 24 empty active `msgstr` entries in `translations/fr/guides/agent-onboarding.po` (`40/40` active entries translated; `translations/fr/guides/agent-onboarding.json` updated to `40/40, 100%`). `translation:block-qa` on `docs/guides/agent-onboarding (fr)` moves from `16/73 (22% fail)` to `40/73 (55% warn)` with 0 graded `fail` findings (`translation-terms-preserved: pass`), and `translation:obsolete:check`, `translation:drift:check`, `translation:status:check`, and `check:translation-officiality` all pass. Done-when boxes stay open until owner/translator review and merge. — agy (`80d6c00c-0523-4827-9591-8fe1bfb74374` under `92bff8c9-777d-458a-a380-8dd5bf5cc0f3`)
