---
# folio-assistant-ug4r
title: A lane deliberately bound to NO role is indistinguishable from one nobody got round to
status: todo
type: task
priority: normal
created_at: 2026-09-21T19:17:46Z
updated_at: 2026-09-21T19:18:11Z
parent: folio-assistant-1xhc
---


Found 2026-09-21 working bean `sqtq`, by nearly making the mistake it
describes.

## What happened

157 task-containing lanes, and exactly one resolves to no role: `Actor`, in
`cat-bootstrap/workflows/log-message.bpmn`. I had read `role-model.md`'s
§"Adding a role", worked out the `actorKinds` and the `skills`, and was about
to add it when the end of the file said:

> THE FIFTH LANE IS DELIBERATELY UNBOUND: `log-message.bpmn` has a lane named
> `Actor` and no role claims it, because the point of that diagram is that
> the actor VARIES — the `logger` role's own description says the skill
> belongs to whoever is DOING the thing being logged, and `log-message` takes
> `actor` as a required input precisely because the Logger cannot infer who
> acted. A role binding `Actor` would assert the opposite.

The reasoning is right and the decision is right. The problem is WHERE it
lives: a `_lanes_comment` string inside a JSON file, which no tool reads and
which is found only by someone who scrolls to the bottom of the very file
they are about to edit.

## Why this costs something rather than being tidy-up

`kg-qa.ts` carries `lane-binds-role` at severity **major**: *"A lane matches
no declared role, so 'which skills does this task's performer have' has no
answer."* Today that never fires on this lane, because cat-harness does not
audit a nested instance's diagrams (`7u3g`) — so the defect is dormant rather
than absent. The day bootstrap's own graph is audited, a deliberate modelling
decision becomes a permanent `major` finding, and the only available fixes
are to bind the role (wrong, as the comment says) or to baseline the finding
(which hides the next real one).

The same gap points the other way for the glossary. Issue #596 reads a lane's
`name` as `skos:prefLabel` and its role's `description` as `skos:definition`.
A lane with no role has **no definition** — and an extractor cannot tell
whether that is the honest answer (this persona varies; the scope note is all
there is) or a hole somebody left. One renders as a legitimate term, the
other as a defect, and nothing in the data says which.

## The shape of the fix

Whatever a lane's deliberate rolelessness is, it has to be DECLARED where a
tool looks, not narrated where a person might. Candidates, in rough order of
how little they invent:

1. A `<folio:role variable="true"/>` (or `ref="*"`) on the lane's own
   `extensionElements` — the fact lives on the lane it is about, beside the
   binding it replaces, and `lane-binds-role` reads it as a determined
   answer rather than an absent one.
2. A role-graph entry marking the lane name as intentionally unbound — keeps
   diagrams untouched, but puts the fact one file away from its subject
   again, which is how it ended up in a comment.

(1) is better on the same principle the corpus already applies to `actedUpon`
and `judgementOnly`: a property of the thing goes on the thing.

Whichever it is, **it is a determined answer, not an exemption** — the same
distinction `AGENTS.md` draws for an empty `roles` list, which *"says the
actor takes on none"* and is not the same as an absent one.

## NOT to be done as part of this

Binding `Actor` to a role. That is the wrong fix and the file says why.

## Done when

- [ ] a lane can DECLARE that its performer varies, in a form a tool reads
- [ ] `lane-binds-role` treats a declared-variable lane as answered, and
      still fails on an undeclared one
- [ ] the glossary extractor can tell "no definition, by design" from "no
      definition, nobody wrote one"
- [ ] `log-message.bpmn#Lane_Actor` carries the declaration, and the prose in
      `cat-bootstrap/skills/roles/roles.json` points at it rather than being
      the only record
