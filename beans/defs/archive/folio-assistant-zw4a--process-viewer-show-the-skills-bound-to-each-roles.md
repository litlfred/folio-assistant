---
# folio-assistant-zw4a
title: 'PROCESS VIEWER: show the skills bound to each role/swimlane, not just the lane name'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T05:59:29Z
updated_at: 2026-09-23T11:00:13Z
parent: folio-assistant-o3xy
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

- [x] A lane in the rendered process shows its bound role and that role's skills.
- [x] Unresolvable role / determined-zero / has-skills are visibly different
      states — **five of them**, not three. See below.
- [x] The traversal reuses `kg:audit`'s resolution rather than restating it.
- [x] Decided and recorded: **both, distinguished**.

## Summary of Changes — 2026-09-23

`ProcessRow.laneDetails` carried `{id, name, roleRef, documentation}`. It now
carries the binding verdict, the resolved role, **the role's skills closed over
inheritance with provenance**, and **the activity-named skills scoped to that
lane** — `scripts/gen-processes-viz.ts`, with `laneDetail()` extracted and
tested.

### It was three states. It is five, and they are not mine

`role-graph.ts` already had `laneBinding`, whose docstring says it exists for
*"the consumer that has to JUDGE the binding rather than use it"* — which is
what a viewer is. Five kinds: `bound`, `dangling`, `variable`,
`contradictory`, `unbound`.

This file first grew its own four-state enum. It was a worse second answer,
missing `variable` (a lane whose performer varies BY DESIGN — bean `ug4r`,
where reporting it as a defect for ever is the failure the flag prevents) and
`contradictory` (a lane declaring both a ref and `variable`). Deleted in favour
of the existing type.

### Three hand-rolled resolutions, all wrong, all caught by the corpus

Worth recording because the pattern is the same each time and **the types were
happy in all three**:

1. **Reading `RoleDef.skills`.** Documented "before inheritance". Under-reports
   every inheriting role — `adjudication.bpmn`'s `Adjudicator` resolves 14
   skills, with `content-block-review` and `content-feedback` arriving via
   `reviewer`. `resolveRoleSkills` is the resolver; provenance (`via`, `depth`)
   is kept so a reader sees which ancestor supplied each.
2. **Matching only the explicit `<folio:role ref>`.** Reported **140 of 184
   lanes as unbound**. A role also binds lane NAMES (`RoleDef.lanes`), which
   `roleForLane` handles and `laneBinding` calls. Real figure: **183 bound, 1
   variable, 0 unbound, 0 dangling.**
3. **The four-state enum**, above.

Each was found by running the thing against the corpus and disbelieving the
output, not by the compiler.

### Both lists, distinguished — the fourth done-when

`roleSkills` and `activitySkills` are separate and neither contains the other.
Concretely, `adjudication.bpmn`'s `Adjudicator`: **14 role skills, 2 named by
its activities.** A single list would assert an agreement nothing checks.
**Which they are is `kg:audit`'s question** — this renders both and grades
neither.

### A defect found and NOT fixed here

Bean `7go7`. `laneBinding` with no graph reports every ref-bearing lane
`dangling`, so one unreadable role graph renders as a corpus of dangling
references — the `dh4f` shape. Found by a test of mine whose expectation was
wrong, written on the strength of a comment of mine that was false; both
corrected. Left as-is rather than guarded locally, because `kg:audit` and
`glossary-export` share that resolver and a viewer disagreeing with the audit
about whether a lane is bound would be worse than the shape.

14 tests. `bun run gates` — 135/135.
