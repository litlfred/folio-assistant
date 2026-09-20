---
# folio-assistant-rday
title: ownDirectories and resolveDirectories disagree about what an empty declaration means
status: todo
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
