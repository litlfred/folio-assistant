---
# folio-assistant-wwbl
title: 'Audit: which skills are not in the KG'
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:22:06Z
updated_at: 2026-09-19T05:22:33Z
---


## The requirement, in the author's words (2026-09-18)

> audit if other skills are not in the KG

## Leads already in hand (measured 2026-09-18, this branch)

- **`bun run kg:export` reports 3 dangling `declaresSkill` edges** — a node
  declares a skill that does not resolve:
  `skill/scientific-visualization`, `skill/hypothesis-generation`,
  `skill/scientific-critical-thinking`. Reported and non-fatal today.
- **`.claude/skills/local/` is outside every guard.** `GROUPS` in
  `scripts/gen-skill-docs.ts` lists `skills/content-lifecycle`, `src/skills`,
  `skills/folio-core` and the two adapter dirs — not `.claude/skills/local/`.
  `AGENTS.md` measures that this is where the copy with the MOST inbound
  references lives (`todo-manager.md`, 5 refs, 188 diff lines from the
  `folio-core` copy) with no check on it at all.
- **`scripts/known-skills.ts`** is the one answer to "what counts as a skill",
  shared by `kg-audit` and `check-workflow-refs`. It is the right place to
  measure against, and `.claude/skills/` is deliberately NOT uniformly skills
  (`actors/`, `capabilities/`, `roles/`, `hooks/` are other node kinds).
- **`kg:audit` already reports 6 skills nothing reaches** (minor). That is the
  reverse direction — in the KG but unreferenced — and belongs in the same
  report so both gaps are read together.

## Done when

The audit distinguishes three states and never renders the third as a pass:

1. a skill file that is a KG node and is reachable;
2. a skill file that exists but is **not** a node (the gap this bean names);
3. **could not determine** — a directory that is not uniformly skills, a file
   that will not parse.

...and reports the dangling-reference direction (a node naming a skill that is
not there) alongside it, since kg-export already finds three.

_2026-09-19T02:04:23Z_ — Audited 2026-09-19. The prediction was wrong in an instructive way and the real finding is bigger. There is NO set of skill files missing from the graph today — knownSkills() and kg-export both resolve 149, zero in each direction. What is broken is that the three readers of 'which directories hold skills' each answered differently and agreed only by coincidence: known-skills.ts hardcoded SKILL_MD_DIRS with 4 of the 6 skills/ packages, gen-skill-docs.ts hardcoded GROUPS with the same 4, and kg-export.ts scanned skills/* dynamically and saw all 6. authoring-math (3 skills) and authoring-who-smart-guidelines (9) were absent from the first two. CONSEQUENCE 1, silent data loss, live: all twelve instruction bodies were NEVER PUBLISHED to the docs site, and four of them (fhir-validation, l2-dak-authoring, bpmn-authoring, latex-authoring) are named by <folio:skill ref> in real BPMN diagrams — an agent following workflow_next to one of those steps got a skill whose reference page 404s. CONSEQUENCE 2, latent false-dangling: nothing broke in known-skills.ts because all twelve happened to resolve through a SECOND home — eleven have a schemas/skills/<name>/ I/O contract and smart-base-tools has .claude/skills/local/smart-base-tools.json. Delete any one of those second homes and check-workflow-refs reports a real, present skill as dangling, which is the wall-of-false-dangling-refs its own header says it exists to prevent. A SECOND divergence, found by probe rather than by reading: known-skills.ts used a DENY-list for .claude/skills/<group>/ while kg-export hardcoded local alone. Created .claude/skills/probegroup/probe-skill.md — knownSkills() resolved it, the exported graph did not. Latent (only local exists today), now impossible. FIXED: all three discover. skills/* packages are found by holding .md (the same test that excludes workflows/, roles/, permissions/, requirements/, framework/, remote-packages/); .claude/skills/<group>/ is found by the deny-list, now applied in one place; kg-export imports skillMdDirs from known-skills.ts so there is literally one definition. gen-skill-docs.ts discovers the directories and declares only the human-readable CATEGORY per package, and a discovered package with no category THROWS naming it — forgetting is loud, because publishing under a guessed heading is how twelve skills went missing unnoticed. 151 instruction bodies published, up from 139. Four invariant tests in scripts/tests/skill-coverage.test.ts, each CHALLENGED by reintroducing its defect and confirmed to fail on it and pass without it. NOT done, and not this bean's: the 3 dangling declaresSkill edges (scientific-visualization, hypothesis-generation, scientific-critical-thinking) are content authorship — whether those skills should exist is the owner's call; and the .claude/skills/local/todo-manager.md divergence from the folio-core copy (188 diff lines) stays open because AGENTS.md says which copy is canonical is a question for whoever owns the skills layout. The bean's 'kg:audit reports 6 skills nothing reaches' was NOT quoted: AGENTS.md records that exact figure going stale and being repeated back as live, and skill-has-entry-point now reports zero.
