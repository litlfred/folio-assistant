# R5.6 — Wedderburn-block decomposition for the canonical-T_w SDP

**Status**: design + scaffold (this doc + `sdp_per_block.rs` +
`bin/r5_6_smoke.rs`).  Smoke test target: H_3 / H_4 with
≤ 1e-5 residual against `sdp_solve_canonical_t_w`.

**Next research item (R5.7, separate session)**: ⁶Li at H_18 with
filtration cutoff L = 8 + AME anchor.  Do **not** attempt H_18 in
this scaffold — the goal here is correctness equivalence at the
small scale where the monolithic SDP already works.

## Why decomposition

R5.5 hits a hard memory wall at H_10+:

| n  | filtration cutoff | n_vars  | max d_λ | monolithic SDP |
|----|-------------------|---------|---------|----------------|
| 8  | 2                 | ~30     | 14      | works, ~10s    |
| 10 | 2                 | ~50     | 42      | OOM            |
| 18 | 8                 | ~10^5   | 4862    | infeasible     |

The monolithic SDP packs **every** Wedderburn block into one
giant constraint matrix (one big `PSDTriangleConeT(d_λ)` per λ,
all sharing the variables c⁺_w, c⁻_w).  At H_18 the
*sum* of svec dimensions Σ_λ d_λ(d_λ+1)/2 ≈ 5·10^7 — entirely
infeasible for one Clarabel call on a single machine.

Wedderburn-block decomposition exploits the structure
**ρ_λ(T(c)) ⪰ 0 is a per-λ statement that only sees c through
the λ-block image**: each block can be solved in isolation, then
joined at the end via small linear coupling constraints.

## Per-block variable layout

The variables of the joint SDP are
`c⁺_w, c⁻_w  for w with ℓ(w) ≤ L` — one pair per element of the
Coxeter-length ball.  The decomposition keeps **the same variable
set** but partitions the *constraints*:

```
joint SDP
├─ NN cone     c⁺_w ≥ 0,  c⁻_w ≥ 0          (shared, |perms| · 2 rows)
├─ PSD cone λ_1: ρ_{λ_1}(T(c)) ⪰ 0           (block 1, dim d_{λ_1}^2)
├─ PSD cone λ_2: ρ_{λ_2}(T(c)) ⪰ 0           (block 2, dim d_{λ_2}^2)
│   ⋮
├─ PSD cone λ_m: ρ_{λ_m}(T(c)) ⪰ 0           (block m, dim d_{λ_m}^2)
└─ ZERO cone: linear anchors                  (shared, k rows)
```

**Per-block SDP** (one per λ): solve in **isolation** the
restricted SDP with only the λ-PSD constraint, sharing the
NN cone and the linear anchors.  Each per-block SDP has
2·n_vars + svec(λ) + k rows but **only one big PSD cone**.

### Coupling via `c_w` consensus

Per-block SDPs all share the same variables `c_w`.  Two coupling
strategies (we implement Strategy A in scaffold; Strategy B is
R5.7 follow-up):

**Strategy A (sequential intersection)**: solve block-by-block,
treating the previously-feasible `c` as a starting point with
warm-started bounds.  Caveat: not jointly optimal in ‖c‖_1 unless
the subproblems are convex-cone-compatible (they are, since the
intersection of PSD cones over the same variable space is itself a
convex feasibility problem).  Iteration to fixed point gives
joint optimality.

**Strategy B (ADMM / dual decomposition, R5.7)**: introduce
duplicate variables `c_w^{(λ)}` per block + consensus constraint
`c_w^{(λ)} = c_w^{(λ')}` ∀ λ, λ'.  Solve each block in
parallel via Rayon; reconcile via dual updates.  This is the
production path for H_18.

For the scaffold (this PR) we implement Strategy A, since it
admits the simplest correctness check against the monolithic SDP.

### Linear coupling (cross-level + AME anchor)

The `LinearAnchor` set in `sdp_solve_canonical_t_w` (TraceOfBlock,
SingleCoefficient) is **shared** across all per-block SDPs.  The
cross-level embedding consistency check
(`cross_level_embedding::verify_edge`) produces additional linear
constraints `Σ_w λ_w c_w(parent) = Σ_w λ'_w c_w(child)` — these
are **also shared** and added to every per-block SDP unchanged.

## Expected memory profile at H_18

For H_18 (S_18) with cutoff L = 8:
- n_vars ≈ 10^5
- partitions of 18: 385
- max d_λ = 4862 (block (9,9))
- median d_λ ≈ 100, modal d_λ < 30

Monolithic SDP svec total: Σ_λ d_λ(d_λ+1)/2 ≈ 5·10^7 svec rows.
Decomposed: max(d_λ(d_λ+1)/2) ≈ 1.2·10^7 (top block alone).
Excluding the (9,9) block (which we may need to drop or
sub-decompose), the median block svec dim is ~5·10^3 — perfectly
solvable in seconds.

Memory per per-block solver call dominated by the PSD cone CSC
matrix: O(n_vars · d_λ²) entries.  For d_λ ~ 100 and n_vars ~ 10^5,
that is 10^9 entries — still too large for one solver.  R5.7 will
need either:
(a) further variable reduction by GB-filtration sparsity (drop
    perms whose ρ_λ projection is zero — large fraction by
    Murnaghan-Nakayama), or
(b) per-block sparse svec packing (only push non-zero coefficients
    into the CSC).

Strategy A scaffold here uses option (b) (the existing
`if coef.abs() > 1e-18` filter in the monolithic CSC build).

## Rayon-parallel structure

```rust
use rayon::prelude::*;

let block_results: Vec<BlockResult> = parts
    .par_iter()
    .map(|shape| solve_single_block(shape, ...))
    .collect();
```

Each call to `solve_single_block` is an independent Clarabel
solve, so blocks parallelize trivially.  Strategy A intersects
results sequentially after the parallel pass.

For the scaffold smoke test we **do not** require Rayon
parallelism — H_3 / H_4 have only 3 / 5 partitions and finishing
in serial is fine.  The `par_iter` swap is a one-line change for
R5.7.

## Smoke-test plan (this PR)

1. `bin/r5_6_smoke.rs` runs the new `PerBlockSdpSolver` and the
   existing monolithic `solve_canonical_t_w` on identical
   anchors at H_3 and H_4.
2. Compare the recovered `c_solved` BTreeMap entry-by-entry.
3. Pass criterion: every `c_w` agrees to ≤ 1e-5 absolute,
   solver_status reports "Solved" or "AlmostSolved".

## Scope boundary (what is NOT in this PR)

- **No Rayon parallelism yet** (Strategy A is serial; the
  `par_iter` upgrade is one line, deferred so the scaffold's
  failure mode is single-threaded and easy to debug).
- **No ADMM / consensus iteration** — Strategy A intersects
  each block's feasible region by warm-starting `c` from the
  previous block's solution; full joint optimality requires
  Strategy B, which is R5.7.
- **No H_18 / ⁶Li run** — that is R5.7.
- **No new content blocks / Lean files** — implementation only.

## Known limitations / what to try next if smoke breaks

(Filled in *only* if the scaffold smoke test does not pass.)

### Symptom: per-block solver returns Infeasible at H_3

- **Cause hypothesis 1**: anchors not propagated correctly to
  every block.  Each per-block SDP needs the **full** linear
  anchor set, not just the block's PSD constraint.  Verify
  every `solve_single_block` call passes the unmodified
  `anchors: &[LinearAnchor]`.
- **Cause hypothesis 2**: NN cone duplicated across blocks.
  This is fine in Strategy A (each block is its own SDP, so
  c⁺_w ≥ 0 must be in each one), but could fool the joint-
  ‖c‖_1 objective.  Confirm objective `Σ (c⁺_w + c⁻_w)` is the
  same in every block.
- **Cause hypothesis 3**: per-block solution from block_i is
  not feasible for block_j.  This is the genuine joint-
  feasibility problem; if so, Strategy A's sequential
  intersection fails — must skip to Strategy B (ADMM).

### Symptom: `c_solved` differs by > 1e-5

- The monolithic SDP minimizes `Σ (c⁺_w + c⁻_w)` jointly under
  *all* PSD constraints simultaneously.  Strategy A intersects
  them sequentially; the result is a feasible point but not
  necessarily the same minimum-‖c‖_1 point.  At H_3 the
  feasible polytope is small enough that this should not show
  up; if it does at H_4, this is an expected joint-vs-sequential
  divergence and Strategy B is needed.

### Symptom: numerical drift > 1e-5 at H_4

- Increase Clarabel `max_iter` from 500 → 2000 in the per-block
  builder.
- Tighten Clarabel `eps_abs` / `eps_rel` from default to 1e-9.
- Consider using `MPFR seminormal` (`seminormal_mpfr.rs`) for
  block-matrix construction to eliminate the f64 round-off in
  the svec CSC entries.

## File layout

```
tools/hecke-engine/
├── R5_6_DECOMPOSITION_PLAN.md     ← this doc
├── src/
│   ├── lib.rs                      ← `pub mod sdp_per_block;`
│   ├── sdp_per_block.rs            ← new: PerBlockSdpSolver
│   └── bin/r5_6_smoke.rs           ← new: smoke binary
```

## References

- `R5_FULL_PLAN.md` §R5.6 row.
- `src/sdp_solve_canonical_t_w.rs` — the monolithic baseline this
  decomposition must agree with at H_3 / H_4.
- `src/wedderburn_psd.rs` — per-block PSD evaluator (R3 of the
  pipeline; used here only as a reference for partition iteration
  and svec layout, not for the SDP itself).
- `src/cross_level_embedding.rs` — produces the linear coupling
  constraints joining tower edges (used by R5.7, included as
  comments in this scaffold for future hookup).
- `content/quantum-observable-universe/braids-and-knots/joint-tower-sdp-confinement.md`
  — formulation of the SDP this code implements.
