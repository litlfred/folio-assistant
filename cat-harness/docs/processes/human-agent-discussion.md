---
title: 'Human–agent discussion'
nav_exclude: true
---

{: .note }
> Generated from `bootstrap/processes/human-agent-discussion.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Human–agent discussion

`Process_HumanAgentDiscussion` · strict (defaulted) · 9 step(s)

A REUSABLE SUB-PROCESS, never an entry point. Every diagram in bootstrap that needs something only a person can supply — a choice, a judgement, a step only they have the rights to perform — reaches it through a call activity with calledElement="Process_HumanAgentDiscussion", rather than drawing its own asking. One way of asking, drawn once: a caller that draws its own has a second answer to "how do I ask", free to drift from this one.

THE ORDER IS THE PROCESS: context, then options, then a recommendation, then the question. Never the question first with the explanation available on request. The test a question must pass before it is put: can the reader answer it without opening anything? If answering needs them to open a file, an issue or the scrollback, the question is not ready.

WHAT HAPPENS IF NOBODY ANSWERS is said before the question is put, not decided after. A default may be applied only when the CALLER allows one (the decision is reversible and the caller's own instructions name the default), and it is then recorded as assumed, with the default named — never as the person's answer. Where the caller allows none (which harness a repository becomes is the standing example: a wrong answer succeeds at being the wrong thing), silence ends as unsettled.

SYMMETRIC IN ITS PARTICIPANTS. The answering lane is a person or a sibling agent that already holds the answer; the record says which, because the two are evidence of different weight.

NO work-plan element, and isExecutable is false, for the reasons initialize-harness gives.

<img src="../assets/img/workflows/human-agent-discussion.svg" alt="BPMN diagram: Human–agent discussion" style="max-width:100%">

## How it connects

- **Called by:** [Complete initialization](complete-initialization.html), [Determine the harness and repositories](discussion.html)
- **Calls:** none
- **Presented on:** no docs page section shows this diagram

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Agent | — | Whichever agent called this sub-process. It prepares the question, rules on whether an answer settles it, and records the outcome in the form its caller asked for. It never supplies the answer itself. |
| Requestor | `requestor` | The person who asked — or a sibling agent that already holds the answer. Answering, declining and saying nothing are all legitimate moves here, and each has its own end. |

## Steps

Every one of the 9 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Say what is being decided, and why it matters now**<br>`A_GiveContext` | Agent | `human-agent-discussion` | First, and in the message itself: what the decision is, what depends on it, and what is already known — each fact with where it came from. A link is where somebody goes for more; it is never where the terms are defined. |
| **Lay out the options, with what each costs**<br>`A_LayOutOptions` | Agent | `human-agent-discussion` | Every option the agent could narrow the question to, each with what it costs and what it makes hard to undo. Narrow from context first: an option the agent could have ruled out itself wastes the reader's attention. |
| **Recommend one, and say what happens with no answer**<br>`A_Recommend` | Agent | `human-agent-discussion` | Mark the option the agent would take and say why. Then say what happens if nobody answers: the default, when the caller allows one, or that the question stays open and the work stops, when it does not. Said now, so silence has a meaning both sides agreed to before it happened. |
| **Ask ONE question**<br>`A_PutQuestion` | Agent | `human-agent-discussion` | One question, answerable by picking. With several decisions open, ask one in full and give a count for the rest. Uses whatever channel the caller is in — in bootstrap, the conversation the person is already in. |
| **Answer, decline, or say nothing**<br>`A_Answer` | Requestor | — | The Requestor's move. Declining is an answer. Saying nothing is not, and is what the recommendation's "if there is no answer" was for. |
| **Follow up, narrower**<br>`A_FollowUp` | Agent | `human-agent-discussion` | The answer did not settle it: it named a kind rather than an option, or chose two. Ask once more, narrower, naming what the first answer left open. Once: an agent that keeps asking has stopped narrowing. |
| **Record the answer, and who gave it**<br>`A_RecordAnswer` | Agent | `human-agent-discussion` | In the form the caller asked for — for bootstrap's harness question, a document conforming to discussion.output.schema.json with determinedBy asked. Who answered (a person or an agent) is part of the record. |
| **Apply the stated default, and say so**<br>`A_ApplyDefault` | Agent | `human-agent-discussion` | Only the default stated in A_Recommend, only where the caller allows one, and recorded as assumed with the default named — never as the person's answer. The next message to the person says it was applied, so they can reverse it. |
| **Record what is still open**<br>`A_RecordUnsettled` | Agent | `human-agent-discussion` | Declined, or silent where no default is allowed. The record says what was asked and what is still open, so the next actor resumes rather than restarts. Never a guess. |

## Decisions

**1** of 2 decision(s) carry no documentation — `gateway-documented` lists them.

| decision | what decides it | branches |
|---|---|---|
| **What came back?**<br>`GW_WhatCameBack` | Judgement, exercised by the agent — which is why this gateway carries no computed decision. Whether an answer settles the matter is not computable from its text. | **settles it** → Record the answer, and who gave it<br>**unclear** → Follow up, narrower<br>**no answer** → Did the caller allow a default?<br>**declined** → Record what is still open |
| **Did the caller allow a default?**<br>`GW_DefaultAllowed` | — | **yes** → Apply the stated default, and say so<br>**no** → Record what is still open |

{% endraw %}
