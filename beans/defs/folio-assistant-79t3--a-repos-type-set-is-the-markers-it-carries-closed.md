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

## Measured 2026-09-20 — question 1 now has evidence, and it cuts one way

The owner raised question 1 again in its own words: *"why harness.json, i think
it shound be `<harness-stub-name>.config.json`, so this folio would have …
`bootstrap/bootstrap.json`, `bootstrap.config.json` … `folio-assistant.config.json`,
`folio-assistant/folio-assistant.json`."* That is **option 1 of the three
below**, and the tree was measured against it rather than argued about.

**THE FIXED ROOT FILENAME IS A DECISION, NOT AN OVERSIGHT.** It is stated in
five places and asserted by a live test:

- `schemas/cat-harness.ts` on the `stub` field: *"the declaration file itself is
  NOT stub-named — it stays `harness.json`, exactly as `smart-base`'s config
  stays `dak.json`. A consumer must be able to find the config without already
  knowing the repository's name; the artefacts it DESCRIBES are free to be
  named."*
- `directory-conventions.md` §"Naming — one fixed config, stub-named artefacts
  (STRICT)"; `kg-export.md`; `placement.md`; `crdm-requirements-workflow.md`.
- `docs/architecture/migration-plan.md` I.8 gives the failure mode: *"renaming
  it per-repo fails silently — a resolver computing the filename from the
  directory finds nothing when a repo is cloned under a different name, and
  reports 'no config' rather than an error."*
- `scripts/tests/kg-export.test.ts` asserts `harness.json` exists at the root
  AND `${stub}.json` does **not**. Option 1 makes that test fail by design.

**THREE HARD OBSTACLES, each measured rather than reasoned:**

1. **`<stub>.json` is already taken.** It is the published KG-as-JSON alias —
   `<base>/<stub>.jsonld` with `<base>/<stub>.json` beside it, because Pages
   serves no correct media type for `.jsonld`. Naming the declaration
   `folio-assistant.json` gives one name to two different documents.
2. **The directory is deliberately not the stub here** — `cat-harness/` versus
   `folio-assistant` — so `<dir>/<dir>.json` and `<stub>.json` are two
   different proposals (`cat-harness/cat-harness.json` versus
   `cat-harness/folio-assistant.json`). The owner's example assumes the
   directory is renamed too, which is bean `x3bd`'s question and is not settled.
3. **`findInstanceRoot` is the chicken-and-egg, and it fails SILENTLY.** It
   walks up doing one `existsSync(join(dir, DECLARATION_FILENAME))` per level.
   To know the stub you must read the declaration; to find the declaration you
   must know the stub. The candidate rescues both fail on measurement: **no
   declaration in this tree carries a `$schema` field at all** (only
   `interaction/interaction.json` does), so "glob and match the schema" is a
   prerequisite migration; and `{name, directories}` is the **shared shape** of
   the root declaration, `beans/beans.json` AND `todos/todos.json`, so
   duck-typing cannot tell them apart — `findInstanceRoot` started under
   `beans/` would return `beans/`.

**`beans/beans.json` IS NOT THE PRECEDENT IT LOOKS LIKE.** It is the closest
thing in the tree to the proposed pattern, so it is worth saying why it does
not support it. Two reasons, both from the record: it is on the owner's own
stub-EXEMPTION list (`x3bd`: *"todo, beans do not use stub pattern"*, because
neither is overlaid), and it is a fixed constant named after the **graph kind**
rather than derived from the **directory** — `bean-graph.ts` states that moving
`beans/` to `work/` must rename nothing inside it, so the file would stay
`work/beans.json`. Meanwhile `declaredKinds()` looks for `${dirName}.json`.
**Those two readers of the same file already disagree under relocation**, which
is a live defect this bean should pick up, and it is what generalising the
pattern would make the norm rather than the corner.

**So the true rule is three layers, not one convention with an inconsistency:**
root declaration = fixed name; nested graph declaration = directory-derived
(`declaredKinds()` does this today, and it is cheap precisely because it already
has `d.path` in hand and is not searching); published artefact = stub-named.
Option 1 collapses layer 1 into layer 3.

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

**Recommendation on question 1, 2026-09-20: option 3 — both accepted, with the
type declaring its own filename.** The bean's own objection to it is that *"the
convention becomes a lookup table with nothing for a new type to copy"*, and
that objection is real but it is the cheaper one: a lookup table is what the
tree already is (`sushi-config.yaml` and `dak.json` are not ours to change, so
no uniform rule can ever cover the set), and the alternative costs the silent
`findInstanceRoot` failure above. What a new type copies is then the RULE —
*declare your filename in your type* — rather than a spelling. Not decided;
this is the recommendation the owner asked for, and question 2 is untouched.

## Done when

A consumer can ask a repository "what are you?" and get a resolved **set** of
content types — the markers present, closed under the dependency tree — with
every member naming a type it can dereference, and a disagreement between two
markers reported rather than silently resolved. `sushi` and `ig` are among the
formalised types. The skills say so and the existing repos are migrated.
