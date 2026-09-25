---
# folio-assistant-7mi0
title: 'smart-base: voice profiles for WHO digital health'
status: completed
type: task
priority: high
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-09-22T09:33:37Z
parent: folio-assistant-2yyh
---

Issue #877, and the owner's opening words: *"WHO dgital health needs a once voice."*

Shaped as `who-style-guide/skills/voices/who-editorial/` — `voice.json` (`$schema: folio-voice-skill/v1`) carrying the rules, `SKILL.md` carrying how to USE them and deliberately NOT restating them, because a rule written as prose beside the same rule written as data is one fact in two places and the prose copy is the one with no citation and no pattern.

**Every rule cites `{ libraryId, sectionId, pages, quote }` and `check:voices` refuses a rule whose citation does not resolve.** That is what makes a voice auditable rather than asserted — and `who-ed-ize-preferred` is the standing warning: PR #210 asserted WHO house style was `-ise` from common belief, and the manual says `-ize`.

Blocked by the ingestion.

## Done when
- [ ] `bun run check:voices` and `check:voice-skills` pass
- [ ] no rule derived from recollection
