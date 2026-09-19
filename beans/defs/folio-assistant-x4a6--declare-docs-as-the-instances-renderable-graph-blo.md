---
# folio-assistant-x4a6
title: Declare docs/ as the instance's renderable graph — blocked on core's folio registration reaching every declaration reader
status: todo
type: task
created_at: 2026-09-19T08:00:02Z
updated_at: 2026-09-19T08:00:02Z
---


Found and measured while doing bean `lgwe` (PR #351).

## The gap

`docs/` is this instance's Jekyll site — 150+ pages, `_config.yml`, the whole
published documentation — and **nothing declares it**. `cat-harness.json`
declares `docs/assets/qa/` (the witnesses) and nothing else under it. So a
consumer asking "which directories does this instance scan" is not told about
the one a reader actually sees.

That leaves `content/pipeline/translation-index.ts` resolving the site root as
the literal `docs`, confirmed by finding `_config.yml` there. A checked
literal, but a literal — and the fifth spelling of a fact that already has
four (`gen-docs-pages.ts`'s `OUT_DIR`, `docs-site.yml`'s `source: ./docs`,
`docs/_data/`, `docs/_config.yml`).

## Why it was not fixed in #351

`docs/` holds a renderable graph, so the entry would be
`{"id": "folio", "path": "docs/", "graphs": ["folio"]}`. **`folio` is
registered by CORE**, not the harness — `schemas/folio-graph-kind.ts`
registers on import, and `readDeclaration` throws on a kind the registry does
not know.

Measured 2026-09-19 on `claude/translated-locales-navbar` with that entry
added:

| | result |
|---|---|
| `bun test` | **9 fail, 1 error** (2166 pass) |
| `bun run harness:dirs` | exit 1 |
| `bun run kg:schema:check` | exit 1 |
| `bun run docs:harness:check` | exit 1 |
| `bun run check:harness-dirs` | exit 0 |
| `bun run kg:export` | exit 0 |

The two that pass import core; the three that fail do not. So this is not a
one-line declaration — it is "every reader of `cat-harness.json` must have
core's registration loaded", which is issue #223's five-repo split arriving
early.

## Options, with what each costs

1. **Import `folio-graph-kind` into each failing reader.** Smallest diff.
   Cost: the harness layer's scripts now depend on core, which is the
   dependency direction #223 exists to reverse — and the harness is the layer
   that is meant to work without core.
2. **Have `readDeclaration` tolerate an unknown kind** with a warning rather
   than a throw. Cost: reintroduces exactly the silent-scan-of-nothing the
   throw exists to prevent (`dh4f`), for every kind, to fix one.
3. **Wait for the split**, where core declares `docs/` in its own layer and
   the harness never reads a kind it does not own.

Recommendation: **3**, and until then leave `SITE_DIR` as the checked literal
it is. The cost of 1 is a dependency edge pointing the wrong way, which is
harder to undo than a literal in one module.

## Done when
`docs/` appears in `cat-harness.json`, every reader of the declaration still
runs, and `translation-index.ts` takes its root from the declaration instead
of `SITE_DIR`.
