---
# folio-assistant-h1s0
title: block-qa-schema still declares itself a litlfred/qou package
status: completed
type: task
priority: normal
created_at: 2026-09-19T00:10:05Z
updated_at: 2026-09-19T00:16:50Z
---

`schemas/block-qa-schema/` still identifies itself as a package of `litlfred/qou`,
which it has not been since the migration. Found while doing the licence sweep
(bean `ohhu`, PR #298) and deliberately left out of it: folding an identity fix
into a licence change would have hidden it.

Measured 2026-09-18 on `main`:

- `package.json` — `repository.url` is `git+https://github.com/litlfred/qou.git`
  with `directory: "tools/block-qa-schema"` (the path it had in qou, not
  `schemas/block-qa-schema` where it lives now); `homepage` and `bugs` both
  point at `litlfred/qou`.
- `package.json` / `pyproject.toml` — both descriptions read "the QOU block-QA
  sidecar format".
- `pyproject.toml` — `authors` is "Quantum Observable Universe contributors",
  and `qou` is in `keywords`.

The licence line in that package's README was the one field the sweep did fix,
because it asserted a licence — it now points at this repo's LICENSE.

## Why it matters beyond tidiness

`package.json` is `@litlfred/block-qa-schema` and `private` is not set, so if
this is ever published the registry page sends every reader, and every bug
report, to the wrong repository. `pyproject.toml` has the same problem on PyPI.

## Todo
- [x] `package.json`: repository url + directory, homepage, bugs, description
- [x] `pyproject.toml`: description, authors, keywords
- [x] README description line, if it names QOU
- [x] check whether either package is actually published anywhere before
      changing the name-adjacent fields

## Done when
Nothing in `schemas/block-qa-schema/` claims to belong to `litlfred/qou`, and
the declared directory matches where the package actually sits.

## Summary of Changes

Rewritten across eight files in `schemas/block-qa-schema/`: `package.json`
(`repository.url` + `directory`, `homepage`, `bugs`, `description`, keyword),
`pyproject.toml` (description, `authors`, keyword, and all four `[project.urls]`
entries), `README.md` (the "part of the QOU library stack" blockquote and two
body references), `js/index.ts` and `python/block_qa_schema/__init__.py` (module
docstrings and the `tools/block-qa-schema/` paths they cite), and both JSON
Schemas (`$id`, plus one description).

**The `$id` change is the one judgement call**, and it is a schema-identity
change rather than a link fix. Justified because nothing anywhere references the
old value (grepped: only the two files that declare it), neither package is
published (npm and PyPI both 404 on 2026-09-19), and the old URI named a
`tools/block-qa-schema` path that has not existed since the migration.

Checked the falsifier first, as the opening brief said to: had either package
been live on a registry under the qou identity, these fields would have been
left alone and the bean re-scoped. Both 404.

One `qou` reference is deliberately kept — the "Why a standalone package?"
paragraph cites the qou corpus (2,250+ sidecars, 100k+ verdicts) as an example
consumer and links a qou outreach note. That is a reference, not a claim of
ownership.

Verified: `bun test` 1952 pass / 56 skip / **0 fail**; `bun run gen:jsonld:check`
clean; both JSON Schemas and `pyproject.toml` re-parse; the README's
`../block-qa.ts` relative link resolves.
