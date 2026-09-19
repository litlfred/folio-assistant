---
# folio-assistant-x4a6
title: Declare docs/ as the instance's renderable graph — blocked on core's folio registration reaching every declaration reader
status: todo
type: task
priority: normal
created_at: 2026-09-19T08:00:02Z
updated_at: 2026-09-19T10:09:09Z
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

_2026-09-19T09:54:35Z_ — Packaged docs/ under the instance stub — docs/folio-assistant/ — per the owner: 'use docs/<stub> convention to package in preparation for repo separation'.

The declaration half stays BLOCKED and that is unchanged. Re-measured this session by adding the entry and reverting it: harness:dirs, kg:schema:check and docs:harness:check all throw 'unknown graph kind folio', 5 tests fail. folio is registered by folio-assist-core. So this delivers the packaging, not the declaration.

What it did fix is the bean's OTHER defect — the site root was five literals. It is now one: siteDir(d) / siteDirFor(root) in schemas/cat-harness.ts, composed from the stub the declaration already carries. siteDirFor THROWS when it cannot determine a stub rather than defaulting to docs/, because a wrong site root writes 278 pages where nothing serves them.

No published URL moves: docs-site.yml and feature-staging.yml point Jekyll at ./docs/folio-assistant as source root, so the site's internal layout is untouched.

A guard test (scripts/tests/site-dir-single-answer.test.ts) fails on any NEW literal in a path-resolving position. It found 154 on its first run — including the whole Playwright e2e suite, which bun test never executes and which would have gone red in CI.

Verified: 2256 unit tests, 133 e2e, tsc, eslint, and 10 gates all green. kg:audit sidecars show no verdict change, only hashes.

_2026-09-19T10:09:09Z_ — Merged as #383. The bean stays OPEN: two of its three 'Done when' boxes are blocked, not done.

Done: the site is packaged at docs/folio-assistant/, and the site root is one answer (siteDir/siteDirFor) instead of five literals.

NOT done, and blocked on issue #223's split:
- docs/ does not appear in harness.json. Re-measured 2026-09-19: adding it makes harness:dirs, kg:schema:check and docs:harness:check throw 'unknown graph kind folio' and 5 tests fail, because folio is registered by folio-assist-core.
- translation-index.ts still composes its root rather than reading a declared directory. It now composes it from the declaration's stub, which is one line away from reading the directory once core's registration reaches every reader.

Waiting on: core's folio registration reaching the harness-layer declaration readers (#223 Phase 0.x). No expiry set — this is a real dependency, not a stall. Handoff: whoever lands the split should flip siteDirFor to read the declared directory and delete the composition.

Setting back to todo so a sibling can see it is unclaimed.
