---
# folio-assistant-qif9
title: 'SKILL FRONT MATTER: `roles:` carries two vocabularies and nothing validates either'
status: todo
type: bug
created_at: 2026-09-19T19:15:37Z
updated_at: 2026-09-19T19:15:37Z
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

- **Role** — the BPMN swimlane, declared in `skills/roles/roles.json` (31).
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
