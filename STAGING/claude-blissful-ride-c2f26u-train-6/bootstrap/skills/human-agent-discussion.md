---
name: human-agent-discussion
description: >
  Ask a person (or a sibling agent) for what no file holds: context, then the
  options, then a recommendation and what happens with no answer, then ONE
  question. The reusable discussion every bootstrap diagram calls when it
  needs a person; it records the answer, an applied default, or what is still
  open, and never a guess.
---

# Asking a person, in one reusable way

**You are the agent that needs something only a person can supply**: a
choice, a judgement, or a step only they have the rights to perform. Every
diagram in bootstrap that needs one calls
[`processes/human-agent-discussion.bpmn`](../processes/human-agent-discussion.bpmn)
as a call activity rather than drawing its own asking. A caller that draws
its own has a second answer to "how do I ask", free to drift from this one.

## The order is the rule

1. **Context.** What is being decided, what depends on it, and what you
   already know, each fact with where it came from. In the message itself:
   a link is where somebody goes for *more*, never where the terms are
   defined.
2. **Options.** Every option still open after you narrowed from context,
   each with what it costs and what it makes hard to undo. An option you
   could have ruled out yourself wastes the reader's attention.
3. **Recommendation.** The option you would take, marked, and why.
4. **What happens with no answer.** Said *before* the question, so silence
   has a meaning both sides agreed to before it happened: the default, when
   the caller allows one, or "the question stays open and the work stops".
5. **One question**, answerable by picking. With several decisions open,
   ask one in full and give a **count** for the rest.

The test before you send it: **can the reader answer without opening
anything?** If not, the question is not ready.

## What can come back, and where each ends

| what came back | what you do | end |
|---|---|---|
| an answer that settles it | record it, and who gave it (a person or an agent) | *Answered* |
| an answer that does not settle it (a kind instead of an option; two options) | follow up **once**, narrower, naming what is still open | back to the answer |
| a refusal | record what was asked and what is still open | *Still open* |
| nothing | apply the default **only if the caller allows one**, and say so; otherwise record what is still open | *Default applied* or *Still open* |

**A default is the caller's to allow, never yours.** A caller allows one
only when the decision is reversible and its own instructions name the
default. It is recorded as *assumed*, with the default named, never as the
person's answer, and the next message tells them it was applied so they can
reverse it. Which harness a repository becomes allows **none**: a wrong
answer does not fail, it succeeds at being the wrong thing
([`confirm-harness`](confirm-harness.md)).

## The record

In the form the caller asks for. For bootstrap's harness question that is a
document conforming to
[`discussion.output.schema.json`](../schemas/discussion.output.schema.json)
([`discussion`](discussion.md)). For a step only the person can perform
([`complete-initialization`](../processes/complete-initialization.bpmn)), it
is the step with the person's word beside it. A person saying "done" is
recorded as their word, and the next check decides whether it holds.

## Symmetric in its participants

The answering lane is a person or a sibling agent that already holds the
answer. The record says which, because the two are evidence of different
weight. Neither is refused, and they are not conflated.
