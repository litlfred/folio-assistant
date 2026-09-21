---
layout: default
title: AGENTS.md
parent: Skill instructions
---

{: .note }
> Generated from [`bootstrap/AGENTS.md`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/AGENTS.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/bootstrap/AGENTS.md){: .fa-edit-source }

{% raw %}
# AGENTS.md — bootstrap

**You are in a repository that is not yet an instance of anything.** This file
is what you read first, and it assumes nothing: no skills directory, no
knowledge graph, no MCP server, no `beans`, no `scripts/`. If any of those are
present they are not yours to rely on yet.

> **This file is phase one of two, and it is added to rather than replaced.**
> What you can do here is deliberately small. The last step of bootstrap is to
> re-enter through whichever harness was installed and read *its* next steps —
> at which point this file gains a second half and the instructions below stop
> being the whole story.

## What you can rely on right now

Exactly three things, and they are all files:

| | |
|---|---|
| `bootstrap/README.md` | the flow, with every term linked to the schema that defines it |
| `bootstrap/harness.json` | this instance's own declaration |
| your ability to read a file | that is the entire toolchain |

**There is no tool call in bootstrap.** Not because one would be untidy, but
because an agent here may have no connected server, and a bootstrap that
required one would fail in exactly the cold-start case it exists for.

## Do this

1. **Read [`README.md`](README.md).** It carries the one user story end to end
   and the three-step handoff. This file does not repeat it — a flow described
   twice is a flow one copy gets wrong.
2. **Find out whether this repository is already an instance.** It is if it has
   a `harness.json` at its root declaring a `name`. If it has one, read it and
   stop: you now know what this repository is, and the rest of bootstrap is not
   for you.
3. **If it is not, you need one reference** — *"make this repo an instance of
   `<owner>/<repo>`"* — and that is the only thing a person has to supply.
   Everything else is read from **that** instance's declaration: what kind of
   harness it is, which knowledge graph to load, which voice to write in.

**Do not ask three questions where one reference will do**, and do not write
this repository's declaration before you have read the upstream one. The order
is load-bearing: `reference → read theirs → write ours → cache → re-enter`.
Writing first leaves a window in which this repository claims to be something
it is not, and every consumer that reads a declaration would believe it.

## What is not decided here

If you find yourself reaching for a rule about content types, block kinds,
voices, review gates, translation or QA — **stop, because that rule is not
bootstrap's.** Those belong to the harness you are about to load, and a copy of
one here would be a second answer free to disagree with the first.

The honest response to *"what should I do about X"* at this stage is usually
**"install the harness, then ask it"**.

---

*This file is a declared asset of the bootstrap instance
([`harness.json`](harness.json), role `agent-instructions`). It is copied into
repositories being initialised, so it carries its provenance and can be checked
against its source rather than drifting quietly — which is what happened to the
root `AGENTS.md`, where five links broke in one directory move and nothing
noticed.*
{% endraw %}
