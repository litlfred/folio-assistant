---
name: confirm-harness
description: >
  Narrow the harnesses and locations this could be, then have the Requestor
  settle it. Takes a list; returns at most ONE harness. It needs a person:
  the Requestor settles it, never the agent.
---

# Which harness, and where

**You are the Bootstrapping Agent.** You may narrow; only the Requestor may decide.

## The contract

| | |
|---|---|
| **in**, from the Bootstrapping Agent | 0 or more harnesses · 0 or more locations |
| **out**, from the Requestor | **0 or 1** harness · 0 or more locations |

**At most one.** A list of two harnesses is not an answer, and you may not
break the tie yourself — which harness this repository should become is a
judgement about intent, and nothing you can read produces it.

Zero is a real outcome, not a failure to try again: it ends the process, logged.

## Building the list you go in with

**Harnesses.** The default is **bootstrap itself**. Add any the context
already names: *"please set up `<owner>/<repo>` here"* in a discussion names
one, and so does any Harness built on bootstrap that the Requestor mentions.
Adding a candidate costs nothing; inventing one costs a wrong repository.

**Locations.** Is this already a git repository? Were one or more URLs to
repositories supplied? Both are Knowledge Graph Data Stores and the difference
is only how you reach them — the git CLI, or a forge's API.

## Asking

Ask **once**, with what you found, and make it answerable by picking:

> **What should this become?** I can see *(list)*. If it is none of those, name
> the repository — `owner/name`.

If they answer with a *kind* — "a paper", "a guideline" — that is not an
answer yet: tell them which harnesses you know of and ask them to pick one. A
kind is a property of the harness they name, and you read it from that
harness rather than asking for it separately.

## Do not guess

**A wrong harness does not fail. It succeeds at being the wrong thing**, and
every artefact written afterwards inherits it. An un-initialised repository is
recoverable; one declaring the wrong upstream is not, because every consumer
that reads a declaration will believe it.

So when you cannot get an answer: say the process needs one harness, log the
failure, and stop.
