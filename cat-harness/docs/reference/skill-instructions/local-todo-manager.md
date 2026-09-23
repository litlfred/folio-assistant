---
layout: default
title: 'todo-manager'
parent: Skill instructions
---

{: .note }
> Generated from [`.claude/skills/local/todo-manager.md`](https://github.com/litlfred/folio-assistant/blob/main/.claude/skills/local/todo-manager.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/.claude/skills/local/todo-manager.md){: .fa-edit-source }

{% raw %}
> **This is a stub, not the skill.** The skill is
> [Session Task Manager (folio-core)](todo-manager.html), from `skills/folio-core`,
> which is what `skill_fetch` serves. Read that one; this page exists
> only so an old link still lands somewhere truthful.

# todo-manager — see `skills/folio-core/`

**This is a stub. The skill lives in the `kg` graph, not here.**

`skill_fetch("todo-manager")` serves
[`skills/folio-core/todo-manager.md`](../../../skills/folio-core/todo-manager.md)
— `LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` holds `skills/folio-core` and
no `.claude/skills/local` entry — so that file is what an agent asking for this
skill by name has always received.

A 369-line hand-authored copy sat here until 2026-09-19 and diverged from the
servable one by 261 diff lines. It was **not** servable, carried no front
matter, and lacked `## Check before you create` — the STRICT rule that exists
because an unguarded `beans create` produced 14,688 duplicate beans. Meanwhile
the onboarding guide, in five languages, pointed here as the "full discipline".
Four rules it carried and the servable copy did not were ported across first;
nothing was dropped. Bean `tdmg`.

The skill is now three, because the one file had grown to 396 lines against a
400-line ceiling while carrying three separable disciplines:

| skill | what it governs |
|---|---|
| [`todo-manager`](../../../skills/folio-core/todo-manager.md) | bean mechanics: the CLI, the STRICT check before `beans create`, the fallback when the CLI is absent, the status vocabulary, coordination |
| [`opening-brief`](../../../skills/folio-core/opening-brief.md) | what you say **before** starting a bean or a topic |
| [`turn-reporting`](../../../skills/folio-core/turn-reporting.md) | what you say **during and after** each turn, including the STRICT "next"-line rule |

Same discipline as `CLAUDE.md` and `GEMINI.md`: one source of truth, thin
pointers to it. Do not re-add content here — edit the skill.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a document](../../processes/authoring-a-document.html) | 2 · Seed the work plan |
| [Authoring a paper](../../processes/authoring-a-paper.html) | 2 · Seed the work plan |
| [Agent bean lifecycle](../../processes/bean-lifecycle.html) | Check before you create (exact-title search); Create the bean (agent CLI, not an engine op); Work, keeping the body current (this is 'edit'); Complete (no unchecked todos left); Scrap with reasons NEVER delete |
| [Code change and review](../../processes/code-change-review.html) | Record what was done, and close |
| [Content Change and Review](../../processes/content-change-review.html) | Open the branch-watch bean; Note the main-branch watch |
| [Content lifecycle](../../processes/content-lifecycle.html) | Seed the work plan; File feedback as beans |
| [CRDM Phase 5 — beans and sign-off](../../processes/crdm-signoff.html) | Phase 5: Create beans |
| [Document ingestion — uploads/ to the L1 source knowledge graph](../../processes/document-ingestion.html) | Record the gap as a bean |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Open or claim the release bean; Open beans for the change requests; Close the release beans |
| [Editing and HCI validation](../../processes/editing-hci-validation.html) | Claim or open the bean; Log findings on the bean; Resolve or re-open the bean |
| [Evidence for a recommendation](../../processes/evidence-retrieval.html) | Open a bean for the unverified citation; Record the evidence gap |
| [Getting started](../../processes/getting-started.html) | Seed the work plan |
| [Incremental IG build](../../processes/ig-incremental-build.html) | Log the environment error on the bean; Log findings on the bean; File QC findings as beans |
| [L2 DAK authoring](../../processes/l2-dak-authoring.html) | Seed the work plan |
| [L3 FHIR IG pipeline](../../processes/l3-fhir-pipeline.html) | File QC findings as beans |

