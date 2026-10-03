---
# folio-assistant-lrzn
title: 'PREBUILT SEARCH INDEX: serialize the lunr index at build time for scopes over a token budget (#1972)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T15:42:45Z
updated_at: 2026-10-03T15:57:22Z
parent: folio-assistant-whlc
---

Issue #1972, the owner's "1 2" of 2026-10-03: (1) a prebuilt search index.
Asked with the measured trade-off, the owner chose **big scopes only**.

## Measured (Node / V8, scopes from a local build)

Building a scope's lunr index costs ~3–5 µs per token, consistently:
`section-reference` 550k tokens / 2,489 ms, `smart-immunizations` 163k /
809 ms, `_platform` 138k / 476 ms, `smart-trust` 137k / 409 ms,
`section-glossary` 136k / 472 ms; every locale scope under 40k / 160 ms.

Loading the serialized index instead (`lunr.Index.load`) is 5–8× faster —
`section-reference` 2,593 → 546 ms — but the index is 2–3× the entries'
size and is downloaded IN ADDITION to them (titles and previews still come
from the entries): `section-reference` 1.20 MB gz → +2.86 MB gz. The browser
caches the download but rebuilds the index on every page, so every later
page in the same scope pays only the load.

## The rule

A scope is prebuilt when its token count exceeds a declared budget. Tokens,
not measured time: time is a property of the machine, and a split that varied
with it would break `--check` and the manifest hash. 128 Ki tokens ≈ 500 ms of
browser build at the measured rate — five scopes cross it.

## Done when
- [ ] `search-split.ts` writes `<scope>.idx.json` (lunr `toJSON`, the theme's own fields, boosts, tokenizer and position whitelist) for every scope over the token budget; the manifest names it
- [ ] the client loads a prebuilt scope with `lunr.Index.load`, else builds as before
- [ ] `search-scopes` checks each prebuilt index parses and covers exactly its scope's entries
- [ ] tests (rule, determinism, verifier, e2e load path), mutation-checked
- [ ] measured in Chromium on the built site; green on CI, PR ready

## Measured (2026-10-03, Chromium on the local build, first search, median of 3, localhost so network excluded)

| scope | built: script / wall | prebuilt: script / wall | index gz |
|---|---|---|---|
| section-reference | 1,747 / 1,983 ms | 342 / 748 ms | 2.86 MB |
| smart-immunizations | 618 / 808 | 141 / 433 | 0.55 MB |
| smart-trust | 484 / 640 | 95 / 301 | 0.37 MB |
| _platform | 477 / 613 | 107 / 350 | 0.68 MB |
| section-glossary | 478 / 655 | 145 / 390 | 0.65 MB |

The split itself goes from ~2 s to ~7 s in CI (deterministic: `--check` current on a second run). Mutation-checked: 5 server mutants (boost, budget comparison, whitelist, token fields, separator) and 3 client mutants (load path, fallback, separator on load) each fail a test.
