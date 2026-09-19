---
# folio-assistant-1hsf
title: Migrate AGENTS.md migration debt into skills, and teach a cold agent to read the KG
status: completed
type: task
priority: normal
created_at: 2026-09-19T07:11:55Z
updated_at: 2026-09-19T10:54:05Z
---

THE ASK, owner 2026-09-19: 'migrate Agents.md work to skills and point agent to how to read KG use skills.'

`AGENTS.md` says this about itself, in a banner at the top: it is 'a bootstrap pointer, not the source of truth', 'the discipline lives in skills/', and 'Sections below that still carry substantive rules rather than pointers are migration debt, not precedent. Adding to them widens it.' This bean is that debt, named.

TWO HALVES:
1. Move substantive rules out of AGENTS.md into the skill that governs them, leaving pointers.
2. Make a COLD agent able to find and use the knowledge graph: `skill_list`, `skill_fetch`, `work_plan_prime`, and the no-MCP fallback of resolving the `kg` graph from `cat-harness.json`.

KNOWN TRAPS, from AGENTS.md's own record:
- THREE copies of `todo-manager.md` exist — `skills/folio-core/` (hand-authored), `docs/reference/skill-instructions/` (GENERATED, CI-gated) and `.claude/skills/local/` (hand-authored, UNGATED, most inbound references, 188 diff lines adrift). A migration that widens that gap is worse than none.
- Editing a skill body requires regenerating the docs mirror AND its kg-qa sidecar, or CI goes red. Both have taken main red before.
- AGENTS.md warns its own counts go stale. Measure; do not quote its prose as fact.

A background survey was commissioned 2026-09-19 to classify every section as POINTER / MIGRATION DEBT / BOOTSTRAP, find rules existing only in AGENTS.md, find rules contradicting a skill, and propose a revertible PR sequence.

## Done when

- [ ] every section classified, with its destination skill
- [ ] rules that exist ONLY in AGENTS.md identified and moved
- [ ] a cold agent has one documented route to the KG and its skills
- [ ] the three-copy todo-manager divergence is not widened

_2026-09-19T09:30:05Z_ — Claimed on branch claude/wonderful-bohr-6kxh7b (2026-09-19). Half 2 (cold-agent KG route) first, then half 1 classification + unambiguous slices.

_2026-09-19T09:39:38Z_ — PR #381 opened: half 2 delivered (kg-navigation skill, skill_list summaries 150/150, onboarding s3 rewritten) plus check:agents-xref, the gate half 1 needs. Measured: only 2 of 20 AGENTS.md section citations resolve here; 2 name the folio's file; 16 unresolved. Half 1 text migration not started.

_2026-09-19T10:05:34Z_ — Both halves delivered. Half 2 in PR #381 (merged). Half 1 in PR #385: four orphan skills written (readme-sections, ci-health, agent-memory, issue-working) plus all seven verified-destination moves (sections 5,6,9,14,16,17,18). AGENTS.md 1289 -> 649 lines. All four Done-when items met: every section classified with its destination (docs/proposals/agents-md-migration.md), AGENTS.md-only rules identified and moved, kg-navigation gives a cold agent one route, and the three-copy divergence measured at 205 lines and not widened - additions went to both hand-authored todo-manager copies.

_2026-09-19T10:26:42Z_ — Citation backlog cleared: 20 -> 0 unresolved, and check:agents-xref:strict is now a CI gate in code-quality-gates.yml. Nine repointed at a platform skill that verifiably owns the rule. Seven could not be settled from this repo, so litlfred/qou was cloned and checked rather than guessed at: five name real sections of its 6,036-line AGENTS.md (four headings, one bullet) and are qualified rather than repointed; two — 'be frugal' and 'Executing actions with care' — are in NEITHER repository and became plain rules. Those two are the only genuinely dead references of the original twenty.

_2026-09-19T10:29:54Z_ — Sections 2, 11 and 19 done too, so all 19 are now pointer or bootstrap. AGENTS.md 1289 -> 566. New skill content-profiles for the adapter-vs-profile distinction (section 2 had no owning skill); section 11 kept its bootstrap half and moved the sweep's emission order to todo-manager; section 19's uses[]/interprets bullet moved to uses-editorial-review.

_2026-09-19T10:54:05Z_ — DONE — merged as ed3cf127 (PR #385), following #381. All four 'Done when' items met: every section classified with its destination (docs/folio-assistant/proposals/agents-md-migration.md); every rule that existed only in AGENTS.md identified and moved or given a skill; a cold agent has one documented route to the KG (kg-navigation, plus skill_list now emitting real summaries and onboarding s3 rewritten); and the three-copy divergence was not widened — a sibling then removed it entirely in #392. AGENTS.md 1289 -> 555 lines, all sections present as pointer or bootstrap, none deleted. Six new skills: readme-sections, ci-health, agent-memory, issue-working, content-profiles, bpmn-processes. Citations 20 -> 0, gated by check:agents-xref:strict in CI. Seven dead links in AGENTS.md fixed; bean v8gh opened because nothing checks them.
