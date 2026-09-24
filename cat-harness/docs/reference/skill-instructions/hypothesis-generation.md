---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'hypothesis-generation'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/remote-stubs/hypothesis-generation.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/remote-stubs/hypothesis-generation.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/remote-stubs/hypothesis-generation.md){: .fa-edit-source }

{% raw %}
# hypothesis-generation — a stub, and it is not working

**This skill is declared, not implemented here.** Do not follow it as guidance;
there is none to follow. It exists so that an agent that asks for it gets an
answer it can act on, rather than `skill_fetch` failing partway through a task.

## What it would be

Proposing candidate hypotheses from observations, with what each predicts.

## Where it actually lives

Upstream, in **https://github.com/K-Dense-AI/claude-scientific-skills**, maintained by **K-Dense-AI**. This instance wraps that
package in `skills/remote-packages/claude-scientific-skills.json`, which declares the
name in `wrapper.skills`.

## Why there is no body

The wrapper's `sync` block declares a weekly shallow clone, and **nothing
performs it.** So the name is published while the content is absent — bean
`wlqd`. That is the gap, stated here rather than discovered at the call site.

## What to do instead, right now

Treat the capability as unavailable. If the task needs it:

1. Say so, rather than improvising a substitute and presenting it as this skill.
2. If a local skill genuinely covers the need, name that one instead.
3. If it does not, the work is blocked on a **platform capability change** —
   GitHub issue and the CRDM workflow first, not an inline fix.

## How this stub stays visible

`kg:audit` reports it under `skill-is-a-stub`, severity `minor`: printed every
run, gating nothing. That is deliberate. A stub that gated would make stubbing
turn CI red, and a stub that reported nothing would be worse than the gap it
filled — it would look finished.

> **The knowledge graph is always a work in progress. QA is what shows where to
> work next.**

Deleting this file does not close the gap; it reopens the call-time failure and
removes the record. Finish the sync, or drop the declaration.
{% endraw %}
