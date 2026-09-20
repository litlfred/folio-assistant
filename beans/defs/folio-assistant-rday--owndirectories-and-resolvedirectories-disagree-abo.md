---
# folio-assistant-rday
title: ownDirectories and resolveDirectories disagree about what an empty declaration means
status: completed
type: task
parent: folio-assistant-zzmr
created_at: 2026-09-20T16:55:43Z
updated_at: 2026-09-20T16:55:43Z
---

## What was measured

`schemas/cat-harness.ts` holds two resolvers over the same declaration, and
they treat `directories: []` differently:

- **`resolveDirectories(chain)`** seeds `DEFAULT_DIRECTORIES` at the root link
  *before* reading any declaration, existence-filtered, tagged
  `declaredBy: "(default)"`. An instance that declares nothing still gets the
  conventional set.
- **`ownDirectories(link)`** falls back to `DEFAULT_DIRECTORIES` **only when
  `readDeclaration` returns nothing at all**. A declaration present with an
  empty (or merely absent, since the schema defaults it to `[]`)
  `directories` yields `[]`.

So *adding a name* to a directory — the minimal declaration,
`{ "name": "x" }` — silently withdraws every convention from any consumer
that goes through `ownDirectories`. `resolveSkillDirs` is one, which is how
this surfaced: `schemas/harness-config.test.ts` "resolveSkillDirs returns
directories in overlay order" went from 3 dirs to **0** the moment the
fixture roots were given names, with a `skills/` directory sitting right
there on disk.

## Why it is not fixed here

The branch that found it (`claude/instance-config-naming`) is about the
config FILENAME, and either resolution widens it:

- make `ownDirectories` seed the defaults too — changes what every
  declaration-bearing instance in this repo resolves to, including
  `cat-harness` itself; or
- make the schema distinguish **absent** `directories` from `[]` — the
  three-state discipline applied to the declaration itself, and the more
  honest of the two, but it is a schema change with a migration.

Worked around in the test fixture instead:
`test/support/instance-fixture.ts` → `conventionalDirectories()` writes the
existence-filtered conventional set into every fixture declaration, so giving
a fixture a name changes only its name. That is explicitly marked as a
fixture convenience and NOT what `folio_init` does — `folio_init` declares
`folio/`, deliberately, and its doc comment names this trap.

## Done when

- [ ] One of the two resolutions is chosen and the reason is written down
      where the schema is, not only here.
- [ ] `ownDirectories` and `resolveDirectories` give the same answer for the
      same declaration, or a test states why they must not.
- [ ] The fixture's `conventionalDirectories()` is either removed or its
      comment updated to point at the settled rule.

## Closed 2026-09-20

`ownDirectories` now seeds `DEFAULT_DIRECTORIES` **unconditionally**,
existence-filtered, and lets declared entries override by id in place —
`resolveDirectories`' order, and now its own.

Of the two fixes this bean named, this is the smaller: the other was teaching
the schema to tell an ABSENT `directories` from an empty one, which is a
migration. It is also the one that makes the rule sayable in a sentence:

> **A declaration adds and overrides; it does not withdraw.**

The existence filter is what makes that safe. An instance that genuinely owns
none of the conventional directories gets none, because they are not on disk —
and a declared-but-absent directory is `dh4f`, where a consumer scans nothing
and reports a clean run over it.

Measured after the change, both resolvers over the same roots:

```
cat-harness (declares 22)   own 22  resolve 22   agree
repo checkout               own  4  resolve  4   agree
```

cat-harness is unchanged at 22 because every default id is already declared
there — which is why the disagreement survived so long: the instance most
often measured is the one where seeding defaults is a no-op.

Four tests in `skill-overlay.test.ts`: a named-but-bare instance keeps its
conventional directories; a default not on disk is NOT resolved; a declared
entry overrides the default of the same id rather than adding a second; and
the two functions return the same ids for one root, with a vacuity guard so
two empty lists cannot pass for agreement.

**The fixture workaround is kept, and its comment updated.**
`test/support/instance-fixture.ts` → `conventionalDirectories()` still writes
the existence-filtered set into each fixture declaration. It is now redundant
with the resolver rather than compensating for it — but it costs nothing, it
keeps a fixture's declaration explicit about what that fixture owns, and
removing it would be a second change in a commit whose measurement is the
resolvers agreeing.
