---
# folio-assistant-pb2b
title: A deleted block directory leaves its mirrored verdict directory unreachable forever
status: completed
type: task
priority: normal
created_at: 2026-09-19T08:43:04Z
updated_at: 2026-09-19T08:58:33Z
---

FOUND 2026-09-19 by the agent that kept `no-orphan-sidecar` working after bean `2634` moved block verdicts to `test/results/block-qa/`. Reported as a known gap rather than papered over, which is why it is written down.

## The gap

`no-orphan-sidecar` now checks two places per directory load: the block directory itself (legacy verdicts) and the single mirrored directory `test/results/block-qa/<relative(root, blockDir)>/`. That is enough to catch the case the check exists for — a block MOVING between chapters and leaving a stale verdict at the old path — and it is proved by test, on a fixture and on the real corpus.

**But the only thing that reaches a mirror directory is a load of the block directory it mirrors.** Delete a block directory outright and its mirror survives in the results tree with nothing to visit it, ever. The verdicts inside are then invisible to the check AND still counted by any census over `**/*.qa.json`.

Under the old adjacency this could not arise: the verdicts were INSIDE the directory and went with it. So this is a real, if narrow, loss of coverage caused by the relocation.

## Why it was not closed there

Closing it needs a sweep that knows the whole corpus, which a per-directory load structurally cannot answer. Making `no-orphan-sidecar` do it would change its scoping — whole-repo findings from a single-chapter validate — and duplicate every finding once per chapter loaded. It is a separate check, not a widening of that one.

It is marked `KNOWN GAP` in `content/pipeline/validate.ts` so the next reader does not assume coverage that is not there.

## Done when

- [ ] a corpus-wide sweep reports results-tree directories that mirror no existing block directory
- [ ] it runs somewhere a per-directory validate does not — and the decision about WHERE is the design question, not the detection
- [ ] it does not duplicate `no-orphan-sidecar`'s findings for directories that still exist

---

## Done, 2026-09-19

`content/pipeline/orphan-verdict-sweep.ts`, registered as
`bun run check:orphan-verdicts`.

**Two kinds of finding, because the remedies differ and because one of them
justifies the sweep existing.** `moved` — the block directory survives, the
manifest does not; `validate` sees this too. `abandoned` — **the block
directory itself is gone**, which nothing else in this repository will ever
report, because the only thing that reaches a mirror directory is a load of the
directory it mirrors. The CLI counts the abandoned ones separately so a reader
can tell the sweep earned its run.

Not a widening of `no-orphan-sidecar`, per that check's own reasoning: walking
the whole tree from a per-directory load would report the entire repo's orphans
when you asked to validate one chapter, and would repeat each of them once per
chapter loaded. A corpus question needs a corpus entry point.

**An absent results tree is a determined empty, not an error.** A folio that has
never run a sweep since migrating has no tree at all, and reporting that would
put a finding in front of every such folio on day one.

Five tests, and they prove the case the sweep exists for rather than the happy
path: an abandoned verdict IS reported, a moved one is classified separately, a
live block is silent, an absent tree is silent, and nesting is walked at depth.
Clean on this repo's own corpus.

## Summary of Changes

- `content/pipeline/orphan-verdict-sweep.ts` — `orphanVerdicts()` plus CLI
- `package.json` — `check:orphan-verdicts`
- `scripts/tests/orphan-verdict-sweep.test.ts`
