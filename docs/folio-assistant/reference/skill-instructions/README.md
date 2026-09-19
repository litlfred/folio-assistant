---
layout: default
title: bootstrap
parent: Skill instructions
---

{: .note }
> Generated from [`bootstrap/README.md`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/README.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/bootstrap/README.md){: .fa-edit-source }

{% raw %}
# bootstrap

**You have just been pointed at a repository and know nothing about it.** This
directory is what you read first. It is a
[knowledge graph](../schemas/kg-node.ts) that stands alone: it does not import
the harness, and it assumes no connected tools.

> ⚠️ **Status: the graph is not built.** This README is the specification and
> the entry point; `bootstrap.jsonld`, the two skills and the process diagram
> are still to come. Design and open questions:
> [`proposals/bootstrap`](../docs/folio-assistant/proposals/bootstrap.md).

## What `bootstrap <instance>` means

> **`bootstrap litlfred/cat-harness`** — *make this repository an instance of
> that one.*

You are given **one** reference. You do not ask what kind of repository this
should be, which knowledge graph to load, or which voice to write in: you
**read** that instance's [declaration](../schemas/cat-harness.ts) and it
answers all three.

## The flow, once through

An [**actor**](../.claude/skills/actors) performs a
[**task**](../schemas/assistant-workflow.ts) in a
[**process**](../skills/workflows) as a
[**role**](../schemas/role-graph.ts), using that role's
[**skills**](../schemas/skill-package.ts). A role is a swimlane; a skill is the
instruction body the actor reads to do the work. A
[**tool**](../schemas/tool.ts) is a declared mechanism a skill may name.

**One story.** An agent is told *"make this repo into a
`litlfred/f-a-sci` instance"*.

1. It reads this README and loads the [bootstrap graph](#three-steps).
2. It starts the bootstrap [process](../skills/workflows). The process is a
   decision tree with two branches: **this repo is already an instance** →
   load its declaration and stop; **it is not** → ask the human what to make
   it, which is the only place user input is required.
3. The intent skill turns the answer into an **instance reference** —
   `litlfred/f-a-sci`, not a menu choice.
4. The agent reads *that* instance's declaration. It says the content type is a
   folio, which knowledge graph to load, and that the editorial voice is
   `milnor`. Three facts, one reference, nothing guessed.
5. It writes this repository's own declaration from what it read, and caches
   what the declaration needs under `bootstrap/<instance>/`.

The order matters: **reference → read theirs → write ours → cache.** Writing a
declaration before reading the upstream one leaves a window in which this
repository claims to be something it is not, and every consumer that reads a
declaration would believe it.

## <a id="three-steps"></a>Do these three things

1. **Load the skill for reading a knowledge graph** — `bootstrap/kg-navigation.md`.
   You cannot follow step 2 without it.
2. **Load `bootstrap/bootstrap.jsonld`** and read the bootstrap process node.
3. **Start the bootstrap process** and follow it.

Everything else — [tools](../tools), translations, the viewer, the content
model — belongs to the harness you are about to load, not here.

---

*Every term above links to the schema that defines it. This README does not
define them a second time: a definition in prose beside a definition in a
schema is two definitions, and one of them goes stale.*
{% endraw %}
