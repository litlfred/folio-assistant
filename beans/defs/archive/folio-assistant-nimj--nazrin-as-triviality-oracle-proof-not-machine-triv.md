---
# folio-assistant-nimj
title: Nazrin as triviality oracle (proof-not-machine-trivial)
status: scrapped
type: task
priority: normal
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-08T16:05:00Z
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


---

## Measured 2026-08-08 (session `3bada08b`) — the oracle works; three defects fixed

The bean was blocked on the false-positive rate, which needs the `5d7z`
reseed. But a second question was sitting underneath it, unnoticed and not
blocked: **the first qou run reported `probed 12, closed 0`, and that was read
here as "none of 12 real qou theorems fall to cheap automation". A probe that
can never close anything prints the identical line.** Nothing in the output
separated the two readings.

Settled it with a control: core-Lean declarations of known difficulty, run
through the real code path (no Mathlib, no folio, no cache — just the toolchain
`ga7e` restored).

    trivTrue     CLOSED step 1 (trivial)
    simpAppend   CLOSED step 3 (simp)      <- trivial and rfl both lost first
    omegaLinear  CLOSED step 5 (omega)     <- the ladder really walks
    substantive  open                      <- and does not close everything

So the probe discriminates, and qou's `closed 0` is a real measurement. That
control is now `scripts/tests/lean-triviality-probe.test.ts`.

Getting there surfaced three ways the probe reported a **mechanical failure as
a substantive result** — each one scoring a block `pass`, "not machine-trivial":

1. **A rung that is not installed.** `aesop` is not core Lean; without Mathlib
   it errors `unknown tactic` and exits non-zero, which an exit-code check
   scores as "ran and lost". The ladder silently had five rungs. Now recorded
   as `ladder.unavailable`, and the criterion reads a short-ladder "not closed"
   as `n/a` rather than `pass`.
2. **A rung that ran out of time.** `execFileSync` reports a timeout by killing
   the child, landing in the same catch as a failed proof. A tactic that did
   not answer is not a tactic that lost — and `simp` is the rung most likely to
   be slow on the goals most worth flagging. Now `ladder.timedOut`. Same for
   the baseline: `baseline-timeout` is a distinct skip from `baseline-fails`,
   because "too slow" must not print "restore the oleans".
3. **A splice that landed inside the statement.** `splitDeclarations` cut at
   the first `:=` *anywhere*, though its doc comment has always said "the first
   **top-level** `:=`". A statement containing one — `(let x := 5; x) = 5`, a
   structure instance — had the tactic written over its own type; the file
   stopped elaborating, all six rungs failed, `closed: false`. Fixed at the
   source with `topLevelCut`.

**Defect 3 reached further than this bean.** `lean-signature` builds the QA
**statement hash** from the same cut, so a truncated signature hashes a partial
statement:

    theorem t : (let x := 5; x) = 5 := by rfl     hash d1b45ae0f3e3
    theorem t : (let x := 5; x) = 6 := by rfl     hash d1b45ae0f3e3

A changed statement that never invalidates its QA sidecar — a staleness check
passing by finding nothing. Equivalence-checked before landing: over 17
declaration shapes the new cut agrees with the old on all 12 that were already
correct, and differs only on the 5 it was getting wrong.

The skip bucket is also classified now (`decl-not-found` / `no-body` /
`baseline-fails` / `baseline-timeout`), because this bean's own headline number
— 16 of 28 blocks (57%) unprobeable — came from an undifferentiated counter
whose log line asserted one cause for all four. When the reseed lands, that
number will say which fix it needs.

### Remaining — unchanged, still gated on 5d7z

- [ ] Reseed the cache (5d7z), then re-run the probe over the full corpus.
- [ ] With hits in hand, measure the actual false-positive rate.
- [ ] Tune the ladder / threshold on that evidence.
- [ ] Only then consider raising severity above `minor`.

What changed is that the measurement will now be trustworthy when it runs.
Before this it would have been taken with a five-rung ladder, a timeout counted
as a loss, and any statement containing `:=` silently scored "not trivial".

---

## 2026-08-08 — SCRAPPED by owner decision, downstream of the reseed being declined

Every remaining item here needs the `5d7z` reseed, and that was put to the
owner with its costs and declined. So the false-positive rate stays
**unmeasured by choice, not by blocker** — which is a different and more
honest state than "blocked", and the reason this is being closed rather than
left open to be re-tested a fourth time.

The bean's own standard was right and is being held to: *"shipping the scaffold
is not the same as adopting the idea."* The idea is not adopted.

**Nothing is ripped out**, because nothing costs anything to keep:

- `proof-not-machine-trivial` stays shipped at `minor`, warn-only, and inert by
  construction — no cache means `n/a`, and the note says "not measured", never
  "nothing trivial". It cannot produce a wrong answer; it can only decline to
  produce one.
- `lean-triviality-probe.ts` and its control test stay. The control is what
  established the probe discriminates at all, and it runs on core Lean with no
  cache, no Mathlib and no folio — so it keeps working regardless of this.
- The three defects fixed along the way stay fixed, and one of them was never
  about this bean: `topLevelCut` also repaired the QA **statement hash**, where
  a statement containing `:=` hashed a truncated prefix and a changed statement
  never invalidated its sidecar. That was a staleness check passing by finding
  nothing, and it is fixed independently of anything decided here.

So the ledger is: the criterion is real and safe, the probe is real and
verified, one genuine bug in an unrelated system was caught, and the only thing
not obtained is the tuning evidence — which needs the reseed nobody is buying.

To reopen: land the reseed, re-run the probe over the full corpus, measure the
FP rate at `TRIVIAL_STEP_THRESHOLD = 3`, then decide on severity. In that
order, and not before.
