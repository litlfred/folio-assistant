---
# folio-assistant-sqtq
title: 'SWIMLANES HAVE NO DEFINITION: 157 task-containing lanes carry a name and no documentation'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T18:32:14Z
updated_at: 2026-09-21T19:17:41Z
parent: folio-assistant-1xhc
---

Owner, 2026-09-21, ruling on the #596 glossary: *"QA sidecar validation than
documentaion is absent on any of containing swimlines of a task. bean up too
fix. dispatch agent. name,documentation --> glossary."*

## The finding that produced this

Issue #596 names a BPMN swimlane as a glossary source — *"a bpmn diagram
swimlane has title/description"*. **It has a title. It has no description.**

| axis | measured 2026-09-21 |
|---|---|
| lanes containing an activity | 157 (of 164 total) |
| ...with a `name` | **157** |
| ...with `<bpmn:documentation>` | **0** |
| lane strings reaching all 5 locales' `.pot` | **137 of 137** |
| activities in no lane at all | **1** — undetermined, never a pass |

Extracting glossary terms on this basis would have produced 157 entries with a
label and no definition: an index wearing a glossary's name.

**The translation pipeline is not the gap.** `extractBpmn` already handles
`<documentation>`, and every lane name already reaches every locale's template.
Each definition written here reaches all five catalogues on the next extract
with nothing further to wire. The source text is the only thing missing.

## The check

`cat-harness/scripts/check-lane-documentation.ts`, writing a
`qa-results/v1` sidecar. Four families, because each fails differently:

- `lane-without-name` — the term has no LABEL. Currently 0.
- `undocumented-lane` — the term has no DEFINITION. **Currently 157.**
- `lane-string-not-extracted` — EXTRACTION, never "a translation exists".
  Catalogues here ship with an empty `msgstr` awaiting a person, and gating on
  that would be a gate on somebody else's unfinished work. Currently 0.
- `activity-outside-any-lane` — the question cannot be ASKED about it. One
  activity. Reported and counted, never rendered as a pass.

The subject is deliberately the **task-containing** lane rather than every
lane: a lane nothing happens in is a drawing decision, while a lane holding a
task is a swimlane in the sense `AGENTS.md` means — *"a persona an actor takes
on because of the lane it is acting in"* — so a reader meeting that task has to
know what the lane is. That scoping takes the subject from 164 to 157.

An EMPTY `<documentation/>` does not satisfy the check. A gate a keystroke can
clear is a gate that stops meaning anything.

## Done when

Every one of the 157 carries a `<bpmn:documentation>` that DEFINES the lane —
what persona acts here and what it is accountable for — rather than restating
the name. Then `check:lane-documentation` exits 0 and the glossary extractor
can take `name` + `documentation` as a term with a definition.

Ordered by reach in the sidecar, so the lanes a reader hits most often come
first: `feature-staging.bpmn#Lane_Ci` holds 11 activities, `code-change-review`
and `crdm-requirements` 9 and 8.

## Not in scope here

The glossary extractor itself (#596, and it reads this once the text exists),
and the one lane-less activity — that is a diagram-structure question, not a
prose one.

## Worked 2026-09-21 — the fix is right, the GLOSSARY half of this bean was wrong

Before dispatching agents to write 157 definitions, I measured what a lane
already resolves to. It changes the design.

### 150 of 157 lanes already have a definition

`roles.json` carries a `description` for each of its 43 roles, and each role
carries a `lanes[]` array of the lane names that bind to it. Resolving every
undocumented lane through both routes:

| how the lane resolves to a role | lanes |
|---|---|
| explicit `<folio:role ref>` in the lane's `extensionElements` | 27 |
| `roles.json` `lanes[]` alias, matched on the lane's `name` | 123 |
| **resolves to no role at all** | **7** |

Every one of the 150 that resolves has a non-empty `description`. Zero refs
point at a role that is not declared.

### So writing a persona definition into each lane would DUPLICATE roles.json

Which is the defect this corpus names in its own diagrams — `code-change-review.bpmn`
puts it as *"a second description of a process is a second thing free to
disagree with the first."* 157 hand-written persona blurbs, 12 of them for
the lane named `Agent`, is that failure at scale and with a QA gate holding
it in place.

**My dispatch brief said the opposite and was corrected before the agents
ran.** It told them the same persona must get the same text across diagrams,
because the terms merge in the glossary. That reasoning was sound about the
glossary and wrong about where the definition lives.

### The three-way split the measurement implies

| SKOS | comes from | answers |
|---|---|---|
| `prefLabel` | the lane's `name` | what is this called |
| `definition` | the **role's** `description` | who is this persona, in every diagram |
| `scopeNote` | the lane's `<bpmn:documentation>` | what is this lane accountable for **in THIS process** |

The lane text is therefore SUPPOSED to differ per diagram — that is its
content, not a consistency failure. The owner's *"name, documentation -->
glossary"* holds: both feed the glossary, at different SKOS predicates.

This also keeps the extractor honest about provenance. A definition sourced
from `roles.json` has one author and one place to fix; a scope note sourced
from a diagram is attributable to that diagram.

### The 7 lanes that resolve to nothing are a separate, smaller defect

`Initiator` (×2), `Requestor` (×2), `Knowledge Graph Data Store`, `Actor`,
`Logger`. Each names a persona no role declares, so each would enter the
glossary as a **label with no definition** — which is the state this whole
bean exists to end. They need a role binding, an alias on an existing role,
or a new role; that is a judgement about the role model, not something an
agent writing documentation should decide. Note that `Initiator` and
`Requestor` are both in `bootstrap/`, a nested instance, so the answer
may be that bootstrap declares its own.

### What the agents were actually told

Write what the role cannot say. Each agent's manifest carries, per lane, the
resolved role's `description` and `persona` **so that it does not repeat
them**, plus the lane's activities and the process documentation, so the text
it writes is about accountability in that process.

## Done when — revised

- [ ] 157 lanes carry a `<bpmn:documentation>` that is not a restatement of
      their role's description
- [ ] the new strings are extracted into every locale's `.pot`
- [ ] the check is wired into `code-quality-gates.yml`
- [ ] the 7 role-less lanes are ruled on — binding, alias, or new role
- [ ] the glossary extractor reads `definition` from the role and
      `scopeNote` from the lane, rather than expecting one text to be both

## Landed 2026-09-21 — 157/157, and the gate is wired

`bun run gates --all`: **97 gates, green**, with `check:lane-documentation`
among them. Diff over the diagrams: **157 insertions, 0 deletions**, every
added line a `<bpmn:documentation>`.

### The "7 role-less lanes" above is wrong — it is 1, and it is deliberate

Two corrections, in the order they were found, because the second is the
interesting one.

**First**, the resolver read `cat-harness/scenarios/roles.json` alone.
`bootstrap/scenarios/roles.json` declares four roles of its own —
`initiator`, `requestor`, `logger`, `knowledge-graph-data-store` — each with
a description and a matching `lanes[]`. Six of the seven were already bound.
Resolving against both, over all 157 lanes read from the diagrams: **27 by
`<folio:role ref>`, 129 by alias, 1 unresolved.** Sums to 157.

**Second**, that last one is `Actor` in `log-message.bpmn`, and I was one
edit away from declaring a role for it when the file stopped me. Its own
`_lanes_comment` says:

> THE FIFTH LANE IS DELIBERATELY UNBOUND: `log-message.bpmn` has a lane named
> `Actor` and no role claims it, because the point of that diagram is that
> the actor VARIES … A role binding `Actor` would assert the opposite.

So there are **zero** accidentally-unbound lanes. The Done-when item asking
for a ruling is withdrawn: it was already ruled, in the file.

### What that leaves for the glossary — a third case, not a gap

A lane whose persona varies BY DESIGN has no role to inherit a `definition`
from, so its `<bpmn:documentation>` is the only thing the glossary gets. That
is fine and correct. What is NOT fine is that "deliberately unbound" and
"nobody got round to it" are indistinguishable to any tool: the distinction
exists only in a prose `_comment` inside a JSON file, which nothing reads.
`lane-binds-role` is a `major` criterion, so the day bootstrap's diagrams are
audited this reads as a defect forever. Carried to bean `ug4r`.

### Three defects fixed while verifying, two of them mine

1. **The extraction probe was a false-finding machine** — `pot.includes(text)`
   against a gettext template that wraps long msgids across quoted lines and
   escapes every `"`. It reported **13 correctly-extracted lanes as missing**.
   It now asks the extractor's own question. The `decodeLabel` +
   NAMED/DOCUMENTATION copy this needs is a DUPLICATE (`check:partition`
   refuses agentic-harness → folio-assist-core, rightly), and
   `lane-extraction-parity.test.ts` is what makes it legitimate — it caught
   real drift on its first run, the copy over-claiming 17 msgids the real
   extractor drops.
2. **`board-open-close.bpmn#Lane_Renderer` claimed "every task here is a
   serviceTask"** — the file holds seven `<bpmn:task>` and none. The sentence
   came from the worked example in my own dispatch brief; an agent used it
   verbatim and flagged the doubt. Rewritten.
3. **`A_WriteRootReadme` sat in no lane** — the one UNDETERMINED the check
   reported. `Lane_Initiator`'s own text says the step belongs to it, so the
   `flowNodeRef` was simply missing; `root-readme` joins the initiator's
   skills so `role-carries-activity-skill` holds.

## Done when — status

- [x] 157 lanes carry a `<bpmn:documentation>` that is not a restatement of
      their role's description
- [x] the new strings are extracted into every locale's `.pot` — 285
      templates regenerated, `translate-bpmn:check` clean
- [x] the check is wired into `code-quality-gates.yml`
- [x] ~~the 7 role-less lanes are ruled on~~ — **1, and already ruled in the
      file.** The tooling half is `ug4r`
- [ ] the glossary extractor reads `definition` from the role and
      `scopeNote` from the lane — issue #596 slice 2, not this bean
