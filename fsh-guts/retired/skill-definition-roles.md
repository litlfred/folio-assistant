---
$schema: folio-fsh-guts/v1
title: "`SkillDefinition.roles` — retired"
kind: retired
bean: folio-assistant-y1w9
movedOn: 2026-09-20
summary: >-
  The retired `SkillDefinition.roles` field, kept rather than deleted so a
  reader can tell a considered removal from an accident.
---

<!-- Front matter added 2026-09-23. NOTHING HERE IS NEW: the bean and the date
     were already asserted in the body and the heading below, and the file was
     the sole fsh-guts node carrying neither as a readable field. It went
     unasked because the provenance tests scanned `fsh-guts/proposals/` alone;
     widening them to the whole tree is what surfaced it. Promoted rather than
     invented — a fabricated provenance reads as evidence and is worse than
     none, which is the rule those tests are written on. -->

# `SkillDefinition.roles` — retired 2026-09-20

Bean `folio-assistant-y1w9`. Companion to
[`skill-roles-front-matter.md`](skill-roles-front-matter.md), which retired the
markdown `roles:` front-matter key on the same day. **They are different
fields with different values and different (non-)readers**, and conflating
them is how this one was nearly mis-fixed.

## What it was

```ts
export interface SkillDefinition {
  …
  /** Actor IDs (roles) that may invoke this skill. */
  roles: string[];   // REQUIRED, both here and in SkillDefinitionSchema
}
```

Origin: commit `2734a70f21`, 2026-06-15, *"feat(platform): migrate MCP core
and adapters from qou"*. It arrived in the bulk migration and was never
designed in this repository — no commit here ever argues for it.

## The measurement, and the one I got wrong first

**23** `SkillDefinition` literals carry it; **54** values; **6** distinct.

| value | uses | what it actually is |
|---|---:|---|
| `owner` | 22 | an HTTP RBAC tier (`UserRole`) |
| `collaborator` | 21 | an HTTP RBAC tier (`UserRole`) |
| `reader` | 8 | **nothing** — the RBAC tier is spelled `viewer` |
| `validation-pipeline` | 1 | a declared BPMN role |
| `attestation-service` | 1 | a declared BPMN role, and an actor |
| `publication-manager` | 1 | a declared BPMN role, and an actor |

**The first reading of this was "51 of 54 dangle (94 %)", and it is wrong.**
That number comes from resolving every value against `scenarios/roles.json`
— but 51 of them were never role-graph references. They are the access tier
from `src/types.ts`:

```ts
export type UserRole = "viewer" | "collaborator" | "owner";
```

Measured against the *right* registry the finding is different and worse.

## What is actually wrong — three things, not one

1. **The field mixes two vocabularies.** 51 values are an HTTP access tier; 3
   are BPMN roles. Nothing says which a given entry is, and the doc comment
   — *"Actor IDs (roles)"* — names a **third** thing, actors, as if all three
   were one.

2. **`reader` is not a tier.** Eight declarations use it; `UserRole` has
   `viewer`. So even read as RBAC, 8 of 51 do not resolve.

3. **No reader — and it looks like one exists.** `src/core/rbac.ts` is
   entirely header-driven (`getUserRole` reads `x-user-role`), and every route
   hardcodes its own minimum: `hasRole(req, "collaborator")` in
   `routes/relevance.ts`, `glossary.ts`, `feedback.ts`. **Nothing anywhere
   reads `SkillDefinition.roles`.** Searched: `src/`, `schemas/`, `scripts/`,
   `adapters/`, the MCP tool layer, and `skill-fetch`/`skill-list`.

The third is the reason this is worse than ordinary dead weight. A field
spelled `roles: ["reader", "collaborator", "owner"]` sitting beside a working
RBAC module reads as **an access control that is enforced**. It is not. Every
skill is invokable by anyone the transport lets in, and the declaration says
otherwise.

## Why removed rather than wired up

There is a live precedent from the same day. `SkillDefinition.schemaRefs` was
retired hours earlier (beans `3w0i`, `t2yg`) on the identical finding — a
declaration whose only consumer had *never run once since the root commit* —
and its note states the rule:

> **Reinstating it means writing the consumer first.**

Skill-level RBAC may well be worth having. Building it is a **feature**, and
this repository routes a feature through CRDM rather than letting it arrive
as a side effect of a cleanup. Leaving the declarations in place meanwhile is
the worst of the three options: it is not enforcement, and it reads as
enforcement.

## What was done

- The 23 declarations removed.
- `roles` made **optional** in `SkillDefinitionSchema` — it was required, so
  removing the declarations without this would have made `skill()` throw on
  every definition.
- The field **kept as an optional, deprecated property**, exactly as
  `schemaRefs` was kept: a downstream instance may hold one, and a removed
  property is a breaking change for something that costs nothing to leave
  declarable.

## If you are reinstating it

Write the consumer first, and decide **which** vocabulary the field speaks
before writing a line — RBAC tier or BPMN role. It cannot be both, and the
54 values above are the evidence that leaving it ambiguous does not hold.
Whichever you choose, the values must be checked against that registry, or
this recurs: `reader` survived 8 declarations precisely because nothing ever
resolved it.
