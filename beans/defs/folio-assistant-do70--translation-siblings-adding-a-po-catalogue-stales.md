---
# folio-assistant-do70
title: 'TRANSLATION SIBLINGS: adding a .po catalogue stales six generated artefacts and nothing names them — reuse skills:register''s converging chain'
status: todo
type: task
created_at: 2026-09-26T10:05:01Z
updated_at: 2026-09-26T10:05:01Z
parent: folio-assistant-bzyu
---

Found 2026-09-26 by paying the cost, then reading PR #1361 and finding the
mechanism already built for a sibling problem.

## What it cost, measured on one change

Adding 10 `.po` catalogues (#206, PR #1369) left **six** generated artefacts
stale. I discovered them one at a time, from failing gates, across three full
`bun run gates` runs:

| gate that went red | what regenerates it |
|---|---|
| `translation:block-qa:check` | `bun run translation:block-qa` |
| `translation:status:check` | `bun run translation:status` |
| `state:visualizer:check` | `bun run state:visualizer` |
| `docs:harness:check` | `bun run docs:harness` |
| `gen-docs-pages.ts --check` | `bun run cat-harness/scripts/gen-docs-pages.ts` |
| `translation:index:check` | `bun run translation:index` |

Nothing in the repository says that adding a catalogue entails those six. Each
gate names its own stale file correctly and none names the remedy, so the list is
reconstructed from CI by whoever changes a catalogue next. **Two of the three gate
runs existed only to find the next name on this list.**

## The mechanism exists — do not design a second one

PR #1361 (bean `nfv3`) built exactly this for skills, after **seven merges in
three days** each landed a skill file without its manifest entry, reference page
and `kg-qa` sidecar. `bun run skills:register` performs the chain, and its two
findings are the ones this bean would otherwise have to rediscover:

- **A gate that states the defect and not the remedy** is how six checks come to
  mean "read the corpus and work it out". Its failure now names the command.
- **One pass is not a fixed point** — measured there when `docs:auto` staled
  behind `glossary:page`. The chain ITERATES and asserts convergence against the
  `:check` forms rather than running a fixed number of passes.

The second is not hypothetical here: `gen-docs-pages` writes
`docs/_data/translation-qa-pages.json` from the sidecars that
`translation:block-qa` writes, and `state:visualizer` reads what `gen-docs-pages`
produced. Ordered wrongly, one pass leaves a stale file behind and the run looks
clean.

## Done when

- [ ] one command regenerates every artefact derived from `translations/`, built
      on `skills:register`'s shape — iterate, then ASSERT convergence against the
      `:check` forms, never a fixed pass count
- [ ] each of the six gates above names that command in its failure text, so an
      author has somewhere to look rather than a list to rebuild from CI
- [ ] MEASURED AFTER: adding a catalogue to a clean tree and running the one
      command leaves `bun run gates` with no stale-artefact failure — falsified by
      doing it, not by reading the script
- [ ] the dependency order is DERIVED or asserted, not written down in a comment
      that a later generator can fall out of step with

## Not in scope

The merge-side gap — a gate passing on every PR head while `main` takes an
unregistered artefact through a merge the gate never ran on the merged tree. #1361
names it and leaves it open as `check:merged`, bean `nytj`. Same shape, one level
up, and already recorded; this bean is the author-side command only.
