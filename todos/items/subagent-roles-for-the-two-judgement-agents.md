---
$schema: folio-todo/v1
id: subagent-roles-for-the-two-judgement-agents
summary: "Decide which roles content-pipeline-navigator and platform-boundary-guard take on"
status: blocked
priority: medium
origin: agent
# THEME, chosen by judgement from this todo's content (bean `5y4b`).
# Deciding which ROLES two agents take on is a modelling decision about the role graph, not an implementation task. `analyst` is the SDLC / CRDM / business-analysis theme.
theme: analyst
createdAt: 2026-09-19
targetLabel: sec:publication-workflow-agents-and-system-actors
identities:
  - github:litlfred
references:
  - kind: bean
    id: folio-assistant-29ij
  - kind: bean
    id: folio-assistant-h32d
artefacts:
  - kind: pull-request
    id: "314"
---
`ci-health-watcher` is settled: it is a mechanical participant in the CI
process, so it takes `build-pipeline` and `validation-pipeline`, both
`actorKind: "system"`. Declared, and `memoryForRoles` now discriminates
because of it.

**The other two are not settled by that argument, and the reason is precise.**
Both system roles are described as running a fixed program and exercising *no
judgement*. That is exactly what makes them the right home for a watcher — and
exactly why they are the wrong home for these two:

- **`platform-boundary-guard`** decides whether a literal naming one folio
  belongs in platform code, and whether a new content type needs an adapter or
  only a profile. Those are judgements; a wrong one is not a failed check.
- **`content-pipeline-navigator`** is closer to mechanical — it knows which
  stage owns which file — but it also answers "should this be a block kind",
  which is not.

## What differs depending on the answer

Nothing breaks either way today: memory is scoped by agent and the duplication
is already fixed, because one node can reach several agents. What changes is
whether a fact written for one of these two reaches an agent standing in that
lane, or only the agent named in the file.

## Options

1. **Leave both agent-scoped, and say so in the role model.** Costs nothing,
   and is honest — neither is a lane anyone else acts in. The cost is that the
   role axis stays half-used, with one actor on it.
2. **Give them a judgement-bearing existing role** — `editor` and
   `code-reviewer` are the nearest. Cheap, and wrong if the fit is loose: a
   forced edge is one every later audit trusts as true.
3. **Add roles for them.** Honest edges. But `AGENTS.md` warns under
   `skill-in-role-or-process` against "inventing roles and activities to
   absorb tools that do not want them", and a role with one actor describes
   the tool rather than the work.

No recommendation. The `ci-health-watcher` case was settled by a property of
the work (it exercises no judgement); neither option here has an equivalent,
which is why it is a person's call and not an agent's.

## If nothing is decided

Option 1 is the status quo and nothing regresses.
