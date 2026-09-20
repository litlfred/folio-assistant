---
# folio-assistant-mgta
title: 'GOAL REVIEW: cold start, sweep a window, prioritise against stated goals — a skill, its command, and the gaps it found'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-20T17:59:35Z
updated_at: 2026-09-20T18:06:26Z
parent: folio-assistant-ahvw
---

Owner asked (session_017PqeiS4JYySSWGAYLedmus, 2026-09-20) for the synopsis-and-prioritise interaction to become a skill: inputs are a time window, the goals in the owner's words, the scope, and the axes to sweep; output is a synopsis (closed / open / needs doing, with effort), a priority queue per goal, and the instruction gaps found on the way, each beaned. Also carries the cold-start path fix in AGENTS.md and README.md that the sweep tripped over.

## Done when

- [x] `goal-review` skill exists in folio-core with the four inputs (window, goals, scope, axes), the six axes, the classification steps, the three-part output and the rules — `cat-harness/skills/folio-core/goal-review.md`, 206 lines, under the 400-line threshold
- [x] It is bound to a role (`session-coordinator`) and listed in the package manifest, so `kg:audit` sees it as performed, not reference material
- [x] A `/goal-review` command exists so the owner invokes it by selecting, with the window and the goals as arguments
- [x] The cold-start path in `AGENTS.md`, `README.md` and the onboarding guide points at `cat-harness/scripts/` (nine occurrences)
- [x] Every instruction gap the sweep met is a bean under the process epic `ahvw`, tagged `instruction-gap`: `b963`, `ab3n`, `wqht`, `fgnw`, `vlhk`, `z9eb`, `oh78`, `bbbl`, `cvab`, `sfhr`
- [x] The owner's glossary ask is queued as `lqo9` (tag `roast`), with the standards comparison in its body
- [ ] The owner has read the synopsis and the three queues and chosen the first question (see the session report; the queues are not durable, the gap beans are)

## Summary of Changes

The skill was authored from the session's own method: cold start (which failed on the stale path — gap `b963`), sweep by commit trailer because the session API could see none of the eight siblings (gap `ab3n`), diff the store at the window's two edges (43 of 60 claims without activity — gap `fgnw`), read open proposals for state and owner questions, and classify against the owner's three goals by judgement with the assignment shown. The review itself is reported in the session, not stored; what is stored is this bean, the ten gap beans and the glossary bean.

Not done here, on purpose: none of the ten open proposals was touched, no sibling's bean status changed, and no goal milestone was created — that is gap `wqht`'s question for the owner.
