---
layout: default
title: Getting started
nav_order: 3
---

# Getting started
{: .no_toc }

This page takes you from a fresh install to running your first skill with an LLM.
If you want the full narrative walk-through of authoring a paper, jump to the
[**Writing a paper** tutorial](guides/writing-a-paper.html).

1. TOC
{:toc}

---

## 1. Install and verify

Follow [Installation](installation.html), then confirm the framework runs:

```sh
bun run check-deps
```

You should see `bun` reported as present. Anything your content type needs but
is missing will be listed with an install hint.

## 2. Connect your LLM harness

Register folio-assistant as an MCP server in your harness — see
[Connecting an LLM harness](installation.html#connecting-an-llm-harness) for
Claude Code, Antigravity, Gemini CLI, and generic MCP clients. Once connected,
the agent can call the folio-assistant tools directly.

## 3. The tools the agent gets

When connected, the LLM has these MCP tools available (content-type tools appear
only when the matching adapter is active):

| Tool | Purpose |
|------|---------|
| `work_plan_prime` | Surface the current work-plan (beans) for the session |
| `check_dependencies` | Probe which toolchains are installed |
| `skill_list` / `skill_fetch` | Discover and load a skill's instructions |
| `content_list` | List content artifacts in the folio |
| `content_validate` | Validate artifacts against their schema/constraints |
| `content_build` | Build/assemble the content |
| `paper_render_pdf` / `paper_render_html` / `paper_preview` | Render a paper (paper adapter) |
| `formula_render` | Render a single formula to an image |
| `lean_setup` / `lean_build` / `lean_check` / `lean_status` | Lean formalization lifecycle (paper adapter) |
| `qa_sweep` / `proof_status` / `latex_preflight` / `bib_qa` / `glossary_check` / `content_export` | Mechanical QA / publication / transform checks → structured findings (paper adapter) |
| `bib_validate` / `references_validate` / `bib_export` | Bibliography QA + BibTeX export (paper adapter) |
| `codemod` / `prune_deps` / `migrate_lean_refs` | Content transforms — dry-run by default, `apply=true` to write (paper adapter) |
| `latex_overfull` / `tex_source_audit` / `tex_validate` / `dangling_remarks` / `conditional_class_audit` / `section_title_audit` / `status_sections_audit` / `wall_violations` / `defterm_validate` / `value_validate` / `qa_staleness` / `glossary_candidates` / `wiring_audit` / `conjectural_propagation` / `trivial_skeleton_audit` / `lean_compile_audit` / `proof_narrative_equiv` | Read-only content/Lean audits → structured findings (paper adapter) |
| `paper_preferences` | Per-folio rendering preferences |

## 4. Run your first skill

Skills are discoverable and self-describing. Ask the agent to list them, then to
load one. Behind the scenes it calls `skill_list` and `skill_fetch`:

> **You:** What skills are available for authoring?
>
> **Assistant:** *(calls `skill_list`)* The active packages expose: `content-plan`,
> `content-author`, `content-validate`, `content-review`, `content-test`,
> `content-publish`, plus the math package (`lean-formalization`,
> `latex-authoring`, `proof-verification`).
>
> **You:** Load `content-plan` and draft a plan for a short paper on X.
>
> **Assistant:** *(calls `skill_fetch content-plan`, then drafts a plan)* …

See the **[Skills & roles](skills.html)** page for the full list of skills and
roles and how they work together with the LLM. Each skill has a typed
**input/output contract** — browse them in the
[Skill schema reference](reference/skills/).

## 5. Track work with `beans`

folio-assistant uses [`beans`](https://github.com/hmans/beans) as the single
work-plan / todo mechanism — durable across sessions and shared across agents.

```sh
scripts/install-beans.sh          # install the CLI if missing
beans prime                       # emit work-plan priming for agents
beans list                        # current open items
beans create "draft chapter 1"    # open an item
beans <id> --status in-progress   # claim an item
```

The `SessionStart` hook surfaces the plan automatically at the start of each
session, and the `work_plan_prime` MCP tool exposes the same surface to any
connected agent.

## Next steps

- **[Tutorial — writing a paper with folio-assistant](guides/writing-a-paper.html)** (LLM-driven, with a mock chat session)
- **[Skills & roles](skills.html)** — all skills/roles and how they work with the LLM
- **[Content types](content-types.html)** — the formalism for each domain
- **[Authoring guides](guides/)** — papers, WHO SMART DAKs, WHO SMART IGs
- **[Architecture](architecture.html)** — how adapters, skills, and the block model fit together
