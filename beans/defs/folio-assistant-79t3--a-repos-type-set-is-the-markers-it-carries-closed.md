---
# folio-assistant-79t3
title: A repo's type set is the markers it carries, closed under the dependency tree
status: todo
type: task
created_at: 2026-09-18T21:28:21Z
updated_at: 2026-09-18T21:28:21Z
parent: folio-assistant-vke6
---


## The idea, as stated 2026-09-18

**A repo declares itself an instance of a content type by carrying a file named
after that type.** The filename is the assertion; the file's JSON-LD `@type` is
the resolvable reference to what that type *means*. Several markers coexist, so
a repo is a **set** of types, not one: `smart-base` is a DAK *and* a SUSHI
project. Each marker stays owned by whoever defined it.

**The set is closed under the dependency tree.** Resolving dependencies yields
a set of **overlaying** instances: declaring `folio-assistant` *implies*
`cat-harness`, because folio-assistant depends on it. The derived instance is
not a different kind of thing — it is the same thing **scanning harder**, with
the overlay adding directories. That is the same depth-first overlay
`resolveSkillDirs` already computes for skill directories and
`readDeclaration` already describes for directories ("an instance inherits its
dependencies' directories"); this makes the *type* obey it too.

## What is already true, measured 2026-09-18

- Three marker spellings are in the tree and two are not ours to change:
  `sushi-config.yaml` (SUSHI reads that exact name, and it is YAML),
  `dak.json` (WHO's `smart-base`), `harness.config.json` and
  `cat-harness.json` (ours, and inconsistent with each other).
- `ig` is half-formalised: `l3-fhir` exists as a translation content type with
  `fsh` and `fhir-json` formats, but nothing declares an IG **instance**.
- `getting-started.md` currently does `test -f harness.config.json && echo
  isFolio=true` — a single boolean from one filename, with no type behind it.
- `directory-conventions.md` §"Naming" already argues the discovery half (one
  fixed filename to open first, stub-named artefacts, citing `dak.json` as the
  model). It does not yet say the filename **is** a type assertion.

## Open — asked, not yet answered

1. **Naming for markers we own.** `<slug>.config.json` everywhere we own it
   (renames `cat-harness.json`, matches `harness.config.json`, and `dak.json`
   visibly will not match); bare `<slug>.json` (matches WHO, and
   `harness.config.json` becomes the odd one); or both accepted with the type
   declaring its own filename (zero churn, but the "convention" becomes a
   lookup table with nothing for a new type to copy).
2. **Precedence when two markers state the same fact differently** — e.g. both
   naming a `canonicalUrl`. Report the disagreement and resolve nothing (the
   third-state rule this repo uses everywhere), rank the markers, or let ours
   always win.

## Done when

A consumer can ask a repository "what are you?" and get a resolved **set** of
content types — the markers present, closed under the dependency tree — with
every member naming a type it can dereference, and a disagreement between two
markers reported rather than silently resolved. `sushi` and `ig` are among the
formalised types. The skills say so and the existing repos are migrated.
