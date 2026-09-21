Three parts of the model above are intended and **not implemented**. They are
listed together, with what a reader will actually hit, because a page that
described them as working would send somebody to look for code that is not
there.

### 1. There is no `HarnessKind`

A Harness is intended to be declared as a **subtype of a HarnessKind** — the
name is itself unsettled. Nothing in the schemas registers one today: an
instance declares a `name`, directories, assets and `needs`, and what makes it
a Harness rather than a dependency is the presence of a config file, which is a
fact about the filesystem rather than a declared type.

The consequence is not cosmetic. Without a kind there is nowhere to say what a
Harness of a given sort **MUST** supply, so every obligation on this page is
prose rather than something a declaration can be validated against.

### 2. The stub is NOT free of the definition's name

The model says a Harness defined as `folio-assistant` **MAY** be instantiated
as `my-folio-assistant.config.json`, with the config pointing at the
definition. Three places refuse it, and they refuse it consistently:

- `instanceConfigFilename` **composes** the filename from the declared name,
  so the stub is derived rather than chosen.
- The left-hand navigation tests for `<declared name>.config.json` when
  deciding whether an instance is instantiated — a differently-named config
  would leave the instance with no tile.
- `check:instance-config` reports a config whose filename does not match its
  instance's name as a finding, reading it as a rename half-done.

And the config carries **no field pointing at a definition**, so even were the
filename freed there is nothing for it to point with. Freeing the stub means
adding that pointer first; the filename rule is the symptom.

### 3. Rendering a harnessed directory's JSON-LD is unchecked

Stated as a **MUST** in the section above, carried by nothing. `coverage` can
name a visualiser, a docs entry and a skill; it cannot name the rendered
description, so `check:subgraph-coverage` cannot ask for it.

---

None of the three blocks the other. Instantiation works, the dependency walk
works, and the visualisation obligation is both carried and checked. What is
missing is the part that would let a Harness be **validated as** a Harness
rather than recognised as one.
