---
$schema: folio-fsh-guts/v1
title: "Skill-instructions page \"confirm-harness\" — a generated page nothing regenerates any more"
kind: generated-page
movedOn: 2026-09-23
movedFrom: "cat-harness/docs/reference/skill-instructions/confirm-harness.md"
bean: folio-assistant-oe98
summary: >-
  A page gen-skill-docs.ts wrote before commit 258d6e0a (byql: fold detangle
  and kg-navigation into cat-harness) and has not written since. It was no
  longer in the skill-instructions index, --check could not see it, and both
  of its source/edit links pointed at paths that no longer exist. Moved here
  on the owner's choice (2026-09-23, "move to trashcan") rather than deleted;
  the live page for any skill that still exists is regenerated from its source.
---

> **Retired 2026-09-23.** Moved here rather than deleted, per
> `skills/folio-core/fsh-guts.md`. The original page follows verbatim,
> including its own front matter, fenced so it is not read as this node's.

````markdown
---
layout: default
title: 'Which harness, and where'
parent: Skill instructions
---

{: .note }
> Generated from [`../bootstrap/skills/confirm-harness.md`](https://github.com/litlfred/folio-assistant/blob/main/../bootstrap/skills/confirm-harness.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/../bootstrap/skills/confirm-harness.md){: .fa-edit-source }

{% raw %}
# Which harness, and where

**You are the Initiator.** You may narrow; only the Requestor may decide.

## The contract

| | |
|---|---|
| **in**, from the Initiator | 0 or more harnesses · 0 or more locations |
| **out**, from the Requestor | **0 or 1** harness · 0 or more locations |

**At most one.** A list of two harnesses is not an answer, and you may not
break the tie yourself — which harness this repository should become is a
judgement about intent, and nothing you can read produces it.

Zero is a real outcome, not a failure to try again: it ends the process, logged.

## Building the list you go in with

**Harnesses.** The default is **bootstrap itself**. Add any the context
already names — *"please initialize litlfred/folio-assistant"* in a discussion
is one; a derivative such as `cat-harness`, `folio-assistant` or
`smart-guidelines` is another. Adding a candidate costs nothing; inventing one
costs a wrong repository.

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
{% endraw %}
````
