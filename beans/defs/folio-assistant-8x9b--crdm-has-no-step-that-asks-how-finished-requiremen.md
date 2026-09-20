---
# folio-assistant-8x9b
title: CRDM has no step that asks how finished requirements enter the knowledge graph
status: todo
type: task
parent: folio-assistant-ahvw
created_at: 2026-09-20T06:57:38Z
updated_at: 2026-09-20T06:57:38Z
---


Owner, 2026-09-20: *"update CRDM process that when a user is done with requirements on some workflow ask if/how to add into knowledge graph(s), give options. (document this in bpmn and add as a specialized user/agent interaction skill)"*

Queued rather than started — raised mid-turn while the render logger was in flight, and the standing instruction is to queue rather than pivot.

## The gap

`skills/workflows/crdm-requirements.bpmn` runs the six phases and ends. Requirements are elicited, agreed, signed off — and then they exist as an issue and a conversation. **Nothing asks whether they should become knowledge-graph content**, or which graph, or in what form. So the output of the process that exists to produce durable requirements is the one thing the knowledge graph does not learn.

That is the same shape as several defects already paid for here: a fact established in a session, and no step that writes it anywhere a later agent looks.

## Three parts, and the second is the one with teeth

1. **A BPMN step**, in the agent's lane, on the edge out of sign-off. It carries `<folio:skill ref>` like every other activity, per `bpmn-processes`.
2. **A specialised user/agent interaction skill** — this is the substance. It is not "ask the user a question"; `interaction-modality` §4.1 already governs that, and this must OBEY it: context before the question, options not prose, ONE asked in full with a count for the rest, a stated default, answerable by selecting. The user is low-dexterity, so an open "how would you like this in the KG?" is a failure of the skill, not merely of the phrasing.
3. **The options have to be real**, which means the skill must know what the graphs ARE. `harness.json` declares them — `cat-harness` (skills, workflows, roles), `schemas`, `qa`, `health`, `beans`, `fsh-guts`, and more. A requirement could become a skill, a BPMN process, a schema, a bean, an `fsh-guts` proposal, or nothing. "Nothing" is a legitimate answer and must be offered, or the step becomes a ritual that manufactures nodes.

## Open questions for whoever picks it up

- Is this one step or two? "Should this enter the KG at all" and "as what" are different questions, and collapsing them is how the second gets answered by default.
- Does it run per requirement, or once for the set? A six-phase CRDM run can produce many; asking six times is worse than asking once with a list.
- `crdm-close.bpmn` already executes "never close an issue without authorization". This step is adjacent and must not become a second gate on the same edge — check whether it belongs before close or inside it.

## Done when

A CRDM run cannot finish without someone having been asked, in a form they can answer by selecting, whether the requirements become knowledge-graph content and as what — with "none of these" among the options and a default that does not manufacture nodes.
