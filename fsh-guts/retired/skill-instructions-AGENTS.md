---
$schema: folio-fsh-guts/v1
title: "Skill-instructions page \"AGENTS\" — a generated page nothing regenerates any more"
kind: generated-page
movedOn: 2026-09-23
movedFrom: "cat-harness/docs/reference/skill-instructions/AGENTS.md"
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
title: 'AGENTS.md'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/kg-navigation/AGENTS.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/kg-navigation/AGENTS.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/kg-navigation/AGENTS.md){: .fa-edit-source }

{% raw %}
# AGENTS.md — kg-navigation

What binds everywhere is the repository's [`AGENTS.md`](../../../AGENTS.md); what
this package *is* is [`README.md`](README.md). This layer exists for the agent
who does not yet know the layout — which may be you, right now.

## If you are cold, read the skill, not the directory

Ask for it: `skill_list`, then `skill_fetch`. **Do not open a path under
`skills/` from memory.** The graph an instance declares is what resolves, and
a hardcoded path is how a skill goes missing the moment the layout moves —
which is the exact failure this layer is about.

## Two bodies, one subject. Do NOT delete one as a duplicate.

| where | precondition |
|---|---|
| [`bootstrap/skills/bootstrap-kg-navigation.md`](../../../bootstrap/skills/bootstrap-kg-navigation.md) | **nothing installed** — no MCP server, no `skill_fetch`, no `beans`, no build |
| [`kg-navigation.md`](kg-navigation.md) | the tooling is reachable — the MCP pair, and the filesystem fallback |

They answer the same question **under different preconditions**, so neither is
a copy of the other and merging them would leave one caller unable to run what
it was given. The name collision that made them look like duplicates is gone;
bootstrap's is now `bootstrap-kg-navigation`. The reason for two bodies is
not gone.

If you find yourself about to "consolidate" these, the question to answer
first is: **which precondition does the surviving body assume?** Whichever you
pick, the other caller is broken.

## Do not put a count in either body

Both carried line counts and both had drifted. A count in prose is a claim
nothing checks.

---

*Was a declared asset of the `kg-navigation` instance until it was folded into
cat-harness on 2026-09-23 (bean `byql`). Issue #592.*
{% endraw %}
````
