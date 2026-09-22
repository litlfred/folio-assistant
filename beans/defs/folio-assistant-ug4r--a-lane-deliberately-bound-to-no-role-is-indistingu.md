---
# folio-assistant-ug4r
title: A lane deliberately bound to NO role is indistinguishable from one nobody got round to
status: completed
type: task
priority: normal
created_at: 2026-09-21T19:17:46Z
updated_at: 2026-09-22T10:33:35Z
parent: folio-assistant-1xhc
---


Found 2026-09-21 working bean `sqtq`, by nearly making the mistake it
describes.

## What happened

157 task-containing lanes, and exactly one resolves to no role: `Actor`, in
`bootstrap/workflows/log-message.bpmn`. I had read `role-model.md`'s
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

- [x] a lane can DECLARE that its performer varies, in a form a tool reads
- [x] `lane-binds-role` treats a declared-variable lane as answered, and
      still fails on an undeclared one — falsified, 4 failures on the mutation
      that suppresses every unbound lane
- [x] the glossary extractor can tell "no definition, by design" from "no
      definition, nobody wrote one" — #596 slice 2, which consumes
      `laneBinding`; not this bean
- [x] `log-message.bpmn#Lane_Actor` carries the declaration, and the prose in
      `bootstrap/scenarios/roles.json` points at it rather than being
      the only record

## Investigated 2026-09-21 — the fix is aimed at the right layer, and the shape is settled

The open question in this bean was WHERE the declaration belongs. Read rather
than reasoned about:

| fact | where |
|---|---|
| `<folio:role ref>` is parsed off the lane's `extensionElements` | `src/workflow/process-model.ts:658` |
| the lane→role resolution, explicit ref winning over the name table | `roleForLane`, `schemas/role-graph.ts:~711` |
| the criterion that fires on an unbound lane | `scripts/kg-audit.ts:448`, `"lane-binds-role": entry(unboundLane, …)` |
| the precedent flags, and they are on the ROLE not the lane | `RoleDef.actedUpon` / `RoleDef.judgementOnly`, `role-graph.ts:323,348` |

So option (1) in this bean — declare it on the lane — is aimed at a real
extension point that is already parsed, and `roleForLane` is the one function
every consumer goes through. Nothing has to be invented.

**One correction to this bean's own reasoning.** It argued from `actedUpon`
and `judgementOnly` that "a property of the thing goes on the thing". Those
two are properties of a ROLE, and what is being declared here is a property of
a LANE — there is no role to hang it on, which is the whole point. The
principle still favours the lane, but the cited precedent is an analogy rather
than a parallel, and saying otherwise would overstate it.

## Shape

- `<folio:role variable="true"/>` on the lane, no `ref`. A lane may carry one
  or the other, never both: a lane that names a role has not got a varying
  performer.
- `roleForLane` returns a third answer. Today it is `RoleDef | undefined`, and
  `undefined` means "nothing matched" — the same value a typo produces. The
  declared case must be distinguishable from that, or the gate cannot tell
  them apart, which is this bean's entire complaint one level in.
- `lane-binds-role` reads the declared case as **answered**, and still fails
  on an undeclared one.
- The glossary emits such a lane as a term with a `scopeNote` and no
  `definition`, which is honest, rather than as a label with a hole.

## Deliberately NOT done in PR #794

That PR is the bean front-matter gate. This is a BPMN extension plus an audit
criterion — a different subject, and mixing them makes both harder to review.
Implementation waits for #794 to merge.

## Built 2026-09-21 — and the bean's own proposal was wrong about WHERE

`bun run gates --all`: **98 gates, green.**

`<folio:role variable="true"/>` on the lane, parsed in `process-model.ts` as
`LaneDef.performerVaries`. Moddle carries an unregistered attribute through as
a string — which is how `ref` already arrives — so no schema registration was
needed. Only the exact string `"true"` counts: reading a typo as a declaration
is how a defect quietly becomes an exemption, and a test asserts `"yes"` does
not.

### The correction: `roleForLane` did NOT need changing

This bean said *"`roleForLane` returns a third answer"*. It does not, and
changing it would have been wrong: its two callers (`stakeholder-map` and the
workflow `instance`) genuinely want "the role, or nothing", and a lane with a
varying performer correctly has no role for them.

What needed the distinction was the consumer that JUDGES the binding rather
than uses it. So `laneBinding()` is new beside `roleForLane`, returning **five**
answers rather than the three this bean imagined:

| answer | why it is its own case |
|---|---|
| `bound` | resolves to a declared role |
| `dangling` | names a role the graph lacks — a typo to correct |
| `variable` | declared: no role, and that IS the answer |
| `contradictory` | declares BOTH a `ref` and `variable` |
| `unbound` | nothing matched, nothing declared — the finding |

`dangling` was already separate in the audit; `contradictory` is NEW and is the
defect this flag itself introduces. It is checked FIRST and before the graph is
read at all, because a lane saying two contradictory things is wrong whatever
the graph contains, and resolving either would make the other silently have no
effect — the exact shape this flag exists to remove.

### Extracting it was not tidiness — it was the only way to test the case

`log-message.bpmn` is in `bootstrap`, a NESTED instance the root audit does
not read (`7u3g`, and `instance-graph-isolation.test.ts` enforces it). And
`kg-audit.ts` takes no root argument. So the rule was reachable only through a
script that never sees its own subject — a rule nothing checks. As an exported
function it is tested directly, and the audit calls it.

### Falsified

Ten tests. Three mutations, each caught:

| mutation | failures |
|---|---|
| the flag suppresses every unbound lane, not just declared ones | **4** |
| the contradiction checked after the graph, so `variable` silently wins | 1 |
| a dangling `ref` reported as `unbound` | 1 |

The first is the one that mattered: it is how this fix could have become a way
of hiding real defects, and four tests refuse it.

### The prose is now the rationale, not the record

`bootstrap/scenarios/roles.json`'s `_lanes_comment` says so explicitly
and points at the declaration. It was the only record until today, and a fact
that lives only in a comment is one `lane-binds-role` reports as `major` for
ever.

## Where the remaining box lives

The one unticked item above is **#596 slice 2's**, not this bean's: the
extractor consumes `laneBinding` to tell a by-design definition-less term from
a hole. It is left open here because the section above is what a reader and
every tool consult, and ticking it would claim work that has not been done.

This section replaced a second `## Done when — status` checklist that restated
the canonical one with its own ticks. `check:bean-bodies` failed the push for
it — correctly: a second checklist is free to disagree with the first, and the
one a tool reads was still saying "not done". The lesson is the check's own:
tick the canonical boxes, never shadow them.


## Closed on evidence — 2026-09-22

The last unticked item was **already satisfied** by #596 slice 2, which the
item itself names as its dependency ("not this bean"). Landed in PR #841
(`f4de6c1e20`); verified by reading the shipped code rather than by
authorship:

- `glossary-export.ts:236` reads the declaration —
  `performerVaries: /<folio:role[^>]*\bvariable="true"/.test(body)`
- `:373` carries it onto the usage node, so a consumer sees it
- `glossary-export.test.ts:169` — *"the lane whose performer varies has a
  usage and NO definition"*

So the glossary CAN now tell "no definition, by design" from "no definition,
nobody wrote one", which is exactly what the item asked for. The tick was
owed from the moment slice 2 merged; the bean stayed `in-progress` only
because nobody went back for it.
