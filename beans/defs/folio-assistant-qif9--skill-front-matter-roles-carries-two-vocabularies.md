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
