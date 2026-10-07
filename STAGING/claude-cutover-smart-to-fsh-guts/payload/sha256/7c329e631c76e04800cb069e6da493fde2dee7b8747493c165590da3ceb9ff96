---
# folio-assistant-rqao
title: 'ACTORS LIVE IN A CLAUDE-SPECIFIC, UNDECLARED DIRECTORY: .claude/skills/actors (and capabilities/, requirements/) → an agent-generic declared graph'
status: completed
type: task
priority: normal
created_at: 2026-09-30T08:19:40Z
updated_at: 2026-09-30T21:58:28Z
parent: folio-assistant-tr05
---

Owner, 2026-09-30: 'why .claude/skills/actors/*.json? need generic'.

## Commit archaeology
- 05e72abe92 (2026-03-24, 'Add agent skills framework'): 16 actor definitions created in .claude/skills/actors/, beside .claude/skills/capabilities/ (14), requirements/ (5) and local/ — the framework began as a Claude Code skill tree.
- 571d208db8 (2026-09-18): BPMN/DMN moved INTO the declared kg graph and the actor registry rewritten (roles[], not inherits) — but the actors were left where they were.
- Today cat-harness/cat-harness.json declares no directory for them: AGENTS.md's actor table still points at .claude/skills/actors/*.json. So the one graph every swimlane binds to is (a) under a vendor-named dot-directory the dot-prefix guard forbids for declared graphs, and (b) undeclared, so no kind validator or audit-coverage row can claim it.

## Done when
- [ ] actors (and capabilities/requirements, decided each on its own) live in a declared, agent-generic directory with a graph kind
- [ ] every reader (kg-audit, role-graph, raci-chart, check-fallback-roles, docs generators) resolves it from the declaration
- [ ] AGENTS.md and the role-model skill point at the new home
- [ ] .claude/ keeps only what is genuinely Claude-Code-specific



## 2026-09-30 — blast radius measured; the home is the owner's decision
Nine readers hardcode `.claude/skills/actors`: check-actor-reach, check-qa-reviewer-permission, generate-registry, kg-audit, validate-skills, src/core/access.ts, fsh-guts/scripts/generate-docs.ts, plus prose in kg-qa.ts, log-entry.ts, prov-qaqc.ts and auth.ts. There are 36 actor files, 28 capabilities and 5 requirements. The roles they are bound to already sit in the declared `scenarios` graph (`cat-harness/scenarios/roles.json`), and permissions in `policies` (ODRL). Put to the owner as blocker 4 of round 3: (A) `cat-harness/scenarios/actors/`, beside the roles; (B) a new declared `actors/` graph in cat-harness; (C) a root-level `actors/` owned by the checkout (depends on cmsl option A).



## Owner, 2026-09-30 (round 3): `cat-harness/scenarios/actors/`
Actors move beside `roles.json`, inside the already-declared `scenarios` graph. Capabilities and requirements are still to be decided, each on its own.



## Owner, 2026-09-30 (round 4): capabilities → `cat-harness/scenarios/capabilities/`, kept as their own kind, with an optional link to a setup skill
They are not recast as skills: the role model keeps an actor's capabilities (environment) separate from its role's skills (knowledge). Each capability may gain an optional pointer to the skill that explains how to set it up, like `satisfiedBy` on requirements. `requirements/` no longer exists under .claude/skills.

## Owner decision 2026-09-30
Actors move BESIDE roles.json: cat-harness/scenarios/ (the declared kg directory holding roles.json and stories.json). Capabilities/requirements each decided separately.

## Owner, 2026-09-30 (sharp-einstein session): split .claude/skills/local + conventions BY THEME across harnesses
- WHO SMART/FHIR (l2-dak-authoring, l3-fhir-authoring, fhir-validation, ig-publication, terminology-management, smart-base-tools) → fhir-harness / smart-base
- content lifecycle (content-plan/-author/-review/-feedback/-test/-validate/-publish, quality-control, normative-statements) and document (document-authoring/-structure/-publishing) → folio-assistant-core
- math (latex-authoring, lean-formalization, proof-verification) → folio-assistant-sci
- bpmn-authoring, dmn-authoring, conventions/ → cat-harness
- the three .md (two kg stubs + language-trap-agent-audit slash command) stay in .claude/
Wrong-direction process refs (a lower layer naming a higher layer's skill) are reported as findings, not hidden.

## Done (2026-09-30, sharp-einstein)
Actors and capabilities moved on main (101d198, 01193660). This change finishes the last box — .claude/ keeps only Claude-specific content:
- 23 JSON SkillDefinitions split by theme into each owner's skills/skill-definitions/ (smart-base 2, fhir-harness 4, folio-assistant-core 12, folio-assistant-sci 3, cat-harness 2); smart-base and folio-assistant-sci declare the new directory.
- conventions/ → cat-harness/skills/conventions/.
- schemas/skill-definitions-dir.ts: skillDefinitionDirs(), conventionsDir(); readers: generate-registry, validate-skills, kg-audit (local skills + conventions), fsh-guts generate-docs, conventions.test; known-skills NON_SKILL_GROUPS += skill-definitions.
- Left in .claude/skills/: hooks/, interaction-modality/ (stub), local/*.md (two kg stubs + the language-trap-agent-audit slash command).
