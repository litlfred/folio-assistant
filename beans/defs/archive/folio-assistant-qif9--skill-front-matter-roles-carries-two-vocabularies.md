---
# folio-assistant-qif9
title: 'SKILL FRONT MATTER: `roles:` carries two vocabularies and nothing validates either'
status: completed
type: bug
priority: normal
created_at: 2026-09-19T19:15:37Z
updated_at: 2026-09-20T09:16:26Z
parent: folio-assistant-zzmr
---


**Measured 2026-09-19** while triaging `folio-assistant-y1w9`. Found by a
hypothesis failing, which is the useful kind: I expected skills to declare
who performs them, so that binding them to roles would be evidence-backed
rather than invented. 89 of 112 unbound skills DO declare `roles:` — and
only **2** name an actual swimlane role.

## The measurement

Across 178 skill files with front matter, **133 carry `roles:`**:

| value | uses | what it is |
|---|---|---|
| `collaborator` | 101 | **undeclared** — neither a role nor a permission |
| `owner` | 95 | **undeclared** |
| `reader` | 55 | **undeclared** |
| `code-reviewer` | 17 | a declared swimlane role |
| `build-pipeline` | 10 | a declared swimlane role |
| `validation-pipeline` | 10 | a declared swimlane role |
| `editor`, `authoring-agent`, `author`, `reviewer`, `narrative-reviewer`, `qc-reviewer`, `ingestion-agent` | 1–4 each | declared swimlane roles |
| `admin`, `auditor` | 1 each | **undeclared** |

So one field carries **254 uses of an undeclared vocabulary** and **52 uses
of the declared role registry**, and nothing validates either.

## Why this is a defect and not a style question

`AGENTS.md` names three distinct declared objects, and this field collides
with two of them:

- **Role** — the BPMN swimlane, declared in `scenarios/roles.json` (31).
- **Permission** — what an actor may DO, declared in
  `skills/permissions/permissions.json` (13: `content-authoring`,
  `approval-authority`, `release-management`, …).

`reader` / `collaborator` / `owner` are in **neither** list. They read like
forge permission tiers. A reader who meets `roles: [collaborator, owner]`
in a skill and looks them up in `roles.json` finds nothing — the `blv9`
shape, a declaration-shaped value that does not resolve, in the field whose
name promises it will.

**And the two vocabularies are mixed within single files.**
`skills/folio-core/library-ingestion.md` declares
`roles: [ingestion-agent, authoring-agent, collaborator, owner]` — two real
roles and two tier words, in one list, with no way to tell which is which
except by looking each up.

## Why it blocks `y1w9`

`y1w9` needs to triage 110 unbound skills, and the obvious evidence — "the
skill says who performs it" — is unusable while the field means two things.
Only 2 of the 112 could be bound on their own declaration.

Fixing this first would make the rest of that triage mechanical for however
many skills name a real role, instead of judgement for all of them.

## Options, none chosen here

1. **Split the field.** `roles:` keeps the swimlane meaning; the tier words
   move to a new declared field. Requires deciding what the tier vocabulary
   IS, and declaring it — it may be forge permissions, which are a topology
   fact rather than a skill fact.
2. **Rename the tier use.** If `reader`/`collaborator`/`owner` is really
   "minimum access to run this", name it that and leave `roles:` to the
   registry.
3. **Declare the tiers as permissions** and accept one field holding both,
   with a validator that resolves each value against either list.

Whichever: the outcome must be that **every value resolves against a
declared vocabulary**, and a check says so. 254 unresolvable uses is the
thing to end.

## Done when

- [ ] every value in a skill's `roles:` resolves against a declared
      vocabulary, or the field is split so each half does
- [ ] a check enforces it, and fails on a value that resolves to nothing
- [ ] `y1w9`'s triage is re-run against the corrected field, and the
      evidence-backed bucket is recounted

---

## Decisive follow-up, same day: the field is INERT

Before acting on the split, I checked what reads it. **Nothing does.**

| probe | result |
|---|---|
| Skill nodes in the exported graph | 168 |
| …carrying any role-ish key | **0** |
| `gen-skill-docs` output front matter | `layout`, `title`, `parent` — `roles` dropped |
| a validator resolving its values | none found |
| `kg-export`'s `roles`/`permissions` handling | `group === "actors"` only — actor JSON, not skill markdown |

`SkillDefinitionSchema` in `schemas/skill-package.ts` does require `roles`,
but that schema describes a skill **definition object**, not the markdown
front matter, and nothing parses the front matter against it.

So this is not "one field, two vocabularies" — it is **one field, two
vocabularies, and no reader**. 254 undeclared uses plus 52 declared ones,
consumed by nobody, in a field whose name promises it is the role registry.

## Why that changes the options rather than confirming them

The three options above all assume the field MEANS something and the
problem is which vocabulary it speaks. If nothing reads it, splitting it
produces **two** inert fields and the name collision is the only thing
fixed. That is work whose benefit is legibility alone, which may still be
worth it — but it should be chosen knowing that, not by default.

The revised set:

1. **Make it mean something.** Export it, declare both vocabularies,
   validate. Turns 306 annotations into graph edges — and would have made
   `y1w9`'s triage mechanical, since a skill naming its performer is
   exactly the evidence that triage lacks.
2. **Split for legibility only.** As option 1 above, accepting that both
   halves stay inert. Cheapest correct-looking fix; changes no behaviour.
3. **Remove it.** It is documentation masquerading as a declaration.
   **Never unilaterally** — 133 files, and
   `deletion-requires-confirmation` governs.
4. **Leave it and write down that it is inert**, so the next agent does
   not spend an afternoon discovering it. The cheapest honest outcome.

**I am not choosing.** Option 1 is the only one that pays for itself
(it unblocks `y1w9`), but it is also the only one that commits to what
`reader`/`collaborator`/`owner` MEAN — and if they are forge permission
tiers, that is a deployment fact belonging to the topology axes rather
than to a skill.

## What this already earned

`y1w9`'s blocker is now precise: its triage cannot be evidence-backed
until this field either carries the swimlane vocabulary or is replaced by
something that does. That is a smaller, answerable question than "triage
110 skills".

## Default taken 2026-09-19 21:0x — option 4, documented rather than fixed

No answer after ~40 minutes, so the stated default applied: leave the
field and write down that it is inert, so the next agent does not spend an
afternoon rediscovering it. Deliberately the CHEAPEST option rather than
the best — option 1 remains the one that pays for itself, and it is still
open.

Recorded in **`skills/folio-core/role-model.md`**, immediately under the
four-object table. That placement is the point: `role-model.md` is the
authority on what a Role is, and **its own front matter declares
`roles: [reader, collaborator, owner]`** — the document defining the
vocabulary uses the field with a vocabulary it does not define. A reader
meeting the field meets the correction in the same breath.

The note says three things and no more: the two vocabularies with counts,
that nothing reads the field, and — the operative instruction — **do not
read a skill's `roles:` as saying who performs it, and do not add a
binding on its authority.**

This bean stays OPEN. Documenting is not fixing; 306 annotations still
resolve to nothing, and `y1w9` is still blocked.

---

## RESOLVED 2026-09-20 — excised, after rescue, with one exemption the tests found

Owner: *"three zero-reader fields — cleanup/excise"*, *"qif9 ok"*, and the
standing *"retire → put in fsh-guts w/ as much metadata as known, do some git
commit archaeology"*.

### What was done

| step | result |
|---|---|
| rescue | `fsh-guts/retired/skill-roles-front-matter.md` — per-file inventory of all 114 files, census, archaeology, the two open questions |
| excise | `roles:` removed from **114** skill `.md`, **288** annotations |
| KEPT | the **26** `folio-memory/v1` entries — different graph kind, real reader |
| ratchet | `bun run check:retired-front-matter`, gate #44, 12 tests |
| repoint | `src/impact/stakeholder-map.ts` now derives roles from LANES |
| correct | `skills/folio-core/role-model.md` §"is GONE — do not bring it back" |

### The archaeology (the clone was shallow; `git fetch --unshallow` first)

Migrated from `qou` at `2734a70f`, 2026-06-15, in six files. The contract was
explicit — `/** Actor IDs (roles) that may invoke this skill. */`, drawn as
`roles──▶ ActorDefinition.id`. So it was an **access** declaration, which is
why the vocabulary reads like forge permission tiers.

**It never resolved, from the first commit.** `reader.json`,
`collaborator.json` and `owner.json` have **0** adding commits each, across
the entire history. The swimlane `Role` came later and took the word, which is
how the second vocabulary got in.

Growth was copy-paste, never a decision: 6 → 69 (2026-06-29) → 83 → 93 → 140.

### Two readers the first probe missed, both caught by the corpus's own tests

The bean's earlier measurement — *"the field is INERT"* — was **wrong twice**,
and the way it was wrong is the reusable part.

1. **`src/impact/stakeholder-map.ts`** read it through a local `rolesOf()` and
   printed it as *"Roles reached"*. Missed because the probe was against the
   **exported graph**, and this consumer reads the front matter directly.
   Worse than the corpus: `rolesOf` matched only the inline `[a, b]` form, so
   the 28 block-list files read as declaring nothing.
2. **`folio-memory/v1` entries.** `memoryForRoles` filters on `tags.roles`.
   Missed because `MemoryNodeSchema` does not declare `roles` at the top
   level, so the schema probe came back clean. Found when
   `agent-memory.test.ts` failed after the first pass excised all 140: every
   entry untagged means every lane sees everything, and the axis stopped
   discriminating.

**The lesson: sharing a key name across graph kinds is not sharing a field**,
and "nothing reads this" has to be measured per kind, by more than one probe.
The check's exemption is therefore keyed on `$schema`, never on directory.

### The numbers, corrected

Over the 114 skill files: **288 annotations, 260 — 90 % — resolving against
nothing** (`collaborator` 104, `owner` 99, `reader` 56, `auditor` 1). The
earlier "325 / 80 %" figure counted the 26 memory entries, which were never
this field.

### What the repoint bought

`Roles reached:` now prints `authoring-agent, build-pipeline, work-plan` —
every value resolving in `roles.json` — instead of `collaborator, owner`
alongside real roles with nothing telling them apart. A lane binding no
declared role is now reported as *"unknown impact rather than absent
impact"*; it previously contributed nothing and read as nobody affected.
**One real unbound lane surfaced immediately** (`Authoring agent` in
`code-change-review.bpmn`).

### One blind spot found while building the ratchet

`sweepRoots` went blind **twice**, and the same test caught both.

1. It used `skillMdDirs`, which enumerates skill **packages** — and
   `skills/memory/` is not one, nor is the repo-root `.claude/skills/`. 535
   files swept, and the one directory the exemption exists for never opened.
2. Rewritten to name `beans` and `fsh-guts` explicitly, it then missed
   `memory` when `07xs` moved it to the repository root as its own declared
   graph, hours later, on main.

Naming graph kinds is the same hand-kept copy one level up. It now sweeps
**every directory the declaration names**, honouring `scope`, read RAW
rather than through `readDeclaration` — that loader throws on a graph kind
no registry has seen, and a check that goes silent because an unrelated kind
is unregistered is worse than one that fails. **1027** files. The test turns
the exemption off and asserts the suppressed set is non-empty and is
**entirely** memory entries; it is what caught both blindings.

### Done when

- [x] every value in a skill's `roles:` resolves against a declared
      vocabulary — vacuously, the field is gone; the one consumer that
      reported roles now resolves every value it prints
- [x] a check enforces it, and fails on a value that resolves to nothing
- [ ] `y1w9`'s triage re-run — **still open**, and now unblocked differently
      than expected: the evidence is not the skills' own declarations (there
      are none) but the **lane→skill** bindings the BPMN corpus already
      carries, which `stakeholder-map` now resolves. Carried to `y1w9`.

### Not decided, deliberately

What `reader`/`collaborator`/`owner` MEAN. If they are forge permission tiers
that is a deployment fact belonging to the topology axes (#363), not a skill
fact. Either way the field gets declared before it is written — the step the
original skipped.
