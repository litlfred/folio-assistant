---
layout: default
title: Agent onboarding
parent: Guides
nav_order: 0
---

# Agent onboarding
{: .no_toc }

You are an LLM agent that has just been dropped into a repository using
folio-assistant. This page is your orientation: what you are looking at,
what to do first, and where to look things up.

For the *architecture* of skills, roles, and capabilities, read
[Skills & roles](../skills.html). This page is the practical version.

1. TOC
{:toc}

---

## 1. Work out which repo you are in

There are two kinds, and confusing them is the most common early mistake.

| | **folio-assistant** (the platform) | **A folio** (the content repo) |
|---|---|---|
| Contains | skills, schemas, pipeline, MCP server | the actual paper / guideline / IG |
| Has `content/<paper>/` | no — only `content/pipeline/` | yes |
| You edit here to | change how authoring works | change what is being authored |

```sh
ls content/          # pipeline/ only  ⇒ platform;  paper dirs ⇒ folio
```

**folio-assistant contains no content.** If you find yourself about to
write subject matter into it — a chapter, a constant, a chapter-keyword
list — you are in the wrong repo, or the thing you are writing should be
folio-supplied data. See §7.

## 2. Your first five minutes

```sh
beans prime && beans list      # the work-plan — see §6
scripts/session-start-coord-sweep.sh   # CLI-independent equivalent
bun run src/index.ts --check-deps      # what this environment can do
```

`--check-deps` matters more than it looks. Many checks degrade to `n/a`
rather than failing when a tool is missing (no Lean toolchain, no Atlas,
no LaTeX). **An `n/a` is not a pass.** If you report "all clean" without
knowing what was skipped, you are reporting the absence of data as a
result.

## 3. Find the right skill — don't improvise

Skills are the unit of work here. Before hand-rolling a procedure, check
whether one exists.

| Where | What it gives you |
|---|---|
| `skills/folio-core/` | content-agnostic: coordination, watchers, QA, render, bibliography |
| `skills/folio-paper-adapter/` | papers: Lean, LaTeX, proofs, simulators |
| `skills/authoring-who-smart-guidelines/` | WHO SMART DAK / IG |
| [Skill schema reference](../reference/skills/) | generated input/output contract per skill |
| [Skill instructions](../reference/skill-instructions/) | generated full instruction bodies |
| [Skills & roles](../skills.html) | how skills, roles, and capabilities compose |

Both `reference/` directories are **generated** — never hand-edit them.
Regenerate with `bun run scripts/gen-schema-docs.ts` and
`bun run scripts/gen-skill-docs.ts`.

## 4. The content object model, briefly

A content block is a **triple** sharing a root name:

```
<block>.ts     manifest — label, kind, uses[], lean.ref, cites[]
<block>.md     the narrative a reader actually reads
<block>.lean   the formalisation (when the kind requires one)
<block>.qa.json  QA sidecar — audit results, per criterion
```

The `.ts` manifest is the source of truth for structure. Formalisation
*status* is derived at build time, never stored in the manifest.

## 5. Two dependency relations — do not conflate them

This trips up agents constantly.

- **`uses[]` is editorial.** "What must a reader have read to follow
  this block?" Authored — agent/human maintained.
- **The formal graph is machine-derived** from `lean.ref`, never
  hand-written.

They diverge legitimately in both directions: a proof invokes `simp`
lemmas nobody needs to read about; a theorem is motivated by an example
it never formally cites.

**Never populate `uses[]` from Lean.** It destroys the signal every
ordering metric is computed from. For impact questions ("what breaks if
this changes?") take the union:

```sh
bun run content/pipeline/content-graph.ts content/<paper>
```

Auditing whether `uses[]` is well used is its own skill:
`uses-editorial-review`, plus the mechanical `uses` QA axis.

## 6. Track work in beans, not in your head

`beans` is the **single** todo mechanism — session-local *and*
cross-agent. `.beans/` is committed, so a plan survives a resume in a
fresh container.

```sh
beans list
beans create "<title>"
beans update <id> --status in-progress    # CLAIM before you work
```

Claim before working so two sessions don't pick the same item, and never
resolve or delete a sibling's bean. Do not stand up a parallel todo
store. Do not `beans create` bulk machine-generated queues (`*.qa.json`,
witness files) — those stay as bulk JSON.

Full discipline: `.claude/skills/local/todo-manager.md`,
`.claude/skills/local/bean-coordination.md`.

## 7. QA sidecars and axes

Every block can carry `<block>.qa.json` recording, per criterion, what
each reviewer found — `script`, `agent`, or `human`. Entries carry the
source-file hashes at audit time, so an entry goes **stale** when the
block is edited and must be re-adjudicated.

Criteria are grouped into **axes** (`proof`, `voice`, `detangler`,
`uses`, `canonical`, `compute`, `bibliography`, …). Run one:

```sh
bun run content/pipeline/qa-sweep.ts --axis uses content/<paper>
bun run content/pipeline/qa-staleness.ts content/<paper>
```

Some criteria are `automated: true` (a script decides) and some are
`automated: false` (an agent or human must adjudicate). The second kind
costs real turns — see `semantic-cone.ts` for scoping them by what they
can actually affect.

**Folio-optional axes.** An axis encoding one folio's subject matter is
registered only when the folio opts in:

```json
// folio.config.json
{ "qaAxes": ["q-usage"] }
```

Likewise, folio-specific *data* belongs in the folio, not the platform —
e.g. `content/<paper>/topic-keywords.json` drives
`detangler-topic-coherence`, and absent it the checker reports `n/a`.

## 8. Shipping work

```sh
/prepare-merge [base]
```

Runs the generic recipe plus content-type-specific gates (paper →
content_validate / qa_sweep / proof_status / latex_preflight /
lean_build), then pushes. **It does not merge.**

Watching a sibling PR: `/watch <pr|branch>`.

## 9. Where to look things up

| Question | Answer |
|---|---|
| Project commands, conventions | `AGENTS.md` (the agent-generic source of truth) |
| What a skill does | `skills/**/`, or the generated [instruction bodies](../reference/skill-instructions/) |
| A skill's typed contract | [Skill schema reference](../reference/skills/) |
| What a QA criterion means | `content/pipeline/qa-criteria-registry.ts` — descriptions are the spec |
| The block schema | `schemas/types.ts` |
| The QA sidecar schema | `schemas/block-qa.ts` |
| What this environment can do | `.claude/skills/capabilities/*.json`, `--check-deps` |
| Lean tooling roadmap | [Lean tooling proposal](../proposals/llm-authoring-tool-integration.html) |

## 10. Habits that keep you out of trouble

- **`n/a` is not a pass.** Say what was skipped and why.
- **Claim a bean before durable work.** Others may be running.
- **Don't hardcode a paper name.** A folio may hold several; resolve
  with `findPapers()` / `soleFolioPaper()` from
  `content/pipeline/repo-root.ts`.
- **Don't write content into the platform.** If it names a chapter, a
  constant, or a vocabulary, it is folio data.
- **Regenerate, never hand-edit,** anything under `docs/reference/`.
- **Read the criterion description before acting on a finding.** They
  state severity, intent, and what explicitly does *not* count.
