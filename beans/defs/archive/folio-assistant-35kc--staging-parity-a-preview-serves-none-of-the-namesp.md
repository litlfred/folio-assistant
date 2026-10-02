---
# folio-assistant-35kc
title: 'STAGING PARITY: a preview serves none of the namespace documents or the bootstrap graph its own graph points at'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T15:40:27Z
updated_at: 2026-09-20T16:13:11Z
parent: folio-assistant-5a3l
---

Found while resolving `hfkl`'s recorded contradiction about where bootstrap's
graph artefact lives. That contradiction turned out to be one stale comment
(fixed); **this is the real defect underneath it.**

## A staging preview cannot serve the documents its own graph points at

Measured 2026-09-20 by diffing every `./_site/...` path the two workflows
write. `docs-site.yml` publishes all of these; `feature-staging.yml` publishes
**none** of them:

| artefact | what it is |
|---|---|
| `ns/vocabulary.jsonld` + `.json` | the full vocabulary |
| `ns/content/v1.jsonld` | the content namespace |
| `<dir>/ns.jsonld`, `.json`, `ns` | the per-layer namespace, for **three** layers — bootstrap, cat-harness, folio-assist-core |
| `bootstrap/bootstrap.jsonld` + `.json` | **the bootstrap graph** |
| `fsh-guts.jsonld` + `.json` | the fsh-guts graph |

Staging publishes exactly `<stub>.jsonld`, `<stub>.json`, the rendered site,
the API dir and the QA assets.

**Why this is worse than a missing file.** Staging exports with
`--base-url "$BASE"` pointing into the staging tree, so every node in the
staged graph mints an `@id` under that base — and then the namespace documents
those nodes reference are not there. A reviewer opening a staged KG change
gets a graph whose own vocabulary dereferences to 404. The preview exists to
let somebody check the artefact, and for this artefact it structurally cannot.

That is the same failure `bootstrap/bootstrap.jsonld` was already fixed for
once: `.gitignore:108` records it being committed on a rationale that cited a
README step that did not exist, "so the `@id` it names itself by resolved to
nothing". The live site was repaired; staging was not.

## The fix is two halves and only one is a copy

- **Namespace documents — safe to copy.** A vocabulary's IRIs are
  deployment-independent ON PURPOSE; the same `ns.jsonld` is correct at any
  base. `ns-export.ts` takes `--out`, `--layer` and `--exact`, and all three
  were verified to run locally (43,965 bytes full; 5,140 for `--layer
  bootstrap --exact`).
- **The bootstrap graph — needs a decision first.** `gen-bootstrap-graph.ts`
  mints its `docIri` from `canonicalUrl ?? https://litlfred.github.io/...`,
  and it takes **no `--base-url`** (verified: its only flag is `--out`). So
  publishing it at staging as-is yields a document whose `@id` says it lives
  on the live site. Either it gains `--base-url` like `kg-export.ts` has, or
  the staged copy is deliberately canonical-identified and that is written
  down. **A graph that misstates its own location is arguably worse than a
  404**, which is why this half is not a copy-paste.

## Why this was not fixed in the same session that found it

A workflow change cannot be verified locally end-to-end, and
`feature-staging.yml` runs for **every open PR's preview** — there are nine.
Breaking it would take out every reviewer's preview at once. The generators
were verified to run; the workflow wiring was not, and was left rather than
guessed.

## Depends on / near

- `bm6d` — staging pushes two commits per deploy and cancels its own Pages
  build. Same workflow; fix together to avoid two deploy-behaviour changes.
- `lx2s`, `85im`, `1lfx` — the other feature-staging beans.
- `hfkl` — bootstrap's `.json`/`.jsonld` being its existence. On staging, it
  has none.

## Done when

- [x] Staging publishes the namespace documents for all three layers
- [x] The bootstrap graph is published at staging, with its `@id` question
      settled: `gen-bootstrap-graph.ts` gained `--base-url`, matching
      `kg-export.ts`, so the staged copy names ITSELF. Owner chose this over
      the namespace-only half.
- [x] A staged graph's vocabulary references resolve within the staged tree

## Shipped 2026-09-20

The asymmetry that made this more than a copy: `kg-export.ts` already took
`--base-url` and `gen-bootstrap-graph.ts` did not, so a staged bootstrap graph
would have minted its `@id` from the canonical URL and **asserted it lives on
the live site**. That is worse than the 404 it replaces — a reader following
the `@id` lands on a different document that looks correct. The flag was added
rather than the problem accepted.

**Rehearsed end-to-end locally**, which is what the earlier "not fixed in the
same pass" note said could not be done. It was half right: the GitHub runner
cannot be driven from here, but the shell block can. Running the exact
sequence against a throwaway directory produced all 14 files — `ns/vocabulary`
(+`.json`), `ns/content/v1`, three per-layer `ns` triples, and the bootstrap
graph (+`.json`) — and the staged graph's `@id` came out as
`.../STAGING/rehearsal/bootstrap.jsonld`. `check:workflows` confirms the YAML
still parses.
