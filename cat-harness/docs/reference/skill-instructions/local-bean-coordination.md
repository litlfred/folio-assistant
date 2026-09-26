---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'bean-coordination'
parent: Skill instructions
---

{: .note }
> Generated from [`.claude/skills/local/bean-coordination.md`](https://github.com/litlfred/folio-assistant/blob/main/.claude/skills/local/bean-coordination.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/.claude/skills/local/bean-coordination.md){: .fa-edit-source }

{% raw %}
> **This is a stub, not the skill.** The skill is
> [Bean Coordination (folio-core)](bean-coordination.html), from `cat-harness/skills/folio-core`,
> which is what `skill_fetch` serves. Read that one; this page exists
> only so an old link still lands somewhere truthful.

# bean-coordination — see `skills/folio-core/`

**This is a stub. The skill lives in the `kg` graph, not here.**

`skill_fetch("bean-coordination")` serves
[`skills/folio-core/bean-coordination.md`](../../../skills/folio-core/bean-coordination.md)
— `LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` holds `skills/folio-core` and
no `.claude/skills/local` entry.

A 62-line hand-authored copy sat here until 2026-09-19. It described *itself* as
"the generic source of truth" from which downstream repos sync, which was
measurably wrong for the reason above, and it lacked
§"A claim is branch-local" — the rule that a claim announces rather than
reserves, after two sessions claimed one bean 61 seconds apart and shipped two
PRs for it. Its `## Lifecycle of a coordinated work item`, including the rule
that stopping mid-flight leaves the bean `in-progress` with a note on where you
got to, was ported into the servable copy first; nothing was dropped. Bean
`tdmg`.

Same discipline as `CLAUDE.md` and `GEMINI.md`: one source of truth, thin
pointers to it. Do not re-add content here — edit the skill.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Agent bean lifecycle](../../processes/bean-lifecycle.html) | Leave it alone (coordinate instead); Claim it (status: in-progress); Record the blocker and hand back |
| [Code change and review](../../processes/code-change-review.html) | Claim the work item |

