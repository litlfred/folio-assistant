An instance becomes an **instantiated Harness** — as opposed to a dependency
that merely sits in the tree — by carrying a config file at its root:

```
<stub>.config.json      the instance is instantiated HERE, and how it is configured
<stub>.json             what the instance DECLARES — its directories and assets
```

Two files, two questions, and since 2026-09-21 two filenames rather than two
files sharing one shape. Before the split both ended `.config.json` and were
told apart only by which directory they sat in and whether they carried a
`name` — two schemas and two readers behind one spelling, which is a
distinction a reader has to already know to make.

**The presence of the config is the signal.** It is what the left-hand
navigation filters on to decide which instances get a tile, so a Harness that
declares directories but carries no config is a dependency: its content is
inherited by whoever depends on it, and it has no interface of its own. Nothing
else is consulted for that question, which is why it could not be derived from
the declarations alone.

A Harness **MUST** own the visualisation published at `<baseurl>/<stub>`. The
stem every published artefact is named with is computed in exactly one place —
`artefactStub`, which returns the declared `stub` when there is one and the
`name` otherwise — so the site build, the KGraph export and any future artefact
cannot disagree about what an instance is called.

> **The stub is intended to be free of the definition's name.** A Harness
> *defined* as `folio-assistant` should be instantiable as
> `my-folio-assistant.config.json`, with the config pointing at the definition,
> and `<baseurl>/my-folio-assistant` then live. **That is not what the code
> does today** — see the last section. It is stated here because it is the
> model the rest of this page assumes, and because a reader who tries it will
> be stopped by a gate rather than by a schema.
