---
# folio-assistant-zw4a
title: 'PROCESS VIEWER: show the skills bound to each role/swimlane, not just the lane name'
status: todo
parent: folio-assistant-o3xy
type: feature
created_at: 2026-09-23T05:59:29Z
updated_at: 2026-09-23T05:59:29Z
---

The process viewer renders BPMN lanes but does not surface what the KG already knows about each lane: the role it binds, and that role's skills. Owner's request 2026-09-23.

## What is already true, so this is a rendering gap rather than a modelling one

The chain the viewer needs is **already declared and already traversed
elsewhere**. AGENTS.md states it in one sentence: *"An actor performs a task in
a process as a role, using that role's skills."*

- A BPMN lane binds a role — `<folio:role ref>`, and `glossary:check` already
  fails a lane that binds none (that gate is what caught `Lane_Stakeholder` on
  2026-09-22).
- A role carries its skills — `scenarios/roles.json`.
- An activity names the skill it runs — `<folio:skill ref>`, required by
  `bpmn-processes`.
- `kg:audit` already resolves these joins, one criterion per join, so the
  resolution logic exists and must be **reused rather than re-implemented** —
  a second traversal is a second answer to "which skills does this lane have",
  free to disagree with the first.

So nothing new has to be modelled. The viewer is showing a lane name where the
graph can already give the lane's role and that role's skills.

## Two things to get right, both already paid for elsewhere

1. **A lane's skills are not the union of its activities' skills.** The role
   carries skills it may not use in this diagram, and an activity may name a
   skill the role does not list — which is itself a finding `kg:audit` reports.
   The viewer must show *which* it is displaying, or it invents a third
   relation. Showing both, distinguished, is probably right.
2. **"Could not determine" is never rendered as clean.** A lane whose role is
   unresolvable, or a role with no skills declared, must look different from a
   role with a determined zero. This is `dh4f`, and a viewer is exactly where
   the two collapse into the same empty panel.

## Done when

- [ ] A lane in the rendered process shows its bound role and that role's skills.
- [ ] Unresolvable role / determined-zero / has-skills are three visibly
      different states.
- [ ] The traversal reuses `kg:audit`'s resolution rather than restating it.
- [ ] Decided and recorded: role-declared skills, activity-named skills, or both
      distinguished.
