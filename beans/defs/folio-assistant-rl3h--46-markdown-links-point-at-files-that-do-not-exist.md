---
# folio-assistant-rl3h
title: 46 markdown links point at files that do not exist
status: todo
type: task
created_at: 2026-09-20T14:22:43Z
updated_at: 2026-09-20T14:22:43Z
parent: folio-assistant-zzmr
---

Surfaced 2026-09-20 by `bun run subgraphs`, which was built for bean `x4v4`
and found this on its first honest run.

**46 markdown links point at files that do not exist**, after excluding
templates and illustrative placeholders:

| directory | dangling |
|---|---:|
| `cat-harness` (`skills/`) | 37 |
| `translation-sources` | 7 |
| `methodologies` | 2 |

`methodology-crdm` had **13** and has **0** — those were left by relocating
CRDM (bean `g43o`) and were repaired in the same change that found them,
with a regression test. **These 46 are not that**: they are older, and
nobody has established where they came from.

## Why this is its own bean and not part of `x4v4`

`x4v4` declared subgraph containment and measured entanglement. Fixing 46
links found along the way would be a second change riding in an unrelated
diff — the shape `#395` refused and bean `auap` did separately. The
relocation damage was different: it was **caused by this session**, so
repairing it is finishing the earlier work rather than widening this one.

## What the shape suggests, unverified

Most `cat-harness` entries look like the pre-split layout: targets such as
`../../../scripts/install-tex.sh` and
`../../../content/quantum-observable-universe/...` are three levels up from
`skills/folio-paper-adapter/`, which was right before the instance moved
under `cat-harness/` (commit `c25761d2cf`). Others are bare siblings —
`bib-qa.md`, `integration-watcher.md` — which is the same failure mode as
CRDM's: a file moved and its siblings' links did not follow.

**That is a hypothesis from reading paths, not a measurement.** Establishing
it means checking each target against the history, which is the work.

## Done when

- [ ] each of the 46 classified: target moved (repoint), target deleted
      (remove the link or the claim), or never existed (the link was wrong
      when written)
- [ ] repointed links verified to resolve, not just to look plausible
- [ ] a link that cannot be resolved is REMOVED rather than left — a
      link-shaped value that does not dereference is the `blv9` class, and a
      reader cannot tell a stale link from a wrong one
- [ ] `bun run subgraphs` reports 0 dangling, and the count becomes gateable

## Not in scope

The 21 cross-subgraph edges the same report lists. Those are real, resolving
references between subgraphs, and whether they should exist is the
disentangling question the owner described as in progress — a different
decision, needing them.
