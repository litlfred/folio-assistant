---
# folio-assistant-6n23
title: 'EXCISE harness.json: the declaration folds into <name>.config.json, and only a root <stub>.config.json instantiates'
status: completed
type: task
priority: normal
created_at: 2026-09-21T10:10:21Z
updated_at: 2026-09-21T11:13:02Z
parent: folio-assistant-vke6
---

Owner, 2026-09-21: *"Excise harness.json.. only <harness-stub>.config.json makes instantiation at root of repo"*.

Scope confirmed by the owner the same day: ALL TWELVE declarations fold (not just the root one), and an instance that is not instantiated here STILL GETS A CONFIG FILE — nothing loses its directories or assets.

## Measured before starting (main, 519e8c01)

| | harness.json | <instance>.config.json |
|---|---|---|
| where | inside each instance dir | repo root |
| how many | 12 | 1 (cat-harness.config.json) |
| carries | name, description, directories[], assets[], needs[], stickies[] | contentType, adapter, dependencies, translation, feedbackDir, skills |

72 TypeScript files touch the declaration API; 23 non-test references to DECLARATION_FILENAME.

## Done when

- [x] A directory's declaration is `<name>.config.json`, and the filename stem
      equals the declared name — `findDeclarationFile` checks exactly that
- [x] All 12 declarations migrated with `git mv` so history follows; the root's
      declaration MERGED into the `folio-assistant.config.json` main had
      already added, because those two were the root saying itself twice
- [x] Discovery no longer looks for a fixed filename — `DECLARATION_FILENAME`
      is gone and `harness.json` is a RETIRED name the gate reports
- [x] The root keeps its instantiation markers (`cat-harness.config.json`,
      `bootstrap.config.json` — no `name`, so not declarations)

## What the merge cost, and what it caught

**Three collisions, each one file written twice.** `init-folio` wrote the
declaration and the config with two calls that now resolve to ONE path, so a
scaffolded folio came out with no `directories`. `writeInstanceConfig` and the
fixture-map loop did the same in tests. All three merge now.

**The `harness`/`folio` content-type markers were two FILES.** One file
asserted both, making every declared instance a folio. The distinction moved
into the CONTENT: a folio declares a `contentType`, which is what that type's
summary always said.

**Fifteen dead markdown links**, found by `check:declared-assets`: every
instance's AGENTS.md and README pointed at `harness.json`.

**Two latent crashes the one-file model reaches.** A corrupt config is now a
corrupt DECLARATION, so `readDeclaration` throws where a SEARCH expects a soft
answer: `findContentRepoRoot` died on an unreadable ancestor, and
`findChecker` died enumerating a module whose export was in its temporal dead
zone. Both are searches and both now skip what they cannot read. **The
import cycle behind the second is NOT fixed and is not claimed to be** —
`qa-checkers-extended.ts`'s `EXTENDED_AUTOMATED_CHECKERS`, reached through a
cycle. Worth its own bean.

**Three things I got wrong and corrected**, recorded because each is a rule
this repo already pays for:
1. `findDeclarationFile` first SKIPPED an unparseable file, making "declared
   and broken" look like "nothing here" — in the function written to replace
   the one that got it right. Then I made it THROW, which took out
   `instanceRootsIn` and every caller written to REPORT the unreadable case.
   It returns the broken file: exactly the old semantics.
2. `readActiveVoices` — I keyed the third state on the `voices` key and three
   tests said that is not this repo's semantics. Reverted; the test moved its
   subject to a directory that declares nothing.
3. The fixture merge kept the whole previous file, so a fixture could
   accumulate but never REWRITE. It carries only the declaration keys now.

Issue #683, PR #684. `bun run gates --all` 86 of 86.
