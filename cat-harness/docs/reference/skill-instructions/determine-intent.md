---
layout: default
title: What is this repository supposed to be?
parent: Skill instructions
---

{: .note }
> Generated from [`../bootstrap/skills/determine-intent.md`](https://github.com/litlfred/folio-assistant/blob/main/../bootstrap/skills/determine-intent.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/../bootstrap/skills/determine-intent.md){: .fa-edit-source }

{% raw %}
# What is this repository supposed to be?

**The output of this skill is an instance reference** — `litlfred/f-a-sci`,
`litlfred/cat-harness` — and nothing else. Not a harness type, not a menu
choice, not a set of options.

## Why one reference and not three questions

Read on its own, *"the instance declaration needs to be made once the user's
intent on harness type is known (e.g. folio, smart-guideline DAK, IG or
whatever)"* sounds like this skill should produce a **type** from a closed set.
The worked example says otherwise:

> **"make this repo into a `litlfred/f-a-sci` instance"** — which would turn it
> into a folio with the f-a-sci knowledge graph loaded and using milnor as
> voice.

**Three facts, one reference.** The harness type, the knowledge graph and the
editorial voice are all read from *that instance's own declaration*. Nobody is
asked three questions, because two of the answers were never the user's to
give — they are properties of the thing being named.

An enum would be a **second answer** to "what kind of thing is this repo", free
to disagree with the upstream declaration it came from, and a fourth place the
harness type is written down.

## Do this

1. **Check whether this repository is already an instance** — a root
   `harness.json` declaring a `name`. If it is, **you are done**: read the
   declaration and stop. Bootstrap's process is a decision tree, and this is
   the branch that exits without asking anybody anything.
2. **If it is not, ask exactly one question**, and make it answerable by
   selecting rather than typing:

   > **What should this repository become?** Name an instance to become an
   > instance *of* — for example `litlfred/cat-harness`. If you have been given
   > a reference already, that is the answer.

3. **Take the reference as given.** Do not normalise it, expand it, or resolve
   it to a URL yet. Step 4 of the flow reads that instance's declaration; until
   then the reference is a string a person supplied.

## Do NOT write a declaration before reading theirs

The order is load-bearing and it is the whole reason this skill stops where it
does:

> **reference → read THEIRS → write OURS → cache → re-enter**

Writing this repository's declaration before reading the upstream one leaves a
window in which the repository **claims to be something it is not**, and every
consumer that reads a declaration would believe it. A window that is usually
short is still a window, and the consumer cannot tell.

## When you cannot get an answer

**Do not guess a default instance.** A wrong one does not fail — it succeeds at
being the wrong thing, and every artefact written afterwards inherits the
mistake. Say that bootstrap needs one reference and stop; an unbootstrapped
repository is a recoverable state, and a repository declaring the wrong
upstream is not.
{% endraw %}
