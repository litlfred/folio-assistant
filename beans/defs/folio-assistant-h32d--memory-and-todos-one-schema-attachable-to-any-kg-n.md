---
# folio-assistant-h32d
title: 'Memory and todos: one schema, attachable to any KG node, stickies in the rendered folio'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T00:58:13Z
updated_at: 2026-09-19T11:08:23Z
parent: folio-assistant-8jt6
---


**Requirements capture, 2026-09-19.** Stated by the author; recorded verbatim in
substance before any design, because it arrived as one long message and the
author types with difficulty. Nothing here is my synthesis unless marked so.

Supersedes the framing of `folio-assistant-7sf1` (move MEMORY.md into the kg
graph), which is now the narrow first slice of this.

## 1. The model

**Memory workflows are GENERIC — not per actor kind.** The same mechanism
serves a human and an agent; what differs is the storage and the trigger point.

| | memory | workflow management |
|---|---|---|
| human actor | **todos** | *— nothing —* |
| agent actor | **`MEMORY.md`** | **beans** |

**Triggers**, and there are two kinds:

- **Content-based**, actor-agnostic: *"this is something new"*, *"you have not
  seen this in a while"*.
- **Actor-specific and deliberate**: *"I want to dispatch an agent with a
  specific memory context for a narrow task."*

**The associations are part of the SKILLS.** Memory and todos attach to:

- tasks
- processes
- decision tables
- folios
- any other content type
- or at the **top level** of the folio

**Todos act like stickies**, and the **human actor can alter their contents** —
unlike a generated artefact.

**One metadata schema base, shared by todos and memory**, for cross-referencing:
issues, PRs, beans, human actors, roles, tasks, SHAs, and so on.

**Memories are overlaid in DEPENDENCY ORDER**, the same way other context
setting composes. *(Author's open question: a tool node with a library for
this?)*

## 2. The rendering — stickies in just-the-docs

- A todo on a web page shows at the **top of the page as a sticky icon with a
  count**.
- Opening them shows the stickies **on the page, positioned relative to the
  content they are assigned to**.
- The user can **expand and contract individual stickies**.
- **Stacking follows the hierarchy of business subprocesses.**
- A **toggle icon in the navbar tiles** shows todos.
- Opening the todo icon opens, **in the main display, a panel with all the
  stickies neatly lined up**.
- The user can **pick a sticky up and move it off the display panel**, making it
  **fixed on the web page** (floating).
- **Closing a floating sticky returns it to the display panel.**
- While floating, it is **greyed out on the sticky panel**; clicking the greyed
  (disabled) entry also returns the sticky.
- **`[x]` icon** closes an open sticky.
- **Pencil icon** edits the markdown.

## Status

CRDM Phase 1 — needs captured, not yet synthesised into requirements, not
started. No GitHub issue yet: CRDM requires one for feature work and forbids
creating it without the author's permission, so that is the next ask.

Issue scan done 2026-09-19 — nothing existing covers this. Open issues are
#203 (business requirements gathering — CRDM), #202, #201 (migration records),
#247 (cross-agent skill install), #204 (IG incremental build).

## Progress — the schema layer, 2026-09-19

**A sibling had already built the todo half.** `schemas/todo.ts` (279 lines,
*"Todos are content: a declared `todos` graph, tagged by the role model"*),
plus `todo-graph.ts`, the `TodoStatus`/`Priority`/`Origin` types, and 17 tests.
Found by looking before building — the same check-before-you-create discipline
beans has, applied to code. What was missing was exactly the remainder of this
spec.

**Done:**

- `schemas/carried-note.ts` — the shared base. The reference vocabulary moved
  here (`TaskRef`, `ExternalIdentity`, `KgRef`), plus the missing third kind,
  **`ArtefactRef`** for issues, PRs and commits. That gap was real and visible:
  agent memory records them in PROSE today — an entry reading "Bean `lq7e`" is
  a string in a paragraph that nothing resolves and nothing audits.
- `schemas/todo.ts` now **extends** the base, keeping `status`/`priority`/
  `origin` as the human-specific half, and re-exports every moved type so no
  existing importer breaks.
- `schemas/memory.ts` — the agent half. `label` (stable/trap/baseline) lifted
  out of `## LABEL — heading` prose into a field; `overlayMemory` for
  dependency-order composition; `memoryForRoles` for the scoping that ends the
  duplication.

**The change I would most want reviewed:** `MemoryNodeSchema` **refuses a
`baseline` without `measured`** (command, date, result). `AGENTS.md` has always
said a BASELINE must carry its command and date and never be quoted as a
current answer — as prose. This is that rule made structural, and it is the
`judgementOnly` lesson applied again: a rule stated only in prose is one the
next agent re-litigates. Verified by a test that the refusal fires.

**Deliberately NOT answered:** scoped, call-path overlay. `overlayMemory`
handles the DEPENDENCY axis only, which is the `inherits`-like one.
`AGENTS.md` records that roles compose two ways and that merging them *"would
give every role every caller's skills, and a closure that broad cannot fail an
audit"*. Answering both with one function would make that mistake a second
time, one layer up.

**Still open:** todos graph is not declared in `cat-harness.json` (it lists
`tools`, `schemas`, `kg`, `beans` only) and no todo files exist on disk — the
sibling's schema is ahead of its graph. The generator that assembles
`.claude/agent-memory/<agent>/MEMORY.md` from scoped entries is not written.
The sticky UI is untouched.

## Progress, 2026-09-19 — the generator landed

`schemas/carried-note.ts`, `schemas/memory.ts`, `scripts/agent-memory.ts`,
`scripts/tests/agent-memory.test.ts`. PR #314. 28 hand-maintained entries →
25 nodes under `skills/memory/`; `bun run agent-memory` assembles, and
`agent-memory:check` gates in CI.

Four things measurement changed, recorded because each was a claim made
before it was checked:

1. **"5 subject areas duplicated" was wrong — it is 3.** The BASELINE
   "re-measure, do not quote" is a TITLE collision with DISJOINT bodies, not
   a duplicated fact. The number came from reading the files; the correction
   came from parsing them.
2. **The schema refused all three BASELINE entries, correctly.** None stores
   a number; they are tables of commands to run. Relabelled `stable`. The
   `measured` refinement now has zero instances in the corpus.
3. **Summary-derived ids would have dropped an entry.** Those two entries
   collide on any summary slug, and `overlayMemory` resolves by id.
   Duplicate ids are now refused rather than resolved.
4. **All 25 nodes were audited as skills**, with 25 bogus `kg-qa/` sidecars.
   Fixed by the `part-of:` contract generalised: a `.md` declaring its own
   `$schema` is not a skill.

## Still open, and the one that needs a decision

**Scoping is by agent, which is the defect this was supposed to end.**
`memoryForRoles` exists and is unused, because the three memory-carrying
subagents (`ci-health-watcher`, `content-pipeline-navigator`,
`platform-boundary-guard`) are **not declared actors at all** —
`.claude/skills/actors/` holds 24 participants and none of them.

Deciding this means choosing, for each of the three, which of the 30
declared roles it takes on. Three ways to go, with what each costs:

- **Map onto existing roles.** No new roles, and `role-has-actor` gains three
  actors. But none of the 30 fits cleanly: `ci-health-watcher` reads
  pipelines rather than being one, and `build-pipeline` / `validation-pipeline`
  are the closest candidates. A forced mapping is a wrong edge in the graph
  that every later audit trusts.
- **Add roles for them.** Honest edges, and `memoryForRoles` starts working
  immediately. But it is exactly what `AGENTS.md` warns against under
  `skill-in-role-or-process`: "inventing roles and activities to absorb tools
  that do not want them." Three roles with one actor each is a lattice
  describing the tool, not the work.
- **Leave agent-scoping, and say so.** Costs nothing now; the duplication
  stays fixed either way, because one node already reaches several agents.
  The cost is that `memoryForRoles` sits unused as dead code with an argument
  attached to it, and dead code with a rationale is how a wrong idea survives.

No recommendation yet — this is the author's call, and none of the three is
obviously right. The work is not blocked on it: agent-scoping works today.

## AMENDED 2026-09-19 by owner direction — see folio-assistant-d1r6 and folio-assistant-4kj4

Two items captured above are superseded, and this note is the only change I
am making to a bean that is not mine:

- "Closing a floating sticky returns it to the display panel"
- "[x] icon closes an open sticky"

The close control now **discards the sticky to `fsh-guts/`** with a
crumpled-sticky icon. Returning to the panel survives via the greyed board
entry, which this bean already records in the author's own words.

Avatars per kind, in and out of trash, in both schemes, are folio-assistant-4kj4.

Requirements capture here remains yours; I have not resolved or rewritten
it.

--------

## 2026-09-24 — the decision above is SETTLED by evidence, not left open

Re-measured before putting it to the owner:

| subagent | now | role(s) |
|---|---|---|
| `ci-health-watcher` | a declared actor, `kind: system` | `build-pipeline`, `validation-pipeline` (owner, bean `29ij`: *"ci watchers are agents/mechanical roles that are part of the CI process"*) |
| `platform-boundary-guard` | a declared actor, `kind: agent` | `code-reviewer` |
| `content-pipeline-navigator` | **gone** from `.claude/agents/` | — |

So option 1, "map onto existing roles", is what happened, one agent at a
time, and no new roles were minted. There is nothing left to ask.

**What is still undone is plumbing, not a decision:** `memoryForRoles`
(`schemas/memory.ts`) still has **no caller**. The MEMORY.md generator scopes
by agent, not by the roles the agent's actor takes on. Wiring it is the next
unit of this bean.
