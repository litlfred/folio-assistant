---
# folio-assistant-nimj
title: Nazrin as triviality oracle (proof-not-machine-trivial)
status: in-progress
type: task
priority: normal
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-08T11:54:20Z
---


## Idea

Nazrin (arXiv 2602.18767) is a GNN over a minimal Lean expression graph
emitting *atomic* tactics; trains and runs on consumer hardware. As a prover
it will not beat the frontier LLM already in the loop.

Inverted, it is useful: **if a cheap CPU model closes the goal in <= N atomic
tactics from cold, the statement probably carries no content.** That is what
the whole vacuity family exists to catch — `proof-no-trivial-true`,
`proof-no-trivial-skeleton`, `proof-rater-novelty`, `proof-no-decide-masking`
— and five of six are `automated: false`, i.e. they burn agent turns.

New criterion `proof-not-machine-trivial`, emitting to `metrics`, severity
`warn`. Evaluate false-positive rate on the qou corpus BEFORE committing;
research-grade, and its whole value is in that rate.

## Status: scaffolded, NOT validated

Built the full path — cache format, checker, criterion, 7 tests — but the
oracle's false-positive rate is still **unmeasured**, which is the whole
question. Left `in-progress`, not `completed`: shipping the scaffold is
not the same as adopting the idea.

Landed:
- `content/pipeline/qa-checkers-triviality.ts` — reads
  `docs/audits/lean-triviality.json`, SHA-stamped like the other caches.
- `proof-not-machine-trivial` criterion, `minor` + warn-only, statement
  granularity, `n/a` when unmeasured or stale.
- 7 tests, including one asserting it can NEVER return `fail` regardless
  of input, and one that a stale measurement reports `n/a` rather than a
  confident wrong answer.

Inert by construction: no cache ⇒ `n/a`, and the note says 'not measured',
never 'nothing trivial'.

## Remaining (the actual bean)

- [ ] Obtain/run a Nazrin-class oracle (needs a Lean toolchain — this
      container has none).
- [ ] Emit `lean-triviality.json` over the qou corpus.
- [ ] Measure the false-positive rate: of blocks flagged at <= 3 atomic
      tactics, how many are substantive results?
- [ ] Tune `TRIVIAL_STEP_THRESHOLD` — currently 3, a guess.
- [ ] Only then decide whether the severity should rise above `minor`.

## Measured — and the dependency was wrong

Got a real Lean toolchain via `lake-cache.sh restore-toolchain` (which
also exposed a bug in that command — see the commit). So this could
actually be measured.

**Nazrin is not needed.** The criterion needs *a cheap oracle*; folio
already has one — Lean's own automation. `trivial / rfl / simp / decide /
omega / aesop` is available, version-matched, already a dependency, and
needs no research checkout or GPU. Nazrin's contribution was running
cheaply WITHOUT Lean. folio has Lean.

`content/pipeline/lean-triviality-probe.ts` substitutes each declaration's
proof body with a ladder rung and elaborates; first rung that closes the
goal is `steps`.

### Result on qou (12 blocks probed)

    probed 12, closed 0, skipped 16 (unelaborable)

**Zero false positives — but also zero hits, so the FP rate is still
unmeasured.** A zero-hit sample is evidence the criterion is not noisy
here; it is NOT evidence the criterion is useful. Reassuring in one
sense: none of 12 real qou theorems fall to cheap automation.

### The bigger finding

16 of 28 candidate blocks (57%) could not be probed at all: sibling
`.lean` files import the paper's OWN package (`QOU.BraidKnot.*`), and the
cache branch carries **zero** of the paper's oleans — 7268, all
dependencies. Filed as 5d7z; `lake-cache.sh status` now detects and
reports it.

Until that is reseeded, any measurement here is over a biased 43% of the
corpus — the blocks that happen not to import their own package.

## Remaining

- [ ] Reseed the cache (5d7z), then re-run the probe over the full corpus.
- [ ] With hits in hand, measure the actual false-positive rate.
- [ ] Tune the ladder / threshold on that evidence.
- [ ] Only then consider raising severity above `minor`.


---

## Re-checked 2026-08-08 (session `3bada08b`) — blocked downstream of 5d7z

Asked to work all open beans, so this was re-tested rather than inherited.

The toolchain this bean once wanted is present and works (`lean` 4.24.0, `lake`
5.0.0 under `~/.elan/toolchains/`), and the bean already established Nazrin
itself is unnecessary — Lean's own automation is the oracle.

What remains is the measurement, and it is gated on the cache reseed exactly as
this bean says: 16 of 28 candidate blocks (57%) could not be probed because
their sibling `.lean` files import the paper's own package and the cache branch
carries zero of its oleans. Re-tested the reseed blocker under `5d7z` and
`02kc`: every host it needs is unreachable from an authoring container (000 /
403), and there is no folio checked out here at all.

So the order is fixed and unchanged: **reseed in CI (5d7z) → re-probe → measure
the false-positive rate → only then tune the threshold or raise severity.**
Nothing here is actionable from an authoring container. The criterion remains
inert by construction in the meantime — no cache means `n/a`, and the note says
"not measured", never "nothing trivial".
