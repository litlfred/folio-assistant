---
# folio-assistant-sqtq
title: 'SWIMLANES HAVE NO DEFINITION: 157 task-containing lanes carry a name and no documentation'
status: todo
type: bug
priority: normal
created_at: 2026-09-21T18:32:14Z
\1
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
