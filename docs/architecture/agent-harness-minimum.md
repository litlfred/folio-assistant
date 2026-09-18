---
layout: default
title: Minimum agent-harness
parent: Architecture
nav_order: 5
---

# The minimum `agent-harness` — and what moves where
{: .no_toc }

1. TOC
{:toc}

---

> **Proposal, nothing built.** Answers
> [#223 comment 16:13](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5732811137)
> (minimum contents, Tools strawperson, documentation move-table) as revised by
> [comment 16:28](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5732987719)
> (the harness is **not** self-documenting). Inventory measured on `main` at
> `d8632b6`, 2026-09-18.

## The revised repo set

The 16:28 revision changes the shape from the
[five-repo future state](future-state.html). Rendering moves out of the
harness, and each layer gains a Tools sibling:

```mermaid
flowchart TD
    AH["<b>agent-harness</b><br/>workflow state · guardrails<br/><i>not self-documenting</i><br/>one tool: beans"]
    AHT["<b>agent-harness-tools</b><br/>beans CLI Tool node"]
    C["<b>folio-assist-core</b><br/>justthedocs pipeline · webpage<br/><i>self-documenting</i>"]
    CT["<b>folio-assist-core-tools</b><br/>BPMN/DMN/Todo renderers"]
    FA["<b>folio-assistant</b><br/>(what remains today)"]

    AHT --> AH
    C --> AH
    CT --> C
    FA --> C
    FA -.uses.-> CT

    classDef h fill:#1f3b52,stroke:#4a90c2,color:#fff
    classDef c fill:#2d4a2b,stroke:#6aa84f,color:#fff
    classDef t fill:#4a3b52,stroke:#a274c2,color:#fff
    class AH h
    class C c
    class AHT,CT,FA t
```

## What "not self-documenting" actually constrains

This is the load-bearing sentence in the revision, and it is worth converting
into a test rather than a slogan.

**The harness cannot render a website.** The just-the-docs pipeline, the
`webpage` content type, and every renderer belong to `folio-assist-core`. So
the harness cannot document itself *as a folio* — its documentation is prose
files an agent reads, not pages a reader browses.

That yields a one-line admission test for every candidate:

> **If it produces something a human looks at, it is not the harness.**

Applied honestly it removes a great deal from the 16:13 list. The webpage
content type, the sticky-note Todo rendering, the QR code, dark/light mode, the
six UN languages, the audit-sidecar iconography, "links to edit in GitHub" —
all of these are **things a reader sees**, so all of them are
`folio-assist-core` or `folio-assist-core-tools`, not the minimum harness.

What survives in the harness is the part with no pixels: **schemas, process
definitions, and skills that tell an agent how to behave.**

### The falsifier, stated up front

If `agent-harness` ends up with dozens of skills and no crisp line against
core, "not self-documenting" has not constrained anything and the split is
still notional. **Measured below: 17 of 55 `folio-core` skills.** That is a
real constraint — it excludes 38 — but it is more than "a handful", and §"What
I would cut further" says where I would push if you want it smaller.

## `agent-harness` — the minimum

### Schemas (`.ts`, minimal)

The harness owns the vocabulary of *work*, not of *content*.

| schema | why the harness |
|---|---|
| `Skill` | what an actor knows how to do |
| `Tool` | how work actually gets done; a KG node, not a shell string |
| `Task` | the unit assigned to an actor in a swimlane |
| `Actor` / `Role` | who may do what — RBAC |
| `Process` (BPMN) / `Decision` (DMN) | the deterministic workflow itself |
| **`Todo`** | user/agent workflow state (16:28, explicit). **Already exists** — `TodoItem`, `schemas/types.ts:1330`. It moves; it does not need writing. |
| **`Bean`** | ditto, and **this one is genuinely missing**. `BeanRef` (`src/workflow/bean-link.ts:40`) is a *reference* to a bean, not a schema for one. |
| `AgentHarness` declaration | which directories an instance scans, and each one's graph kind — already built, `schemas/agent-harness.ts` |
| `Content` (abstract) | the *base* only: identity, label, provenance. No block kinds, no profiles. |

**Of the two, only `Bean` is the gap** — I checked rather than assuming, and
the answer changed the recommendation below.

`TodoItem` already exists at `schemas/types.ts:1330` and carries `id`,
`summary`, `comment`, `status`, `priority`, `origin`, `targetLabel`,
`assignee`, timestamps, `updatedBy`, `data`, `related`, `author`. Its
`TodoStatus` union *already includes `blocked`*. So the Todo half of 16:28's
"add if not exists" is a **move, not a write**.

`Bean` is genuinely absent. Beans are markdown files with YAML front matter and
no TypeScript schema; the only Bean-shaped type is `BeanRef`
(`src/workflow/bean-link.ts:40`), which is a *reference* to a bean rather than a
schema for one. A workflow-state format with no schema cannot be validated,
cannot carry a QA sidecar, and cannot be a KG node.

### Skills — 17 of the 55 in `folio-core`

Classified by reading each skill's description, not its filename — the
[bean `dh4f`](https://github.com/litlfred/folio-assistant/issues/223) lesson.

| skill | why the harness |
|---|---|
| `bean-coordination` | cross-session claim discipline |
| `todo-manager` | work-plan maintenance and the turn-report rules |
| `pending-show` | read-only view of session pending work |
| `session-intent` | session-start intent, session-end results |
| `continual-progress` | PR from the first commit; visibility of in-flight work |
| `coordinate` | multi-PR coordination toward a shared goal |
| `pickup` | resume an existing open PR |
| `watch` | background-watch a branch or PR |
| `prepare-merge-auto` | the merge pipeline as a process |
| `idle-backlog` | what an agent does while blocked |
| `dispatch-agent` | background sub-agents — the swarm entry point |
| `interaction-modality` | how to talk to the person before deciding what to say |
| `symbiotic-interaction` | the three epistemic registers of author input |
| `crdm-detect` | feature-request detection (16:16, explicit) |
| `crdm-requirements-workflow` | the six-phase process (16:16, explicit) |
| `getting-started` | folio-creation triage (16:13, explicit) |
| `repo-conversion` | laying the harness over an existing repo — bootstrap |
| `integration-watcher` *(abstract parent only)* | the shared watcher mechanics; the concrete watchers are downstream |
| `directory-conventions` | the declaration and its graph kinds |

Plus the **narrative skill the 16:13 comment asks for and which does not yet
exist**: how an agent reads a BPMN swimlane and its tasks as process state for
the role it is playing, and how it recovers when it finds itself outside the
process. That is new writing, not a move.

### Documentation — the smallest set

Prose an agent reads, not pages a reader browses:

- the data models above, described as *one deterministic workflow*: Actors with
  Skills work Tasks in a Business Process, assigned by swimlane role;
- context-handling expectations, and bean info/workflow/management;
- a minimal coding policy ([#243](https://github.com/litlfred/folio-assistant/issues/243));
- how Tools are made available in shell/CLI and optionally as MCP, and how a
  Task's I/O corresponds to a Tool's inputs and outputs (16:28).

### Tools — exactly one

Per 16:28, the harness may hold **beans and nothing else**: the bean-management
skills, plus the Tool node describing how to install the CLI. MCP not required.

**The Tool KG stays in the harness**, per 16:13 — that is what makes the
harness bootstrappable: it can describe its one tool using its own vocabulary,
without a renderer.

## `agent-harness-tools` — the minimum

Almost empty by construction, and that is the point.

| item | note |
|---|---|
| beans CLI Tool node | install, invoke, I/O contract |
| `install-beans.sh` | the one script |

**All code snippets live here, not in skills** (16:13). Skills should carry
minimal code; a snippet in a skill is a Tool that has not been declared. That
is a QA audit criterion, not a style note — see the strawperson below.

## Strawperson: the Tools-repo schema

The 16:13 comment asks for a schema for Tools-repo contents plus options with
pros and cons. Here is the shape, written in the carrier the section below
settles on — **Zod is the authoritative form**, and the TypeScript type is
inferred from it rather than declared alongside it, so there is one definition
and not two that can drift.

```ts
// schemas/tool.ts
export const ToolDefinitionSchema = z.object({
  id: z.string(),                                   // stable KG node id
  title: z.string(),
  summary: z.string(),

  /** How to obtain it. */
  install: z.object({
    cli:       z.string().optional(),
    container: z.string().optional(),
    service:   z.string().optional(),
  }),

  /** How to run it, per environment. */
  invoke: z.object({
    shell:     z.string().optional(),
    mcp:       z.object({ tool: z.string() }).optional(),
    container: z.string().optional(),
  }),

  /** The contract a Task binds against — the 16:28 requirement. */
  io: z.object({
    inputs:  z.array(z.object({
      name: z.string(), schema: z.string(), required: z.boolean(),
    })),
    outputs: z.array(z.object({
      name: z.string(), schema: z.string(),
    })),
  }),

  /** Skills this tool can satisfy. One skill may have several tools. */
  satisfies: z.array(z.string()),

  requires: z.object({
    os:      z.array(z.string()).optional(),
    runtime: z.array(z.string()).optional(),
    network: z.boolean().optional(),
  }).optional(),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
```

The `io` block is the part that earns its keep: it is what lets a Task's inputs
and outputs be checked against the Tool that will execute it, rather than
hoping they line up.

Two fields are deliberately loose at this stage and should be tightened before
anything is built on them. `io.*.schema` is a `string` — presumably an IRI into
the schema graph, but nothing yet says which, and an unresolvable reference is
the failure mode the `io` block exists to prevent. `satisfies` is a bare array
of skill ids with no check that the skills exist; that is the same
declared-but-absent defect `dh4f` found in the pipeline scripts, where a
consumer scans nothing and reports a clean run.
### Carrying it — authored once in Zod, rendered downstream

**Decided (2026-09-18, by the repository owner): the `.ts` Zod schema is
authoritative, and as many downstream renderings are generated from it as make
sense — JSON-LD and JSON Schema to begin with.** That is how every other schema
in this repository is defined, and the Tools schema gets no exception.

```
schemas/tool.ts            ← AUTHORITATIVE.  Zod + the inferred TS type.
  │
  ├─→ schemas/generated/Tool.schema.json      JSON Schema  (validation, editors)
  └─→ kg/tools/<id>.jsonld                    JSON-LD      (KG node, queryable)
```

The generation direction is the whole decision. `scripts/generate-schemas.ts`
already walks a map of Zod schemas through `zodToJsonSchema` into
`schemas/generated/*.schema.json`; adding `Tool` is one entry in that map, not a
new mechanism. The JSON-LD side has its precedent too — `toJsonLd()` in
`schemas/agent-harness.ts` projects a Zod-validated declaration into the folio
namespace. Both renderings are derived artefacts: regenerate, never hand-edit,
exactly as `docs/reference/skills/` and `docs/reference/skill-instructions/` are
already treated.

#### Why not the other three, including the one I first recommended

| | **Zod `.ts`, rendered down** | **JSON-LD authored** | **TS, no renderings** | **Skill front-matter** |
|---|---|---|---|---|
| **shape** | one Zod schema; per-tool instances validated against it | one hand-written `.jsonld` per tool | one `.ts` per tool, and nothing else | YAML block in the skill `.md` |
| **author-time checking** | yes | **no** — a typo is a runtime discovery | yes | no |
| **KG node** | yes, generated | yes, natively | **no** — needs a projection nobody wrote | no — unqueryable without parsing Markdown |
| **readable without a TS toolchain** | yes, via the renderings | yes | **no** | no |
| **number of truths** | **one** | one | one | one |
| **verdict** | **decided** | superseded | insufficient | **do not** |

An earlier draft of this page recommended authoring the JSON-LD directly, with
Zod validating it in CI. **That is the same two artefacts with the authority
pointing the wrong way**, and the difference is not cosmetic:

- **A hand-authored JSON-LD node is unchecked until CI runs.** Under the decided
  direction the Zod schema *is* the type, so a malformed tool definition fails
  at `tsc`, in the editor, before it is committed. Validation-after-the-fact
  catches the same error strictly later and only if CI is green — and this
  repository has just spent a bean (`dzl3`) on a suite that was not running at
  all, so "CI will catch it" is a claim with a poor local record.
- **It would have been a fourth pattern in a repo that already has one.** Zod →
  JSON Schema is `generate-schemas.ts`; Zod → docs is `generate-docs.ts`; Zod →
  JSON-LD is `toJsonLd`. Authoring the rendering and validating backwards is the
  only shape here that would have run against all three.
- **"Language-agnostic" was never the trade it looked like.** A shell or Python
  consumer reads the *generated* JSON-LD and JSON Schema under the decided
  direction just as well as it reads a hand-authored one. Nothing is lost by
  generating them; what is gained is that they cannot disagree with the type.

**C — front-matter in the skill — is still worth rejecting explicitly**, and for
unchanged reasons: it is the least work today, it directly contradicts the
instruction that code snippets belong in tools rather than skills, and it caps
the model at one tool per skill, which kills "several Tools may satisfy one
Skill" before it is built.

#### What "as many renderings as make sense" means in practice

Two now, and a test for any third. A rendering earns its place when a real
consumer cannot read the ones that exist: JSON Schema because editors and
validators speak it, JSON-LD because the KG query path does. A third — SHACL, an
OpenAPI fragment, a Turtle serialisation — is added when something needs it, not
in anticipation. Each one is another file to regenerate and another chance for a
stale artefact to be read as current, so the bar is a consumer, not a
possibility.

The corresponding rule: **a rendering is never the place a fix lands.** If a
generated `Tool.schema.json` is wrong, `schemas/tool.ts` is wrong; edit that and
regenerate. A `--check` mode in CI (the pattern `gen-skill-docs.ts --check`
already uses) is what makes that enforceable rather than merely stated.

## The documentation move-table

Measured on `main` at `d8632b6`: **18 top-level pages, 8 guides, 20 BPMN
processes, 115 skills across 9 packages.**

Legend — **AH** `agent-harness` · **AHT** `agent-harness-tools` ·
**C** `folio-assist-core` · **CT** `folio-assist-core-tools` ·
**S** `folio-asst-sci` · **W** `smart-base`/`smart-kg` · **FA** stays put

### Top-level pages (`docs/*.md`)

| page | lines | → | reasoning |
|---|---:|---|---|
| `agentic-harness.md` | 349 | **AH** + **C** | **Splits.** The interaction model, session lifecycle and request classification are harness; the published *page* is core. This is the clearest example of the whole exercise: the content is harness, the rendering is core. |
| `crdm-methodology.md` | 768 | **AH** | Feature-request process, explicit at 16:16. Largest single doc. |
| `beans-and-todos.md` | 169 | **AH** | Workflow state, explicit at 16:28. |
| `accessibility.md` | 219 | **AH** + **C** | **Splits.** User modalities are harness (how to talk to a person); dark/light, QR, contrast are core UI. |
| `publication-workflow.md` | 505 | **AH** + **C** | **Splits.** The BPMN index and the HCI validation gate are harness guardrails; draft→publish is core. |
| `architecture.md` + `architecture/*` | 131 + 4 pages | **C** | Describes the platform for readers; self-documentation is core's job. |
| `content-types.md` | 265 | **C** | Block kinds, profiles. |
| `skills.md` | 256 | **AH** | Skills, roles, RBAC composition — harness vocabulary. |
| `getting-started.md` | 271 | **AH** | 16:13, explicit ([#232](https://github.com/litlfred/folio-assistant/issues/232)). |
| `installation.md` | 186 | **AH** + **AHT** | Harness install story; the scripts are tools. |
| `translation-support.md` | 684 | **C** | Rendering-facing; six UN languages are a core UI default. |
| `document-ingestion.md` | 241 | **C** | Content intake. |
| `evidence.md` | 205 | **S** | Evidence/provenance for formal claims. |
| `sage-mcp.md` | 70 | **S** | Sage. |
| `qou-migration-checklist.md` | 70 | **FA** | One folio's checklist; should not survive the split at all. |
| `folio-assistant-migration.md` | 289 | **FA** | Historical record of the beans migration. |
| `contributing.md` | 86 | **AH** | Coding policy ([#243](https://github.com/litlfred/folio-assistant/issues/243)). |
| `index.md` | 118 | **C** | Site landing page. |

### Guides (`docs/guides/`)

| guide | lines | → | reasoning |
|---|---:|---|---|
| `agent-onboarding.md` | 202 | **AH** | Orientation for an agent — the harness's core job. |
| `new-content-type.md` | 117 | **C** | Adding an adapter. |
| `writing-a-document.md` | 303 | **C** | Authoring. |
| `writing-a-paper.md` | 342 | **S** | Lean + LaTeX. |
| `reseeding-the-lean-cache.md` | 288 | **S** | Lean toolchain. |
| `who-smart-dak.md` | 97 | **W** | L2. |
| `who-smart-ig.md` | 144 | **W** | L3. |

### BPMN processes (`skills/workflows/`) — 20 files

| process | → | reasoning |
|---|---|---|
| `crdm-requirements` | **AH** | 16:16. |
| `bean-lifecycle` | **AH** | Workflow state. |
| `getting-started` | **AH** | Bootstrap. |
| `editing-hci-validation` | **AH** | The validation gate is a guardrail. |
| `content-lifecycle`, `draft-to-publication`, `content-change-review` | **AH** *(definition)* + **CT** *(rendering)* | The process is a guardrail; the diagram a reader looks at is core-tools. Per 16:28: *skills on how they are guardrails stay in agent-harness*. |
| `authoring-a-document` | **C** | Per content type. |
| `authoring-a-paper` | **S** | |
| `l2-dak-authoring`, `l3-fhir-pipeline`, `ig-incremental-build` | **W** | |
| `document-ingestion`, `ingest-*` (4), `evidence-retrieval` | **C** | Ingestion pipeline. |
| `translation-workflow`, `human-translation-workflow` | **C** | |

### Skills (115 across 9 packages)

| package | count | → |
|---|---:|---|
| `folio-core` | 55 | **17 → AH**, ~30 → **C**, ~8 → **S** (table above) |
| `folio-paper-adapter` | 47 | **S** |
| `content-lifecycle` | 8 | **C** |
| `folio-document-adapter` | 4 | **C** |
| `authoring-who-smart-guidelines` | 1 | **W** |
| `framework`, `remote-packages`, `authoring-math`, `authoring-document` | 0 `.md` | manifests only — follow their package |

## User todo management — suggestions

The 16:28 comment asks for these explicitly, so they are proposals rather than
findings.

**1. Todo and Bean are the same object at different audiences — and `TodoItem`
is already most of it.** A bean is agent work-plan state; a Todo note is a
user-authored sticky. Both are "a unit of intent with status, provenance and
hierarchy", and `TodoItem` already has everything except hierarchy. I would
**extend `TodoItem` with an `audience` discriminator** (`agent` | `human`)
rather than write a second schema, and make the bean store a serialisation of
it. Two schemas means two answers to "what is outstanding", free to disagree —
the exact defect `AGENTS.md` records for the todos-vs-beans split that beans
resolved once already.

**2. Hierarchy is the one field genuinely missing.** `TodoItem` has `related[]`
for threading but **no `parent`** — I checked. The 16:13 comment wants child
Todos with navigation into the hierarchy, and 14:48 wants sub-beans for parallel
work; both are `parent?: string` plus an ordering key. That is a one-field
change to an existing schema, not a new mechanism.

**3. Blocking exists but is untimed.** `TodoStatus` already includes
`"blocked"` — "waiting on external input (author, upstream change)". What it
lacks is 14:48's timeout and handoff. I would add
`blockedOn?: { what, since, expires, handoff }`, so an expired block becomes a
*signal* rather than a bean that quietly sits forever, and so a second agent
knows what it is inheriting.

**4. The rendering is core's, the state is the harness's.** Sticky-note styling,
drag/resize, and the metadata for position belong in `folio-assist-core-tools`;
the Todo schema stays in the harness. This is the 16:28 rule applied
consistently, and it is what keeps a headless agent able to read and write
Todos with no renderer present.

## What I would cut further

If 17 harness skills is more than you want, these four are where I would push,
and each is a judgement you may reverse:

- **`prepare-merge-auto`, `pickup`, `watch`, `coordinate`** are all *PR
  choreography*. They are genuinely agent-workflow, but they assume GitHub.
  A harness that must run without a forge would put them in a
  `agent-harness-github` sibling rather than the core.
- **`repo-conversion` and `getting-started`** overlap heavily; they are
  plausibly one bootstrap skill.
- **`symbiotic-interaction` and `interaction-modality`** are both "how to read
  the person"; one skill with two sections would do.

That would take 17 → about 11.

## What is deliberately not here

- **No implementation.** Nothing in this page creates a repo or moves a file.
- **The `folio` graph kind is currently mis-sited.** `schemas/agent-harness.ts`
  lists `folio` among the harness's graph kinds, which contradicts 16:28 —
  a renderable kind belongs to core. Tracked separately; it is a small
  correction, not a rewrite.
- **Swarm management** (14:48 — model levels, swarm size, CPU) is named as a
  separate skill set and is not designed here.
- **The L1/L2 boundary** still needs WHO domain context, unchanged from the
  [migration plan](migration-plan.html).
