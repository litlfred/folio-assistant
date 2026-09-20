---
# folio-assistant-58yc
title: kg-audit reads roles from a HARDCODED skills/ — a second declared cat-harness directory's roles are invisible
status: todo
type: task
created_at: 2026-09-20T15:40:53Z
updated_at: 2026-09-20T15:40:53Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 while fixing `7u3g`, and it is the same defect one layer along.

## Measured

`cat-harness/scripts/kg-audit.ts:121`

    const KG_ROOT = join(root, "skills");

A literal — not `kgDirectories()`, not `kgRoots()`. Line 1363 then does
`auditRoles(graph, join(KG_ROOT, "roles", "roles.json"), …)`, so the audit reads
**one** roles file: `cat-harness/skills/roles/roles.json`.

`bootstrap/skills/` is a DECLARED `cat-harness` directory and carries its own
`roles/roles.json` with four roles. The audit never opens it.

Consequence, measured after binding bootstrap's four roles to their lanes:

    lane-binds-role  Lane_Initiator  "Initiator" matches no declared role
    lane-binds-role  Lane_Requestor  "Requestor" matches no declared role
    lane-binds-role  Lane_Logger     "Logger"    matches no declared role
    lane-binds-role  Lane_DataStore  "Knowledge Graph Data Store" …

**All four ARE declared**, and the binding demonstrably works — the root export
carries `role/initiator -> role/Initiator`, `role/requestor -> role/Requestor`,
`role/logger -> role/Logger` with **0 dangling `bindsLane` edges**. Only the
audit cannot see them, and it reports the roles as absent rather than as
unchecked.

That is the failure mode this repository names everywhere else: **a consumer
that scans one place and reports a clean read over everything it did not
open.** Here it is worse than silence, because it emits a positive finding
("matches no declared role") about a file it never looked in.

## Not fixed here, and why

`KG_ROOT` is load-bearing at four sites — `walk(KG_ROOT)` (line 577),
`REQUIREMENT_DIR`, `readPermissions(KG_ROOT)` (1184), and `auditRoles` (1363).
Turning it into a declaration-driven list is a real change to a 1400-line
script's root assumption, and it interacts with the two call sites `AGENTS.md`
records as root-only ON PURPOSE (`kgDirectories` composes repo-relative skill
ids; `kgRoots(root)[0]` is read as "the root's graph"). Whether roles should
overlay across declared directories, and in what order, is a design question —
overlay order is deepest-dependency-first, and two instances declaring a role
with the same id would need a rule.

**Doing it inside the `7u3g` fix would have been the wrong shape**: that change
is one declaration line plus its fallout, and this is a resolver redesign.

## Done when

- [ ] `auditRoles` reads every declared `cat-harness` directory's
      `roles/roles.json`, not `join(root, "skills")`
- [ ] a rule for the same role id declared by two instances (overlay order is
      deepest-dependency-first; state it or refuse it)
- [ ] the four `lane-binds-role` findings on bootstrap's diagrams clear WITHOUT
      changing bootstrap — they are already correct
- [ ] the other three `KG_ROOT` uses reviewed for the same blindness

## Cross-references

- **`7u3g`** — same family, fixed; this is what the fix exposed
- **`pve3`** — answered by that fix (the root now declares both halves of
  bootstrap)
- **`b5f0`**, **`zzmr`**
