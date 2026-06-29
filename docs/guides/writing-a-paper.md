---
layout: default
title: Writing a paper with folio-assistant
parent: Authoring guides
nav_order: 1
---

# Tutorial — writing a paper with folio-assistant
{: .no_toc }

This tutorial walks through authoring a rigorous scientific paper **with an LLM**
driving folio-assistant: the agent plans the paper, drafts blocks, formalizes
theorems in Lean 4, renders LaTeX, and publishes — while you steer.

It uses a small running example — *"A note on the harmonic series"* — purely to
illustrate the workflow. The content is not the point; the **formalism and the
LLM workflow** are.

1. TOC
{:toc}

---

## The end-to-end workflow

```mermaid
flowchart LR
    plan[1 · Plan] --> scaffold[2 · Scaffold repo]
    scaffold --> author[3 · Author blocks]
    author --> lean[4 · Formalize in Lean]
    lean --> validate[5 · Validate]
    validate --> render[6 · Render PDF/HTML]
    render --> review[7 · Review + feedback]
    review -.->|iterate| author
    review --> publish[8 · Publish]
```

Every step is something the LLM does *for you* by calling folio-assistant's MCP
tools — you converse in natural language and approve the work.

---

## Before you start

1. [Install folio-assistant](../installation.html) and run `bun run check-deps`.
   For papers you want `bun`, `latexmk`/`texlive`, and Lean (`elan`).
2. [Connect your LLM harness](../installation.html#connecting-an-llm-harness)
   (Claude Code, Antigravity, …) so the agent has the MCP tools.
3. Create an (empty) content repository for your paper and add a
   `folio.config.json` with `"contentType": "paper"`.

---

## Step 1 — Plan the paper

Start by asking the agent to load the planning skill and propose a structure.
Behind the scenes it calls `skill_fetch content-plan`.

> **You:** I want to write a short paper, *"A note on the harmonic series"*. It
> should define the partial sums, state and prove that the series diverges, and
> include one worked example. Plan it out.
>
> **Assistant:** *(loads `content-plan`)* Here's a proposed plan:
>
> 1. **`prose`** — Introduction & motivation
> 2. **`definition`** `def:harmonic-partial-sum` — the partial sum $H_n$
> 3. **`theorem`** `thm:harmonic-diverges` — $H_n \to \infty$
> 4. **`proof`** `prf:harmonic-diverges` — Oresme's grouping argument
> 5. **`example`** `ex:H4` — compute $H_4$
>
> The definition and theorem will get Lean counterparts. Shall I scaffold the
> repo and create these blocks as drafts?
>
> **You:** Yes, go ahead.

This is also where you'd open work-plan items so the plan survives across
sessions:

```sh
beans create "Draft harmonic-series paper: blocks + Lean"
beans <id> --status in-progress
```

## Step 2 — Scaffold the repository

The agent creates the block files and a `main.tex`, then confirms with
`content_list`.

> **Assistant:** *(creates blocks, calls `content_list`)* Scaffolded 5 blocks
> under `content/harmonic-series/`. Current artifacts:
>
> ```
> content/harmonic-series/
> ├── 00-intro.prose.md
> ├── 10-def-partial-sum.definition.md
> ├── 20-thm-diverges.theorem.md
> ├── 21-prf-diverges.proof.md
> └── 30-ex-h4.example.md
> ```

Each block carries typed front-matter validated against the
[content-object model](../api/). A definition block, for example:

```markdown
---
kind: definition
id: def:harmonic-partial-sum
title: Harmonic partial sum
lean: HarmonicSeries.partialSum
---
For $n \ge 1$, the *$n$-th harmonic partial sum* is
$$ H_n = \sum_{k=1}^{n} \frac{1}{k}. $$
```

## Step 3 — Author the content

Ask the agent to draft prose and statements; review and refine conversationally.

> **You:** Draft the introduction and the divergence theorem statement.
>
> **Assistant:** *(loads `content-author`, edits the blocks)* Done. The theorem
> reads: *"The sequence $(H_n)$ is unbounded; equivalently $\sum 1/k$ diverges."*
> I kept the statement Lean-friendly so it maps cleanly to `Filter.Tendsto`.

A mock of the chat-driven authoring session:

![Mock chat: the author and the assistant drafting blocks](../assets/img/mock-chat.svg)

## Step 4 — Formalize in Lean

Now the agent sets up Lean and formalizes the definition and theorem, calling
`lean_setup`, `lean_build`, and `lean_check`.

> **You:** Formalize the definition and theorem in Lean and make it build.
>
> **Assistant:** *(loads `lean-formalization`; calls `lean_setup`)* Toolchain
> ready (Lean 4.16.0). I added:
>
> ```lean
> namespace HarmonicSeries
> def partialSum (n : ℕ) : ℝ := ∑ k ∈ Finset.range n, 1 / (k + 1 : ℝ)
>
> theorem diverges : ¬ ∃ B, ∀ n, partialSum n ≤ B := by
>   sorry -- Ref: [oresme] grouping argument
> ```
>
> *(calls `lean_build`)* Build is green with **1 `sorry`** remaining. *(calls
> `lean_status`)* Proof coverage: 1/2 blocks fully proved.
>
> **You:** Discharge the sorry using the grouping bound.
>
> **Assistant:** *(edits, `lean_build`)* ✅ Build green, **0 sorries**.
> `proof-verification` reports the axiom set is clean (no `sorryAx`).

```mermaid
sequenceDiagram
    participant You
    participant LLM as Assistant
    participant MCP as folio-assistant
    You->>LLM: Formalize + make it build
    LLM->>MCP: lean_setup
    MCP-->>LLM: toolchain ready
    LLM->>MCP: lean_build
    MCP-->>LLM: green, 1 sorry
    LLM->>MCP: lean_check / lean_status
    MCP-->>LLM: coverage 1/2
    You->>LLM: discharge the sorry
    LLM->>MCP: lean_build
    MCP-->>LLM: green, 0 sorries
```

## Step 5 — Validate

Validation checks every block against its schema and the project's constraint
rules (label prefixes, required Lean links, citation resolution, …).

> **You:** Validate the whole paper.
>
> **Assistant:** *(calls `content_validate`)* All 5 blocks valid. Constraints:
> `def:` block has its required Lean link ✓, theorem has a proof block ✓, example
> references a defined symbol ✓.

## Step 6 — Render

The agent renders a PDF (and/or HTML) with the paper adapter.

> **You:** Render the PDF and show me a preview.
>
> **Assistant:** *(calls `paper_render_pdf`, then `paper_preview`)* Rendered
> `harmonic-series.pdf` (3 pages). Preview below.

![Mock screenshot: rendered PDF preview in the viewer](../assets/img/mock-viewer.svg)

You can set rendering preferences (engine, scope, math renderer) via the
`paper_preferences` tool:

> **You:** Use lualatex and render only the theorem section next time.
>
> **Assistant:** *(calls `paper_preferences action=set latex_engine=lualatex render_scope=section`)* Saved.

## Step 7 — Review & feedback

Reviewer feedback is captured in the feedback store and routed back into the
authoring loop (`content-review` / `content-feedback`).

> **You:** A reviewer says the example should also show $H_8$. Log it and address it.
>
> **Assistant:** *(records feedback, edits `ex:H4` → adds $H_8$, re-validates,
> re-renders)* Done; feedback item resolved.

## Step 8 — Publish

Finally, publish the rendered artifacts. In CI this is the `publish` workflow;
locally the agent runs `content_build` and the render tools, then commits.

> **You:** Publish it.
>
> **Assistant:** *(loads `content-publish`, `content_build`, commits + pushes)*
> Published. PDF, HTML, and the Lean blueprint are built; the work-plan item is
> marked resolved.

```sh
beans <id> --status resolved
```

---

## What you end up with

- A paper as a tree of **typed, validated blocks**
- A **Lean 4 formalization** with zero `sorry`s and a clean axiom audit
- **PDF + HTML** renders and an interactive blueprint
- A reproducible **CI pipeline** (validate → build → render → publish)

## Where to go deeper

- [Content types — papers & books](../content-types.html#scientific-papers--books)
- Skill contracts:
  [`latex-authoring`](../reference/skills/latex-authoring.html),
  [`lean-formalization`](../reference/skills/lean-formalization.html),
  [`proof-verification`](../reference/skills/proof-verification.html)
- [TypeScript API reference](../api/) — the block model in detail
- [Architecture](../architecture.html) — how the paper adapter is wired

> **Note on the screenshots.** The images above are *mockups* illustrating the
> chat-driven workflow and the viewer. Replace them with real screenshots from
> your own session under `docs/assets/img/` to keep the tutorial current.
