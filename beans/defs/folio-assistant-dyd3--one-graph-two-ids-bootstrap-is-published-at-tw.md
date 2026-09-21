---
# folio-assistant-dyd3
title: 'ONE GRAPH, TWO @ids: bootstrap is published at two paths with 84 subjects under two identities'
status: todo
type: task
created_at: 2026-09-21T18:27:04Z
updated_at: 2026-09-21T18:27:04Z
parent: folio-assistant-vke6
---

Split out of `3jhq` on the owner's ruling ("fix staging only; bean the
duplication"), with the evidence already gathered.

## Measured 2026-09-21, not assumed

`docs-site.yml` publishes the bootstrap graph **twice**:

| path | written by | top-level fields |
|---|---|---|
| `<base>/bootstrap.jsonld` | `kg-export --instance ./bootstrap` | `generatedAt`, `sourceCommit*` |
| `<base>/bootstrap/bootstrap.jsonld` | `gen-bootstrap-graph.ts` | `omitted`, `problems`, no timestamp |

Both carry **85 nodes**. 84 of the 85 node IRIs differ *only by stem*, because
the `@id`s differ. So 84 subjects exist under two identities that no consumer
will ever merge: a cold reader following `bootstrap/README.md` lands on
one, anything walking cat-harness's `skillHome` links lands on the other.

## Why this was NOT settled in 3jhq

Both documents have a real argument behind them, and neither is obviously the
one to drop:

- `gen-bootstrap-graph.ts` exists for a reader "pointed at a repository
  with nothing installed", and its `@id` contract is the `bootstrap/`
  path. Its purity (no `generatedAt`, no sha) is deliberate and documented.
- `kg-export --instance` is what cat-harness's own links resolve to, and it
  carries the provenance a published graph is supposed to carry.

## The three options, as tabled

- **A** — collapse to the site root; make `bootstrap/bootstrap.jsonld`
  an alias. Cleanest graph; reopens the cold-start argument.
- **B** — collapse under `bootstrap/`; repoint `skillHome`. Preserves the
  documented cold-start contract; changes what every cross-instance link mints.
- **C** — two documents is correct (frozen snapshot vs live export); write the
  distinction into both workflows and the skill so it is not re-filed.

## Done when

- [ ] the owner picks A, B or C
- [ ] whichever it is, ONE of these is true and stated: the two paths resolve
      to one identity, or the documents are distinguishable by something other
      than their path
- [ ] `kg:audit` or an equivalent has an opinion, so a future third path is a
      finding rather than a discovery

## Do not

Do not "fix" this by deleting either publish step. Both are currently reached
by a documented route, and removing one is how `blv9` happened — an `@id` that
dereferences to nothing, for months, while the generator worked perfectly.
