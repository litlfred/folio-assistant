---
title: "Zod schemas as Tools — audit and analysis"
kind: proposal
movedFrom: fsh-guts/proposals/
movedOn: 2026-09-23
issue: 223
bean: folio-assistant-3lbz
summary: >-
  Is Zod usage reachable through skills and Tools? No. 199 exported schemas, 3 named by a Tool node, 0 Tools that validate, 0 Tools bound to kg-navigation. The requirement already exists in #223 and is unmet. Analyses three routes; recommends one parameterised pattern keyed on graph kind, because the parameter is the graph kind. Corrected in place while implementing: the reference field already existed as GraphKindDef.schema, and it is not a validator — qa's declared module exports interfaces only — so a second field, validator, was added beside it.
---

# Zod schemas as Tools — audit and analysis

> **Editorial correction, 2026-09-23.** This proposal was written while the
> instance declaration was a fixed `harness.json`; it is `<name>.json` since
> the 2026-09-21 split (`<name>.config.json` is the config beside it). The
> references below were updated so a reader is not sent to a file that does not
> exist — the proposal's argument is untouched, and only the filename moved.
> The occurrences were invisible while this lived under `fsh-guts/`, which the
> filename gate counts as retired material; publishing it is what surfaced them.

{: .no_toc }

Asked by the owner, 2026-09-20:

> all zod usage is associated with skills and put in tools? (like validate node
> in graph, or so) in kg-navigation?

and, on the shape of the answer:

> a Tool per Zod schema... no, but there should be common patterns (single
> pattern?) with some parameters more or less

Short answer: **no, on every clause.** This is not a new idea — it is a
requirement already written down in
[#223](https://github.com/litlfred/folio-assistant/issues/223):

> Content repos: … **must constrain Skills i/o with schemas (json,.ts)**
> … Tool definitions themselves are nodes in KG

1. TOC
{:toc}

## Two different things are called "tools"

Worth separating before any number means anything.

| | what it is | count | Zod |
|---|---|---|---|
| **MCP tools** | `cat-harness/src/tools/*.ts` — what an agent calls at runtime | 13 | 10 use it, for **input** shapes |
| **KG Tool nodes** | `cat-harness/tools/index.ts`, via `defineTool`, each carrying `satisfies: [skill…]` | 10 | 3 mention it |

Only the second is bound to skills. The owner's question is about the second.

## The audit

**Re-measured 2026-09-20 on `c7b5d9a6`**, after [#437](https://github.com/litlfred/folio-assistant/pull/437)
moved the instance under `cat-harness/`. Every path below is the post-move one;
the first pass cited pre-move paths that no longer resolve, and a proposal whose
paths do not land is the failure [#457](https://github.com/litlfred/folio-assistant/pull/457)
was about. Two counts moved with the restructure — 198 → 199 exported schemas and
93 → 94 composed — and the conclusions did not. Method is stated with each row,
because two of these numbers are easy to misread.

| | |
|---|---|
| exported `*Schema` consts under `cat-harness/schemas/` | **199** |
| …with a direct non-test `.parse` / `.safeParse` call site | **39** |
| …composed into another schema (>2 mentions repo-wide) — validated *indirectly* | **94** |
| …exported, mentioned ≤2 times — effectively unreferenced | **66** |
| Zod schemas represented as a KG Tool node | **3** |
| Tool nodes that **validate** anything | **0** |
| Tool nodes bound to `kg-navigation` | **0** |

**The 160 without a direct call site are not 160 unvalidated schemas.** 94 are
sub-schemas folded into a parent that *is* parsed — `constraints.CorollarySchema`
into the block union, and so on. The `>2 mentions` split is a crude proxy and is
reported as one; the honest reading is *"66 are candidates for being orphaned"*,
not *"66 are dead"*.

The three Zod-flavoured Tools — `cat-harness-schema`, `tool-schema`,
`tool-types-schema` — are not validators. All three carry
`invoke: { shell: "bun run kg:schema" }` and `satisfies: ["kg-export"]`: they
**publish JSON Schema**. Nothing in the corpus offers *"validate this node
against the schema for its kind"*.

## The part that is worse than it looks

`SkillDefinition.schemas` already exists — `SkillSchemaRef { module, types,
access }` in `cat-harness/schemas/assistant-types.ts`, whose own doc says it links a skill
to the Zod schemas it reads or writes. **11 of 22 skill modules declare one.**
It is precisely #223's *"constrain Skills i/o with schemas"*, half-adopted.

The only code that references the field is `cat-harness/scripts/generate-docs.ts`. And:

- **nothing invokes `generate-docs.ts`** — it appears in no `package.json`
  script and no workflow;
- its output directory, `cat-harness/schemas/generated/`, **does not exist** and has never
  been committed;
- the line that would render the field is
  `` `${d.schemas.join(", ")}` `` over an array of *objects*, which would emit
  `[object Object]` if it ever ran.

So `SkillDefinition.schemas` has **zero** effective readers. So does
`SkillCapabilityRef.degradation`, and `fallbackRole` alongside it.

**This corrects the record.** PRs
[#450](https://github.com/litlfred/folio-assistant/pull/450) and
[#452](https://github.com/litlfred/folio-assistant/pull/452), the
`qa-report-signing` skill, and beans `85e8`, `wlqd`, `nup0` all say the field's
"only reader is `generate-docs.ts`, which **renders** it". That is too
generous, and it is the more comfortable error: a field with one renderer
sounds maintained, a field with none is inert. `generate-docs.ts` is not a
consumer of anything — it is a second, dead doc generator sitting beside the
two live ones (`cat-harness/scripts/gen-skill-docs.ts`, `cat-harness/scripts/gen-schema-docs.ts`).

## Three routes

### Route A — one parameterised pattern

The owner's steer, and what the numbers support. **One** Tool — or one narrow
family from one definition — that takes a path and validates it against the
schema for what it is.

What makes it possible is that two of the three declarations already exist:

| needed | status |
|---|---|
| which directory holds which **graph kind** | ✅ `<name>.json`, per `ContentDirectory.graphs` |
| a module declaring itself a schema node | ✅ the `@graphNode schema` tag, checked by `check:schema-nodes` |
| **graph kind → the schema that validates its nodes** | ⚠️ **this row was wrong — see below** |

> **Corrected 2026-09-20 while implementing this (bean `folio-assistant-i31r`).**
> The row above said the reference was missing. It is not:
> **`GraphKindDef.schema` has existed all along.** Three of sixteen kinds
> declare one, **nothing reads it**, and since `#437` all three resolve only
> relative to the *instance* root while their own doc comment calls them
> repo-relative — undetected precisely because nothing read them.
>
> And it is **not a validator**, which the corpus settled the moment anyone
> looked: `qa` declares `content/pipeline/qa-witness.ts`, and that module
> exports **TypeScript interfaces only**. No Zod schema for `qa-witness/v1`
> exists anywhere. Overloading `schema` would have made its one substantial
> use a lie — a consumer importing it expecting something parseable gets a
> module with nothing to call.
>
> So what shipped is `GraphKindDef.validator` (`module#Export`) **beside**
> `schema`, not instead of it: two fields, because a case where they diverge
> is already committed. The `#` form is the spelling
> `<cat-harness.processes:decision ref="file.dmn#Decision_Id"/>` already uses in every BPMN
> gateway here.

**That one field is the parameter**, and adding it turns "validate a node"
from 199 special cases into one lookup.

The shape then falls out: `io.inputs` = the path plus an optional explicit
kind; `io.outputs` = a QA sidecar, which is the form every other verdict in
this repo already takes. `satisfies: ["kg-navigation"]`, giving that skill its
first Tool.

**Cost:** one field on the registry, one Tool node, one script. **Risk worth
naming:** a kind whose schema is undeclared must report *"cannot determine"*
and fail, never pass — otherwise the tool reports a clean run over the kinds
nobody wired, which is the `dh4f` shape.

### Route B — bind the existing gates as Tools

**41** gates are derived from `code-quality-gates.yml`. **0** appear in any
Tool node.

This is the honest competitor to Route A, because *the gates are already the
validators*. `check:harness-dirs`, `check:schema-nodes`, `check:declared-paths`,
`kg:audit` — these run, they fail builds, they are real. What they are not is
**discoverable from the graph**: an agent asking "what tool checks this?" finds
nothing.

**Cost:** ~41 declarations, and a policy for keeping them in step with the
workflow they are derived from — otherwise the Tool list becomes a second
answer to "what are the gates", free to disagree with `gates.ts`. **Yield:**
discoverability only. It executes nothing new.

**It is not exclusive with A**, and the sequencing matters: doing B first
documents the status quo, doing A first adds the one capability that is missing.

### Route C — a Tool per published schema

Rejected by the owner, and the audit agrees: 199 nodes, most of them
sub-schemas nobody invokes independently, each one a declaration to maintain.
It also does not validate anything — it extends the three *publishing* Tools,
which is the thing already covered.

## Recommendation

**A, then B.** A adds the missing capability and needs one new field; B is
worth doing but is documentation of what already runs, and is the kind of bulk
declaration better done once the pattern from A exists to model it on.

**And before either, one small thing:** decide what happens to
`generate-docs.ts`. Three fields' entire claim to being "consumed" rests on a
script that is not wired to anything. Either wire it — in which case the
`[object Object]` bug is live and the `--check` gate that every other generator
here has is missing — or retire it, and stop four beans and one skill from
citing it as a consumer. Not a deletion to take unilaterally
([`deletion-requires-confirmation`](https://litlfred.github.io/folio-assistant/reference/skill-instructions/deletion-requires-confirmation.html)),
which is why it is named here rather than done.

## What this does not claim

That the 66 near-orphans should be removed. The proxy is crude, and an exported
schema with no caller may be a published contract for a downstream instance —
which is the whole point of `kg:schema`. Establishing which is which is its own
measurement, not a corollary of this one.
