---
layout: default
title: Migrating AGENTS.md into skills
parent: Proposals
nav_order: 3
---

# Migrating `AGENTS.md` into skills — the classification

Bean [`1hsf`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-1hsf--migrate-agentsmd-migration-debt-into-skills-and-te.md).
This is the **survey**, not the migration: it classifies every section and names
its destination, so the moves that follow can be reviewed one at a time against
a stated plan rather than judged after the fact.

`AGENTS.md` classifies itself, in its own banner:

> `AGENTS.md` is a bootstrap pointer, not the source of truth. … **Sections
> below that still carry substantive rules rather than pointers are migration
> debt, not precedent. Adding to them widens it.**

So the three categories are the file's own, not invented here.

| | meaning |
|---|---|
| **BOOTSTRAP** | what an agent needs in its first minutes, before it can ask for anything. Legitimately here. |
| **POINTER** | a paragraph that orients and sends you to the skill. Legitimately here. |
| **DEBT** | substantive rules with no home in `skills/`. The thing to move. |

## The measurement that makes "debt" objective

Seven sections already **say** the discipline lives in a skill. Six of them then
carry the discipline anyway. Declaring yourself a pointer is not being one, and
the gap is measurable in lines:

| section | declares itself a pointer? | lines |
|---|---|---|
| Agentic harness — interaction model | yes | **8** |
| Context before the question (STRICT) | yes | 39 |
| Work-plan & todos — use `beans` | yes | 73 |
| Opening a bean or a topic (STRICT) | yes | 112 |
| More | yes (per bullet) | 134 |
| Actors, roles and skills | yes, twice | 152 |

**One section is a pointer.** The rest are essays that open by saying they are
not. Measured 2026-09-19 on `4d76d9da`; `AGENTS.md` is 1,289 lines total.

## Every section

Destinations are marked with how far they were checked. **verified** = the named
skill was read and does own the subject. **none found** = searched and nothing
owns it; a skill has to be written. Nothing here is asserted from a filename.

| # | section | lines | class | destination |
|---|---|---|---|---|
| 1 | New here? Start with the onboarding guide | 13 | **POINTER** | — keep |
| 2 | Content types — `document` is the base, `paper` extends it | 45 | **DEBT** | `folio-document-adapter` owns the profile rules; the adapter-vs-profile distinction has **none found** |
| 3 | Starting a new folio | 16 | **POINTER** | `getting-started` — *verified*, it triages and routes exactly this |
| 4 | Commands | 16 | **BOOTSTRAP** | — keep |
| 5 | Where the harness keeps its state — `beans/` is a graph | 112 | **DEBT** | `directory-conventions` — *verified*, already carries the declaration schema |
| 6 | Work-plan & todos — use `beans` | 73 | **DEBT** | `todo-manager`, `bean-coordination` — *verified* |
| 7 | README sections — the folio owns the file | 95 | **DEBT** | **none found** — `docs-generation` generates doc artefacts, not README markers |
| 8 | CI health — a red workflow looks like a green one | 50 | **DEBT** | **none found** — the `ci-health-watcher` subagent owns the subject, but an agent is not a skill |
| 9 | Actors, roles and skills — a role is a swimlane | 152 | **DEBT** | `role-model` — *verified*; the audit half may want its own |
| 10 | Subagents with persistent memory | 140 | **DEBT** | **none found** — the largest orphan in the file |
| 11 | At session start | 67 | **BOOTSTRAP + DEBT** | the `beans`-bootstrap half is bootstrap; the sweep's contents belong with `session-intent`/`coordinate` |
| 12 | Agentic harness — interaction model | 8 | **POINTER** | — keep, and it is the model for the rest |
| 13 | Feature requests and CRDM | 35 | **POINTER** | `crdm-detect`, `crdm-requirements-workflow` — *verified* |
| 14 | Say which process you are in — every turn | 22 | **DEBT** | `process-state` — *verified* |
| 15 | Working an issue — announce, then re-check | 31 | **DEBT** | **none found** |
| 16 | Commit early, commit often, always PR (STRICT) | 64 | **DEBT** | `continual-progress` — *verified*, it already carries rules 1–3 and says so |
| 17 | Context before the question (STRICT) | 39 | **DEBT** | `interaction-modality` §4.1 — *verified* |
| 18 | Opening a bean or a topic (STRICT) | 112 | **DEBT** | `opening-brief` — *verified* |
| 19 | More | 134 | **MIXED** | mostly pointers already; the `uses[]`/`interprets` bullet is DEBT → `uses-editorial-review` |

**Four subjects have no owning skill**: README sections, CI health, subagent
memory, and working an issue — 316 lines between them. Those are not moves, they
are skills to write, and they should not be smuggled in as part of a move.

## Correcting two claims carried into this bean

Both were asserted by an earlier survey and are wrong. They are recorded because
the bean's own warning is that `AGENTS.md`'s counts go stale and must be
re-measured rather than quoted.

**"The ALWAYS-PR rule is an orphan."** It is not. `continual-progress.md` carries
it as rules 1–3 and explicitly says *"(Operationalises AGENTS.md 'Branch + PR
workflow' rule 2.)"*. The section is still DEBT — `AGENTS.md` holds 64 lines of
rationale the skill does not — but it is a consolidation, not a rescue.

**"52 skill files cite non-existent `AGENTS.md` sections."** The real numbers,
from `bun run check:agents-xref`: **54** files mention `AGENTS.md`, **20** cite a
named section, **2** resolve here, **2** name a folio's file, **16** are
unresolved. And "non-existent" is the wrong word — see below.

## The constraint that shapes every move: there are two `AGENTS.md`

The platform carries one. **Every folio carries its own**, and skills are synced
*into* folios, where the same sentence resolves against a different file.
`AGENTS.md` says so itself about `litlfred/qou` §"Branch + PR workflow", and
`continual-progress.md` cites exactly that section — correctly.

So a citation that does not resolve here is **not** proven dead: a platform-only
checkout cannot read a folio's `AGENTS.md`. `check:agents-xref` reports three
states for that reason, and `unresolved` means *nothing here accounts for this*.

Two consequences for the migration:

1. **Every citation should say which file it means**, and after a move it should
   name the skill instead. A skill citing a skill is unambiguous in both repos.
2. **A rule that belongs to the folio must not be moved into a platform skill**
   — that is the platform/folio boundary, and it is the one error in this
   migration that a revert does not cleanly undo, because by then two repos
   disagree about who owns the rule.

## The hazard every move runs into: some skills exist in three copies

`AGENTS.md` carried this as a standing warning; it belongs here, because it is a
fact about **how to move things**, not about how to work.

`todo-manager` is the worked case. Measured 2026-09-19 on this branch:

| copy | lines | generated? | CI-gated? |
|---|---|---|---|
| `skills/folio-core/todo-manager.md` | 438 | no — hand-authored | yes, indirectly (its mirror drifts) |
| `docs/reference/skill-instructions/todo-manager.md` | 406 | **yes**, from the row above | **yes** — `gen-skill-docs.ts --check` |
| `.claude/skills/local/todo-manager.md` | 411 | no | **no** |

**The two hand-authored copies fail in opposite directions**, and that asymmetry
is the thing to plan around:

- Edit `skills/folio-core/` and forget to regenerate, and CI goes red. Loud. It
  has taken `main` red before.
- Edit `.claude/skills/local/` and **nothing checks anything.** `GROUPS` in
  [`scripts/gen-skill-docs.ts`](../../scripts/gen-skill-docs.ts) does not list
  that directory.

The divergence between the two hand-authored copies is **205 diff lines**. Which
copy is canonical is a question for whoever owns the skills layout; resolving it
as a side effect of a migration edit is how one of them quietly becomes wrong.

**So the rule for this migration is: when a destination skill has a local copy,
write the same addition to both.** Sections 16, 17 and 18 all land in skills
with one. §"Opening brief" was added to both; the count above is after that, and
the migration has not widened the gap.

Do not quote the 205 — re-measure. An earlier version of this note said 188, and
a sibling's edit moved it to 261 before this branch's additions brought it back.

## Sequence

1. ✅ `check:agents-xref` — so a break this migration causes is distinguishable
   from the 16 already there.
2. ✅ **Backlog cleared, and the check is in CI.** The 16 unresolved citations
   are zero; `check:agents-xref:strict` gates `code-quality-gates.yml`.

   How, because the method is the point. Nine repointed at a platform skill that
   verifiably owns the rule. The rest could not be settled by reading this
   repository, so **`litlfred/qou` was cloned and checked** rather than guessed
   at: five named real sections of its 6,036-line `AGENTS.md` — four headings
   and one bullet — and are now **qualified** rather than repointed, because the
   rule genuinely is the folio's. **Two, `be frugal` and `Executing actions with
   care`, were in neither repository** and became plain rules with no citation.
   Those two are the only genuinely dead references of the original twenty.

   That required one change to the checker: a citation can now **declare** which
   `AGENTS.md` it means. Before it, `folio` was reachable only when the
   platform's own prose attributed a section — so clearing the backlog would
   have meant restating a folio's table of contents here, which is the boundary
   violation this whole plan exists to avoid.
3. Move the **verified-destination** sections (5, 6, 9, 14, 16, 17, 18), one PR
   each, leaving a pointer of roughly section 12's length.
4. Write the four missing skills (7, 8, 10, 15), then move.
5. Wire `check:agents-xref --strict` into CI once the backlog is zero.

**Step 1 comes first and already has.** Every later step is a move, and a move
without the check is a move whose damage cannot be told from the 16 findings
that were there before anyone touched the file.

## What would falsify this plan

If moving section 5 into `directory-conventions` takes that skill past the point
where an agent will read it, the destination is wrong and the section needs its
own skill instead. `AGENTS.md`'s own 200-line agent-memory budget is the nearest
precedent for a document nobody finishes: length is a real constraint, not a
tidiness preference.
