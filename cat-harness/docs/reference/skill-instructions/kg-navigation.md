---
layout: default
title: 'Reading the knowledge graph'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/kg-navigation/kg-navigation.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/kg-navigation/kg-navigation.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/kg-navigation/kg-navigation.md){: .fa-edit-source }

{% raw %}
> **This is the skill `skill_fetch` serves.** A stub of the same name
> is published as
> [Reading a knowledge graph before you have anything (bootstrap)](local-kg-navigation.html); it only points here.
> Edit this page's source, never the stub.

# Reading the knowledge graph — how to find the skill you need

You are in a fresh container. You have a task, a filesystem, and no memory of
how this repository is laid out. **This is the route.**

It exists because the instruction to take it was written down and the route
itself was not. `AGENTS.md` says *"ask for a skill rather than opening a file"*
and names three tools; the onboarding guide it sends you to answered the same
question with three hardcoded directory paths, which is the practice `AGENTS.md`
opens by warning against — *"hardcoding a path is how a skill goes missing the
moment the layout moves."* One of them had already moved.

## The one fact everything else follows from

**Skills are content in a declared graph, not files in a directory you
memorise.** An instance says where its graph is, in its declaration at its
repository root. It may put it anywhere. In *this* instance the entry reads:

```json
{ "id": "skills", "path": "skills/", "graphKinds": ["skills"] }
```

Read that as three separate things, because they change independently:

| | what it is | stable? |
|---|---|---|
| `id` | this instance's name for the directory | stable across a relocation — that is its job |
| `path` | where it happens to be **here** | not stable, and not yours to assume |
| `graphKinds` | what kind of graph lives there | the vocabulary, shared across instances |

An agent that learned `skills/` learned the one column that is allowed to
change. Ask for the graph; do not navigate to the path.

> **`kg` is the old name for the kind and still reads.** It was renamed to
> `cat-harness` on 2026-09-19 so the kind is named for the layer that defines
> it, like `CatHarness` itself. `GRAPH_KIND_ALIASES` in
> `schemas/cat-harness.ts` maps `kg` → `cat-harness`, so a declaration or a
> query using `kg` resolves and is marked deprecated. **Do not read `kg` as a
> directory `id`** — in this instance the id is `skills`, and text that
> tells you otherwise predates the rename.
>
> **A Subgraph id is its name inside its Harness**, and the Harness name
> qualifies it: `cat-harness.skills`, `bootstrap.skills`. The id was
> `cat-harness` until 2026-09-23. `RENAMED_DIRECTORY_IDS` in
> `schemas/cat-harness.ts` still reads that id as `skills`, so an older
> declaration keeps overriding the entry it meant.

## Tool 1 — the MCP pair

When an MCP server is attached, two calls answer the whole question.

1. **`skill_list`** — every servable skill **with its one-line summary**,
   grouped by package. The summary is the point: it is what lets you pick
   without fetching. (It emitted bare identifiers until 2026-09-19, which is
   why this sentence is emphatic rather than obvious.)
2. **`skill_fetch skill="<id>" package_name="<package>"`** — the instruction
   body, to follow.

For the work plan rather than a skill, **`work_plan_prime`** returns the beans
and each running process's position beside its bean.

**What `skill_list` serves is a registry, not the declaration.** `LOCAL_PACKAGES`
in `src/tools/skill-fetch.ts` maps seven package names to seven paths, resolved
against the server's own location. It is accurate today and it is a second
answer to a question `<name>.json` already answers — so a directory the
instance declares and the registry omits is invisible to `skill_fetch`. That
has bitten: `content-lifecycle` was absent from the table until 2026-09-18
while **52** `<folio:skill ref>` activities across the workflow diagrams named
its skills, so `workflow_next` handed an agent `content-validate` and
`skill_fetch` answered *"package not found"* — for every step of every content
process. `kg:audit`'s `skill-servable` criterion exists to keep that shut.

**Known gap, so you are not surprised.** `resolveSkillDirs` in
`schemas/harness-config.ts` computes the cross-instance overlay from the
declarations — the thing that would make the registry unnecessary — and **has
no caller** outside its own test. Skill discovery is therefore root-only in
practice, and a dependency's skills are not yet reachable. Outstanding Phase 0.1
work; do not design around it being fixed, and do not "fix" it as a side effect
of something else.

## Tool 2 — the filesystem, when there is no MCP

**The harness is designed to work with nothing but files.** Same graph, same
content, no server:

1. Read `<name>.json` at the repository root.
2. Take every `directories[]` entry whose `graphs` includes `cat-harness`
   (accepting `kg` as the deprecated spelling).
3. Read the `.md` files under each — one skill per file, the id being the
   basename.

Both Tools serve the same nodes. Neither is the skill: *knowing that a fallback
exists* is the capability, and an agent that only knows the MCP route is an
agent that stops when the server is absent. See
[`skills-and-tools`](../folio-core/skills-and-tools.md) for why that distinction is enforced
rather than merely preferred, and [`directory-conventions`](../folio-core/directory-conventions.md)
for the declaration's schema and the full list of graph kinds.

## Not everything under the path is a skill

Three rules, each of which has been got wrong here, and each of which is a
**declaration** rather than a guess about a filename. `scripts/known-skills.ts`
is the single implementation; `kg-audit` and `check-workflow-refs` both read it
so they cannot disagree.

- **`.claude/skills/` is not uniformly skills.** `actors/`, `capabilities/`,
  `roles/`, `hooks/` and `requirements/` are other node kinds that live there.
  Reading the tree as skills put 46 non-skills into the set, at which point
  `<folio:skill ref="viewer"/>` resolved — to a capability probe.
- **A `.md` under the skills path that declares its own `$schema` is not a
  skill.** The agent-memory nodes under `memory/` declare
  `folio-memory/v1`. Without this rule the audit treated all 25 as skills and
  wrote 25 bogus QA sidecars beside them. Declaration over location.
- **Some skills exist in three copies and only two are checked.**
  `skills/folio-core/<name>.md` is hand-authored;
  `docs/reference/skill-instructions/<name>.md` is **generated** from it and
  CI-gated, so editing the source without running
  `bun run scripts/gen-skill-docs.ts` takes `main` red — it has;
  `.claude/skills/local/<name>.md` is hand-authored and gated by **nothing**,
  while carrying the most inbound references. **Read the `skills/` copy. Edit
  the `skills/` copy. Regenerate the mirror in the same commit.**

## When the skill you want does not exist

Say so; do not improvise one silently. Coverage is a measured property here and
a gap is information: `skill-in-role-or-process` reports how many skills no role
carries and no activity names, and that number is **not** a defect list — a
skill invoked directly by name is doing its job without appearing in any
diagram. The same applies in reverse. A procedure you had to invent is worth one
sentence in your turn report and, if it will be needed again, a bean.

## How you know you did this right

You can name the graph you read, the Tool you read it with, and the skill you
are following — without having typed a path you learned somewhere else.
{% endraw %}
