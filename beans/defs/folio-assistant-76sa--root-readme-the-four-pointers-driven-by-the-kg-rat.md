---
# folio-assistant-76sa
title: 'ROOT README: the four pointers, driven by the KG rather than listed — bootstrap overview, skill query, active-vs-static, BPMN role/process'
status: todo
type: task
created_at: 2026-09-21T05:50:07Z
updated_at: 2026-09-21T05:50:07Z
parent: folio-assistant-zzmr
---


Carved out of `ie9l` when issue #592 was closed (2026-09-21, owner's word).
`ie9l`'s second `Done when` box, **partly** landed and recorded as partial
rather than ticked.

**What landed** (PR #593): the `cat-harness:instances` section — a generated
table of every instance, both entries per row, resolved from each instance's
own declaration. That is "by query rather than by list" for the INSTANCES.

**What did not**: the four pointers the owner asked for, which are a
different question from the instance table.

> • point to the bootstreap md overview of skill/tasks
> • point to kg-navation, instruct them where to find the list of skills in
>   materialed corpus (be careful to do this to minimize drift, maybe tool to
>   use json/jsonld queries for aaplicable KGs)
> • tell them to determine if active KG (beans/tods) or static (point to
>   process on determining context)
> • if active: see agent shoud can determine their role, process, task,
>   context/memoty (point to BPMN processes), then check for active beans and
>   (new/updated process) priotize and ask use which beans to work on

The drift constraint is the hard part and it is the owner's own: **the skill
list must be a QUERY, never an answer.** A README that lists skills is wrong
the day a skill is added. `_kg/<stub>.jsonld` is published per instance, so
the query surface exists; what does not exist is a tool that runs one, which
is what this needs and what `d308` is about.

**The active-vs-static distinction is not written down anywhere**, and `aazi`
needs the same definition for its status dashboard. The obvious reading —
*an instance is ACTIVE if it declares a `state` graph* (beans, todos,
workflow-state) — is already declared and checkable rather than a new flag.
**Both beans need it confirmed; neither should invent it separately.**

## Done when

[ ] The root README carries the four pointers
[ ] The skill list is reached by a QUERY over the published graph, not a list
[ ] Active-vs-static is defined once, checkably, and `aazi` uses the same one
