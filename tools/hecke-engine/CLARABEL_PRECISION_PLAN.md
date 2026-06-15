# Clarabel high-precision integration — QOU workplan

Companion to [`RUST_INTEGRATION.md`](RUST_INTEGRATION.md),
[`R5_FULL_PLAN.md`](R5_FULL_PLAN.md), and
[`SOLVER_SWAP_STATUS.md`](SOLVER_SWAP_STATUS.md).  This plan is
also the **solver leg** of [`docs/plans/F-precision-lift-mpfr.md`](../../docs/plans/F-precision-lift-mpfr.md)
— Plan F covers the categorical pipeline end-to-end (substrate q₀
→ Hoefsmit → χ_λ → y_λ → tr_M → mass-excess); this plan is
specifically the §1b/SDP rung where `f64` becomes `FloatT`.
Plan F's §1a (substrate q₀ at 50 dps) is already implemented via
the `Q_MP`/`q_at(dps)`/`vol_4_1_at(dps)` HP API in
[`folio-assistant/computations/q_parameter.py`](../../folio-assistant/computations/q_parameter.py).

## Why precision is the bottleneck

The risk flagged in [`R5_FULL_PLAN.md` §Risks
(3)](R5_FULL_PLAN.md):

> $q_0 \approx 1.1097$ is not special — small perturbations can flip
> PSD signatures.  Use MPFR with $\geq 50$ digits and re-validate.

QOU already runs the **character path** at 167 bits ($\approx 50$ dps)
via [`seminormal_mpfr.rs`](src/seminormal_mpfr.rs).  But the
**SDP path** drops back to `f64` at every step from `q` through the
solver call.  At $H_{18}$ (⁶Li) onward the Wedderburn-block PSD
signatures are sign-sensitive in the last few `f64` bits — see the
H_5 anomaly diagnosed in
[`bin/r5_5_diagnose_h5.rs`](src/bin/r5_5_diagnose_h5.rs) and the
post-mortem in [`R5_5_BUG_REPORT.md`](R5_5_BUG_REPORT.md).  Closing
the f64→MPFR gap on the solver side is the missing rung for R5.6/R5.7.

---

## Section 1 — Audit of the f64 boundary

Every site below currently forces `f64` and must become generic over
a `FloatT` parameter (or be paralleled by an MPFR sibling).  Grouped
by file; each entry records the relevant symbol or site and the issue.

### `src/sdp_verifier.rs` (bisection — no Clarabel call)

| Site | Type | Notes |
|---|---|---|
| `SdpVerifierReport.q0`, `alpha_star`, `min_eigenvalue_at_alpha_star` | `f64` | Public API surface |
| `min_eig_at_alpha(n, braid, q: f64, alpha: f64) -> f64` | `f64` | Calls `wedderburn_psd::evaluate_all_blocks(_, _, q: f64)` |
| `solve_alpha_psd(_, _, q: f64)` bisection | `f64` | Tolerance `1e-12` is f64-tuned |

This module is not strictly Clarabel-bound, but its eigenvalue source
(`wedderburn_psd`) is the same `seminormal_matrices(_, q: f64)` that
the Clarabel modules use — so any MPFR refactor must thread through
here too for the cross-validation tests in §3 to be meaningful.

### `src/sdp_solver_clarabel.rs` (R5.3 — α-PSD via Clarabel)

| Site | Type | Issue |
|---|---|---|
| `ClarabelSdpReport { q0, alpha_star }` | `f64` | API |
| `invert_matrix_h`, `sparse_to_dense`, `dense_dense_mul`, `symmetrize` | `Vec<Vec<f64>>` | All matrix ops f64 |
| `build_rho_lambda(_, _, q: f64)` | `f64` | Pulls from `seminormal_matrices(_, q: f64)` |
| `svec_pack` uses `2f64.sqrt()` | `f64` | √2 scaling at f64 precision |
| `q_vec: Vec<f64>`, `a_vals: Vec<f64>`, `b: Vec<f64>` | `f64` | Clarabel input vectors |
| `cones: Vec<SupportedConeT<f64>>` | `f64` | Clarabel cone descriptors |
| `DefaultSolver::new(...)` | `DefaultSolver<f64>` | Solver is monomorphised on f64 |
| `solver.solution.{x, obj_val}` | `Vec<f64>`, `f64` | Output |

### `src/sdp_solve_canonical_t_w.rs` (R5.5 — canonical $T_w$ solver)

| Site | Type | Issue |
|---|---|---|
| `LinearAnchor::TraceOfBlock { target: f64 }`, `SingleCoefficient { target: f64 }` | `f64` | API |
| `SolverReport.{q0, c_solved, l1_norm}` | `f64`, `BTreeMap<_, f64>`, `f64` | API |
| `build_rho_lambda_for_basis_element(_, _, q: f64)` | `f64` | Same chain as above |
| `svec_pack_symmetric` uses `2f64.sqrt()` | `f64` | √2 |
| `coef.abs() > 1e-18` (sparsity threshold for A) | `f64` | Tuned to f64 ε |
| `cw.abs() > 1e-9` (output prune threshold) | `f64` | Tuned to f64 ε |
| Clarabel CSC, cones, solver | `f64` | Same |

### `src/sdp_recover_canonical.rs` (R5.4 — recovery test)

| Site | Type | Issue |
|---|---|---|
| `RecoveryReport.{q0, c_recovered, c_target, max_residual}` | `f64` family | API |
| `eval_laurent_at(p: &LaurentQ, q: f64) -> f64` | `BigRational → f64` | **Information-losing**: collapses exact rational coefficients to f64 before they reach the SDP |
| `build_rho_lambda_for_basis_element(_, _, q: f64)` | `f64` | Same |
| svec packing with `2f64.sqrt()` | `f64` | Same |
| `coef.abs() > 1e-18` | `f64` | Same |
| Clarabel CSC, cones, solver | `f64` | Same |

### Upstream consumers (unchanged but f64-typed)

| Site | Type | Issue |
|---|---|---|
| `seminormal::seminormal_matrices(shape, q: f64)` | `Vec<Vec<(usize, f64)>>` | The kernel matrix builder used by every SDP module |
| `wedderburn_psd::evaluate_all_blocks(_, _, q: f64)` | f64 eigenvalues | Same |
| `joint_tower_sdp_certificate::WedderburnBlockReport.{matrix_at_q_0_sym_eigvals, min_eigenvalue}` | `Vec<f64>`, `f64` | Witness JSON schema |

### What already exists at MPFR precision

| Module | API | Reusable for |
|---|---|---|
| `seminormal_mpfr::chi_lambda_braid_mpfr(shape, word, q_str, dps) -> String` | character only | trace anchors, sanity checks |
| `seminormal_mpfr::chi_lambdas_braid_mpfr` | parallel batch | tier-2 cross-validation |
| `seminormal_mpfr::dps_to_bits` | dps → bit precision | shared helper |
| `laurent_poly_q::evaluate_mpfr` | LaurentQ → `rug::Float` | replacement for `eval_laurent_at` |

**Gap**: there is no `seminormal_matrices_mpfr` — the per-element
`BlockMpfr` machinery in `seminormal_mpfr.rs` materialises only the
contracted character via `apply_sigma_mpfr`.  The high-precision SDP
path needs the full per-block matrix, not just its trace.

---

## Section 2 — Integration shim

Six concrete deliverables, ordered by dependency.

### S1.  Add `seminormal_matrices_mpfr` (~120 LOC)

New function in `src/seminormal_mpfr.rs`:

```rust
pub fn seminormal_matrices_mpfr(
    shape: &[usize],
    q_str: &str,
    dps: u32,
) -> Vec<Vec<Vec<(usize, rug::Float)>>>;
```

Same shape as `seminormal::seminormal_matrices` but each entry is a
`rug::Float` at the requested precision.  Reuses `build_blocks_mpfr`
(already there); adds a materialisation pass that emits the sparse
generator matrices instead of contracting against a basis vector.

### S2.  Generic dense linear-algebra helpers (~200 LOC)

New `src/dense_la.rs`.  Generic over a custom `Scalar` trait that
explicitly handles the precision-context problem `rug::Float` has
and `f64` doesn't:

```rust
pub trait Scalar:
    Clone + std::ops::Add<Output=Self> + std::ops::Sub<Output=Self>
    + std::ops::Mul<Output=Self> + std::ops::Div<Output=Self>
{
    /// Build from an `f64` literal — for `rug::Float` this carries
    /// the working precision in the implementor's context.
    fn from_f64(v: f64) -> Self;
    /// Square root in the scalar's precision.
    fn sqrt(self) -> Self;
    /// Sparsity / zero-test threshold (≈ machine epsilon at the
    /// scalar's precision).
    fn epsilon() -> Self;
    fn is_zero_within(&self, eps: &Self) -> bool;
}
```

`num_traits::Float` plus `num_traits::FromPrimitive` covers most of
this for `f64`, but `rug::Float` is not `Copy` and needs a
precision-context constructor — so a custom trait (rather than just
re-using `num_traits::Float`) is the cleanest path on stable Rust.

Ports the four helpers (`sparse_to_dense`, `dense_dense_mul`,
`invert_matrix_h`, `symmetrize`) once instead of duplicating per
Clarabel module.  Constants like `0.5` (in `symmetrize`) flow
through `Scalar::from_f64(0.5)`.  Two instantiations:

- `Scalar = f64` — drop-in replacement for the existing `f64`
  helpers in the three SDP modules; `from_f64` is identity.
- `Scalar = rug::Float` — used by the MPFR path; `from_f64` calls
  `Float::with_val(prec, v)` against the module-level precision.

### S3.  Generic `svec_pack` (~30 LOC)

In `src/dense_la.rs` (alongside S2).  Replaces the three duplicate
`svec_pack`/`svec_pack_symmetric` definitions.  √2 is computed via
`Scalar::from_f64(2.0).sqrt()` so MPFR uses the high-precision sqrt
and f64 stays bit-identical to the current `2f64.sqrt()`.

### S4.  `sdp_solver_clarabel_hp.rs` — the high-precision solver
       (~350 LOC)

New module sitting alongside `sdp_solver_clarabel.rs`.  Mirrors its
structure but generic over the Clarabel `FloatT` parameter that
upstream is adding:

```rust
pub struct ClarabelSdpReportHp<F: clarabel::algebra::FloatT> {
    pub n: usize,
    pub q_str: String,        // exact decimal — no f64 boundary at the API
    pub dps: u32,
    pub alpha_star: F,        // returned at solver precision
    pub solver_status: String,
    pub n_blocks: usize,
    pub block_dims: Vec<usize>,
    pub iterations: u32,
}

pub fn solve_alpha_psd_clarabel_hp<F: clarabel::algebra::FloatT>(
    n: usize,
    braid_word: &[i32],
    q_str: &str,
    dps: u32,
) -> ClarabelSdpReportHp<F>;
```

Key choices:
- **API takes `q_str`, not `f64`** — kills the lossy boundary at
  the entry.  Internally parses to `rug::Float` once then converts to
  `F` for Clarabel.  The `rug::Float → F` step is **the single
  upstream-Clarabel constraint**: `clarabel::algebra::FloatT` does
  not currently expose `From<rug::Float>`, so the upstream
  high-precision feature must surface either (a) a conversion trait
  the QOU side can call, or (b) a concrete HP scalar type we
  monomorphize against.  S4 cannot land until this is settled with
  upstream; track resolution in the PR description.
- **Returns at solver precision** — caller decides whether to project
  to `f64` for witness JSON or keep at `F`.
- **Sparsity threshold** is `F::epsilon() * <const factor>` instead
  of the hard-coded `1e-18`.

### S5.  Same treatment for `sdp_solve_canonical_t_w` and
       `sdp_recover_canonical` (~400 LOC each → ~800 LOC total)

Pattern-identical to S4.  Outputs:
`solve_canonical_t_w_hp(...) -> SolverReportHp<F>` and
`solve_recovery_h_n_hp(...) -> RecoveryReportHp<F>`.

In `sdp_recover_canonical_hp.rs`, replace `eval_laurent_at` with
`laurent_poly_q::evaluate_mpfr` so the LaurentQ → solver coefficient
path stays exact / arbitrary-precision end-to-end.

### S6.  Cargo wiring + feature flag (~20 LOC)

**Note.** `tools/hecke-engine/Cargo.toml`
already has a `clarabel-sdp` feature flag landed via main commit
[`0b1552f`](https://github.com/litlfred/qou/commit/0b1552f) — see
[`SOLVER_SWAP_STATUS.md`](SOLVER_SWAP_STATUS.md).  That flag gates
*Clarabel itself* (and its system BLAS/LAPACK toolchain
dependency) so default builds skip OpenBLAS / netlib entirely.
This plan's high-precision flag layers on top — `clarabel-hp` is
the *new HP-solver-siblings* flag, requires `clarabel-sdp`, and
won't be added until §S4–S6 implementation work begins.

Final Cargo wiring:

```toml
[dependencies]
clarabel = { version = "0.12", features = ["sdp-netlib"], optional = true }   # bump

[features]
default = []
clarabel-sdp = ["dep:clarabel"]   # already on main: gates the f64 SDP solver
clarabel-hp  = ["clarabel-sdp"]   # adds the new HP solver siblings; rug already mandatory
```

`lib.rs` adds `#[cfg(feature = "clarabel-hp")] pub mod
sdp_solver_clarabel_hp;` (and the two siblings).  Default builds
remain f64 *and* skip Clarabel/BLAS entirely.

**Why rug stays mandatory.**  `rug` is already a non-optional
dependency (Cargo.toml L66) because `seminormal_mpfr.rs`,
`laurent_poly_q::evaluate_mpfr`, and `bin/v9.rs` already use it
unconditionally.  Making `rug` optional (so an `f64`-only build
needs no MPFR/GMP system libs) is a desirable but separate
refactor — it would require gating those existing modules too.
This plan keeps that out of scope; the `clarabel-hp` flag gates
only the *new* HP solver siblings.

### S7.  Consumer side: round-trip 50-dps output (~250 LOC + schema)

Producing high-precision output from Clarabel is half the problem.
The other half is **not collapsing it back to `f64` immediately**
on the consumer side.  Every downstream sink in QOU today is `f64`:

| Sink | Current type | After |
|---|---|---|
| `WedderburnBlockReport::matrix_at_q_0_sym_eigvals` | `Vec<f64>` | `EigenvalueList` (see below) |
| `WedderburnBlockReport::{min,max}_eigenvalue` | `f64` | `PrecisionScalar` |
| `JointTowerSdpCertificate::b_pred_mev` / `b_ame_mev` | `f64` | `PrecisionScalar` |
| `joint-tower-sdp-{atom}.witness.json` (Python-side) | JSON `number` | JSON `string` (decimal) + sibling `_dps` int |
| Atlas renderer (`recursive_atom_knot_atlas_render.py`) | `float()` | `mpmath.mpf(...)` or `decimal.Decimal(...)` |
| `folio-assistant/schemas/proof-objects.ts` | `number` | tagged decimal-string type |

#### S7.1 — `PrecisionScalar` envelope type (~80 LOC)

New `src/precision_scalar.rs`.  A serde-capable wrapper that round-
trips a number at requested decimal precision without ever going
through `f64`:

```rust
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PrecisionScalar {
    /// Canonical decimal representation (signed, with optional
    /// fractional part and optional `e<int>` exponent).
    pub value: String,
    /// Significant decimal digits encoded in `value`.
    pub dps: u32,
}

impl PrecisionScalar {
    pub fn from_rug(f: &rug::Float, dps: u32) -> Self { ... }
    pub fn to_rug(&self, dps: u32) -> rug::Float { ... }
    /// Lossy projection — only call from a code site that explicitly
    /// accepts the precision drop (logging, charts, sanity checks).
    pub fn to_f64_lossy(&self) -> f64 { ... }
}
```

Reuse points: `seminormal_mpfr.rs` already emits decimal strings via
`Float::to_string_radix(10, Some(dps as usize))` — `from_rug` is
that one-liner with the `dps` field added.

Wire `PrecisionScalar` into `joint_tower_sdp_certificate.rs` behind
the `clarabel-hp` feature.  Default builds keep `f64`; HP builds use
the wrapper.

#### S7.2 — High-precision certificate variants (~80 LOC)

Add `WedderburnBlockReportHp` / `JointTowerSdpCertificateHp` (or
make the existing structs generic over `Scalar = f64 |
PrecisionScalar`).  Two emit paths:

- f64 certificate: `joint-tower-sdp-{atom}.witness.json` (legacy
  schema, unchanged).
- HP certificate: `joint-tower-sdp-{atom}.hp.witness.json` (new
  schema, side-by-side; atlas renderer falls back to legacy if HP
  is missing).

#### S7.3 — Folio-assistant schema (~40 LOC TypeScript)

`folio-assistant/schemas/proof-objects.ts` already validates witness
JSON via Zod.  Add a `precisionScalar` Zod schema:

```ts
export const precisionScalar = z.object({
  value: z.string().regex(/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/),
  dps: z.number().int().positive(),
});
```

Update `wedderburnBlockReport` to use `z.union([z.number(),
precisionScalar])` so existing f64 witnesses keep validating while
the HP variant gets first-class support.

#### S7.4 — Python consumer (`recursive_atom_knot_atlas_render.py`)
       + sister scripts (~50 LOC)

Pattern: probe for `_dps` field, route accordingly.

```python
def _read_scalar(node):
    if isinstance(node, dict) and "value" in node and "dps" in node:
        # 50-dps decimal — keep it that way
        import mpmath
        mpmath.mp.dps = max(mpmath.mp.dps, node["dps"])
        return mpmath.mpf(node["value"])
    return float(node)
```

Affected scripts: `recursive_atom_knot_atlas_render.py`,
`witness_staleness_tracker.py`, `joint_tower_sdp_solver.py`
(Python prototype, kept as cross-check at H_3..H_5).

Crucial: AME-anchor comparisons and ppb-error metrics must use
`mpmath` arithmetic on the HP path, not silently fall back to `float`
(which would lose the 50→16 dps distinction the work was meant to
preserve).

### S8.  Exact-in-q₀ optimization (stretch — bigrational backend)
       (~150 LOC)

The upstream Clarabel `claude/bigrational-backend-BeGUU` branch
([Phase 1: decouple `FloatT` from `num_traits::Float`](https://github.com/litlfred/Clarabel.rs/pull/1))
opens a third Scalar instantiation beyond `f64` and `rug::Float`:
**`num_rational::BigRational`** — exact rational arithmetic, no
rounding at any step.

This is interesting *as research*, not just as numerics.  If the
SDP is run in exact rational mode at $q_0 \in \mathbb{Q}$ (any
rational truncation of the substrate constant — e.g.\
$q_0 = 11097/10000$), every interior-point iterate is exact and
the recovered coefficients $c_w(q_0)$ are honest rationals.  Three
things become observable that 50-dps cannot tell you:

- **Are the $c_w$ small-denominator rationals?**  If yes, the
  SDP solution is *algebraically* simple — not just numerically
  feasible.  This would reveal hidden Wedderburn-multiplicity
  structure (a coefficient like $c_w = 13/8$ has different
  structural meaning than $c_w = 0.625000003...$).
- **Is the support exactly the GB-filtration support?**  In
  floating-point we threshold at $10^{-9}$ to declare zero; in
  exact mode there is no threshold — a coefficient is zero iff its
  numerator is zero.  We learn whether the GB-filtration sparsity
  prediction is sharp.
- **Does $\ell_1$ minimisation pick a unique vertex of the
  polytope?**  Exact arithmetic exposes degeneracies that f64/MPFR
  smooths over.

Implementation: instantiate `Scalar = BigRational` in `dense_la`
(S2) and the generic `svec` (S3); pose the same SDP via Clarabel HP
with `F = BigRational` once upstream surfaces it.  `q_str` becomes
`q_num: BigRational` (e.g.\ parsed from `11097/10000` or any other
rational approximation the user supplies).

Caveats:

- BigRational arithmetic is **slow** — denominator size grows along
  the IPM path.  Expect H_3 in seconds, H_6 in minutes, H_18
  potentially intractable.  S8 is a *diagnostic* mode for small
  problems, not a production replacement for S4–S6.
- The choice of rational $q_0$ matters: $11097/10000$ vs
  $554851/500000$ may give *different exact answers* with the same
  initial digits.  Document the rationalisation rule in each
  witness (`q_str`, `q_num_form`).
- If a sequence of rational truncations $q_0^{(k)}$ yields a
  convergent sequence of $c_w^{(k)}$, the limit is the "true"
  answer at irrational $q_0$ — recover it by Padé / continued-
  fraction reconstruction.  Out of scope for S8 baseline; record
  the per-truncation rationals so this analysis is possible later.

Output: `joint-tower-sdp-{atom}.exact.witness.json` with
coefficients as `{"num": "...", "den": "..."}` strings.  The
`PrecisionScalar` schema from S7 extends naturally — add a
discriminated variant `kind: "rational" | "decimal"`.

### Estimated effort

| Step | LOC | Time |
|---|---|---|
| S1 — `seminormal_matrices_mpfr` | ~120 | 4-6 hr |
| S2 — generic dense LA | ~200 | 4-6 hr |
| S3 — generic svec | ~30 | 1 hr |
| S4 — `sdp_solver_clarabel_hp` | ~350 | 1 day |
| S5 — `sdp_solve_canonical_t_w_hp` + `sdp_recover_canonical_hp` | ~800 | 2 days |
| S6 — Cargo + feature flag | ~20 | 1 hr |
| S7 — consumer-side 50-dps round-trip (Rust + TS + Python) | ~250 | 1 day |
| S8 — exact-rational mode (stretch, BigRational scalar) | ~150 | 4-6 hr |
| **Total** | **~1900 Rust + small TS/Python** | **~5-6 working days** |

Blocker: needs the upstream Clarabel high-precision feature to be
mergeable / vendorable.  S1, S2, S3 are independent of Clarabel and
can land first as a non-breaking refactor.

---

## Section 3 — Test plan

Three tiers of regression / cross-validation, each with explicit
success criteria and witness format.

### Tier T1 — H_3 regression: f64 ↔ MPFR agreement

The existing test set in `sdp_solver_clarabel.rs` and
`sdp_recover_canonical.rs` already covers H_3 at f64.  Add an MPFR
twin for each:

| Test | f64 expectation | MPFR expectation | Cross-check |
|---|---|---|---|
| `proton_borromean_clarabel_alpha_one` (H_3, Borromean) | $\alpha^\* > 0.999$ | $\alpha^\* > 1 - 10^{-40}$ | $|\alpha^\*_{f64} - \alpha^\*_{mpfr}| < 10^{-12}$ |
| `deuteron_clarabel_alpha_quantifies_gap` (H_3, 6_2) | $\alpha^\* < 0.9999$ | same, gap to ≥40 dps | both agree on gap to 12+ dps |
| `clarabel_matches_bisection` (Borromean, 6_2, L6a4) | f64 diff $< 10^{-3}$ | MPFR diff $< 10^{-40}$ | MPFR is the canonical answer |
| `proton_borromean_recovery_at_h3` (R5.4) | residual $< 10^{-5}$ | residual $< 10^{-40}$ | every $c_w$ matches to 12+ dps |
| `h3_solver_with_identity_anchor` (R5.5, $c_e = 1$) | $|c_e - 1| < 10^{-4}$ | $|c_e - 1| < 10^{-40}$ | other $c_w \approx 0$ to 40 dps |

**Rationale.**  At H_3, both paths must succeed and agree.  This is
the smoke test that the MPFR plumbing did not break the algorithm.
If they disagree by more than the f64 envelope, MPFR is right and
the f64 path has an undiagnosed numerical issue we should be aware
of even at small n.

### Tier T2 — H_6 / H_9 cross-validation: bounded precision pickup

Same braids, two scales:

- **H_6**: ²H Hopf-link binding (`[1, -2, 1, 3, -2, 3]` family,
  precise word from
  [`confined-particle.md`](../../content/quantum-observable-universe/braids-and-knots/confined-particle.md))
- **H_9**: nucleon = 3 quarks (`H_3^{⊗ 3}` Borromean tensor, word
  per the same registry)

For each, run `solve_canonical_t_w` (R5.5) f64 vs MPFR with
identity anchor.  Report:

| Metric | f64 | MPFR | Pass criterion |
|---|---|---|---|
| `solver_status` | `Solved` | `Solved` | both succeed |
| support size $|\{w : c_w \ne 0\}|$ | $S_{f64}$ | $S_{mpfr}$ | $S_{mpfr} \subseteq S_{f64}$ (MPFR may prune more aggressively) |
| max $|c_{w,f64} - c_{w,mpfr}|$ over agreed support | — | — | $< 10^{-10}$ |
| $\ell_1$ norm | $L_{f64}$ | $L_{mpfr}$ | $|L_{f64} - L_{mpfr}| / L_{mpfr} < 10^{-10}$ |

**Witness output**: `joint-tower-sdp-{atom}-precision-comparison.witness.json`
with both solutions side-by-side and the diff metrics.  Lives under
`folio-assistant/computations/`.

### Tier T3 — H_18 (⁶Li): the precision-required regime

This is the test that *currently fails* and that the high-precision
work is meant to fix.  Per
[`R5_FULL_PLAN.md` §R5.5](R5_FULL_PLAN.md):

> base infra done; H_3..H_8 work.  H_18 needs Wedderburn-block
> decomposition (memory-bounded, not a correctness issue).

Two subtests:

**T3a — feasibility at MPFR.**  Run `solve_canonical_t_w_hp`
on ⁶Li at $H_{18}$ with filtration cutoff $L = 8$, AME-anchor
constraint, dps = 100.  Success iff:
- `solver_status == "Solved"` or `"AlmostSolved"`
- recovered $c$ passes the R3 Wedderburn-block PSD evaluator
  (`wedderburn_psd::evaluate_all_blocks` re-run at MPFR precision)
  with $\min \mathrm{eig}_\lambda \geq -10^{-30}$ for every $\lambda$
- AME mass anchor: $|B_\mathrm{pred} - B_\mathrm{AME}| / B_\mathrm{AME}
  < 10^{-9}$ (1 ppb)

**T3b — f64 negative control.**  Run the *same* problem on the f64
path.  Expected outcome (today): one of `MaxIterations`,
`NumericalError`, or `Solved` with PSD residual that fails the
R3 verifier.  This documents *why* MPFR was needed.  Witness:
`li6-precision-comparison.witness.json` with the failure mode.

**Witness output**: `joint-tower-sdp-li6.witness.json` with the new
principled-derivation methodology tag, replacing the deprecated
`li-atom-knot-search` entry per
[`R5_FULL_PLAN.md` §R5.8](R5_FULL_PLAN.md).

### Tier T4 — Round-trip 50-dps preservation (S7 gate)

For each H_3 case in T1, drive the full pipeline:

```
solve_alpha_psd_clarabel_hp  →  PrecisionScalar  →
  serde_json  →  witness.hp.json  →  Python mpmath  →  back to F
```

Pass criterion: the decimal string read back by the Python consumer
parses (via `mpmath.mpf`) to a value that matches the original
`F`-typed solver output bit-identically at the requested `dps`.  Any
silent `float()` conversion in the Python path is a regression — the
test scripts grep for accidental `float()` usage on HP witnesses and
fail if any is present.

Witness: `clarabel-hp-roundtrip.witness.json` listing each tested
case + measured precision.

### Tier T5 — Exact-rational diagnostic (S8 stretch)

Exploratory, not a hard pass/fail.  Run `solve_canonical_t_w` at
H_3 (proton Borromean) in BigRational mode with $q_0 = 11097/10000$:

| Observable | Record in witness | Interesting if |
|---|---|---|
| Recovered $c_w$ as $\mathrm{num}/\mathrm{den}$ | yes | denominators all $< 10^9$ |
| Support — exactly the GB-filtration support? | yes | $\Leftrightarrow$ proves filtration sparsity is sharp |
| $\ell_1$ vertex uniqueness (re-solve with random objective tilt) | yes | unique $\Leftrightarrow$ no degeneracy |
| Per-iteration denominator growth | yes (sample iterates) | log-linear $\Rightarrow$ tractable; super-polynomial $\Rightarrow$ S8 won't scale past H_3 |

Repeat at $q_0 \in \{11097/10000, 110970/100000, 5548502/5000000\}$.
Compare the three rational solutions.  If they converge digit-by-
digit to the MPFR result, that's the expected behaviour; if they
*don't*, the workplan flags an investigation: rational truncation
may be picking a different SDP vertex than the irrational limit.

Witness: `joint-tower-sdp-h3-exact.witness.json` with all three
truncations + denominator histograms.  No CI gate (research mode).

### Test infrastructure

1. **New CLI**: `src/bin/clarabel_precision_smoke.rs` — runs T1+T2 in
   under a minute, prints a comparison table, exits non-zero on any
   pass-criterion failure.  Wired into `Cargo.toml` as

   ```toml
   [[bin]]
   name = "clarabel-precision-smoke"
   path = "src/bin/clarabel_precision_smoke.rs"
   ```

   matching the existing hyphenated-bin convention (`hecke-engine`,
   `hecke-mass`, etc.).

2. **CI gate**: add a step to `.github/workflows/lean_ci.yml` (or a
   new `clarabel-precision.yml`):

   ```yaml
   - name: Clarabel precision smoke (T1 + T2)
     run: cd tools/hecke-engine && cargo run --release --features
          clarabel-hp --bin clarabel-precision-smoke
   ```

   T3 stays out of CI (memory + time budget); runs locally and on
   demand via a separate `cargo run --release --bin
   joint-tower-sdp -- --atom 6Li --precision 100`.

3. **Witness staleness wiring**: extend
   [`witness_staleness_tracker.py`](../../folio-assistant/computations/witness_staleness_tracker.py)
   to invalidate the precision-comparison witnesses whenever any of
   the four SDP modules or the two MPFR helpers change.

---

## Section 4 — §S9 dual-certificate verification (Peyrl-Parrilo)

Added after the Round 4 + Phase 8a/8b smoke validation
([`tools/hecke-engine/src/bin/clarabel_round4_*_smoke.rs`](src/bin/),
[`clarabel_phase8b_mpfr_smoke.rs`](src/bin/)) confirmed the upstream
APIs work as advertised.

**Goal.** Take a Clarabel solution at f64 / MpfrFloat precision,
round each Wedderburn-block dual matrix to nearby rationals, and
verify per-block PSD exactly via Sturm sequences on the
characteristic polynomial.  Output: a `CertifiedSdpReport` carrying
the rational dual + a per-block PSD verdict.  This is the realistic
"exact SDP-derived result" path documented in
[`docs/audits/exact-sdp-feasibility.md`](../../docs/audits/exact-sdp-feasibility.md):
the IPM cost in exact rationals doesn't scale, but rationalising
*after* the IPM is finite and the Wedderburn-block structure keeps
each per-block verification at degree $d_\lambda$, not $n_0!$.

**Architectural blocker uncovered by the smoke validation.**
`clarabel-sdp` (which we need for the IPM solve) and
`clarabel-bigrational` (which provides `tighten_to_rational` and
`RationalReal`) are **mutually exclusive feature flags**.  The
fork's CI surfaces this — `bigrational + sdp` is intentionally
unsupported.  So §S9 cannot be a single-binary in-process
verification; it must be split.

**Implementation outline:**

### S9.1 — Local Stern-Brocot rationalisation (~80 LOC)

New `src/rational_round.rs` (under `clarabel-sdp` gate or default):

```rust
pub fn tighten_f64(x: f64, q_max: u64) -> (BigInt, BigInt);
pub fn tighten_vec(xs: &[f64], q_max: u64) -> Vec<(BigInt, BigInt)>;
```

Reimplements the upstream `tighten_scalar` algorithm using
`num-bigint` (already a hecke-engine dep).  ~30 LOC of
continued-fraction expansion.  Cross-validate against
`clarabel::algebra::tighten_scalar` from the smoke bin output.

### S9.2 — `sdp_dual_certificate.rs` module (~150 LOC)

```rust
pub struct CertifiedSdpReport {
    pub n: usize,
    pub q_str: String,                    // exact-decimal q₀
    pub block_dims: Vec<usize>,
    /// Rounded dual matrices, one per Wedderburn block.
    pub rational_dual_blocks: Vec<Vec<Vec<(BigInt, BigInt)>>>,
    /// Per-block PSD verdict at rational precision.
    pub block_psd: Vec<bool>,
    /// Min eigenvalue per block as a rational lower bound.
    pub block_min_eig_lb: Vec<(BigInt, BigInt)>,
    pub all_blocks_psd: bool,
}

pub fn certify(
    report: &ClarabelSdpReport,
    q_max: u64,
) -> CertifiedSdpReport;
```

The verifier walks each PSD block returned by
`solution.dual_psd_block(idx)`, tightens entries via S9.1, then
runs a Sturm chain on the rational characteristic polynomial.

### S9.3 — Sturm-chain PSD verification (~80 LOC)

For an $n \times n$ rational symmetric matrix $M$, compute the
characteristic polynomial $\det(xI - M)$ as a polynomial in
$\mathbb{Q}[x]$, then run Sturm's theorem to count real roots in
$(-\infty, 0)$.  Zero negative roots ⇒ $M$ is PSD.

Implementation: rational arithmetic via `num-rational::BigRational`,
char-poly via Faddeev-LeVerrier (cubic in $n$, fine for
$n = d_\lambda \leq$ a few hundred).  Reuses `wedderburn_psd.rs`
infrastructure.

For larger blocks ($d_\lambda > 50$), Sturm becomes expensive;
fall back to a **certified eigenvalue-bracket** mode that proves
$\lambda_{\min} \geq -\varepsilon$ via interval arithmetic
(`num-rational` makes this exact).  This is "ball arithmetic light"
and matches what most published exact-SDP papers actually deliver
in practice.

### S9.4 — CLI: `clarabel-certify` binary (~50 LOC)

Reads a `joint-tower-sdp-{atom}.witness.json` produced by the f64
SDP solver and emits a `joint-tower-sdp-{atom}.certified.witness.json`
with the rational dual + PSD verdicts.  Required-features:
`clarabel-sdp` (the witness reading needs the SDP-cone schema).

### S9 effort (~280 LOC, 1.5–2 days)

| Step | LOC | Time |
|---|---|---|
| S9.1 — local Stern-Brocot | ~80 | 4 hr |
| S9.2 — certificate module | ~150 | 4-6 hr |
| S9.3 — Sturm-chain PSD | ~80 | 4-6 hr |
| S9.4 — CLI + witness wiring | ~50 | 2 hr |

This unlocks the genuinely new work that was originally pencilled
into §S8 — exact-rational results — but *via certificate
verification*, not via exact-rational IPM.  Doesn't pay the
factorial-extension cost; the IPM stays in f64 / MpfrFloat.

---

## Section 5 — §S4-S6 update after Phase 8b validation

Phase 8b ships `T = MpfrFloat` end-to-end (validated:
[`clarabel_phase8b_mpfr_smoke.rs`](src/bin/clarabel_phase8b_mpfr_smoke.rs)
produces a 54-character obj_val string, proving MPFR is the active
scalar through the IPM).  Implementation sketch refresh:

### S4-MPFR.  `sdp_solver_clarabel_mpfr.rs` (~350 LOC)

Direct port of `sdp_solver_clarabel.rs` with `T = MpfrFloat`
substituted throughout.  Three concrete adjustments learned from
the smoke test:

1. **Solver tolerances must be tightened** to engage MPFR's
   precision; defaults are ~1e-8 (f64-tuned).  Recommended:

   ```rust
   .tol_gap_abs(MpfrFloat::from_f64(1e-30))
   .tol_gap_rel(MpfrFloat::from_f64(1e-30))
   .tol_feas(MpfrFloat::from_f64(1e-30))
   .reduced_tol_gap_abs(MpfrFloat::from_f64(1e-15))
   .reduced_tol_gap_rel(MpfrFloat::from_f64(1e-15))
   .reduced_tol_feas(MpfrFloat::from_f64(1e-15))
   ```

   Reduced-tol fallbacks matter — without them an
   `InsufficientProgress` exit at the strict-tol level masks an
   AlmostSolved success that's still 25 dps better than f64.

2. **Vertex-optimum problems trigger central-path degeneracy** —
   exit with `InsufficientProgress` after a few iterations
   regardless of scalar precision.  H₆+ confinement SDPs aren't
   degenerate this way (they have interior optima), but the H₃
   smoke test from the existing `sdp_solver_clarabel::tests` will
   need a non-degenerate variant under MpfrFloat.

3. **`set_mpfr_default_precision(167)` at solver entry** — matches
   the QOU R5_FULL_PLAN ≥ 50 dps target and aligns with
   `seminormal_mpfr.rs`'s 167-bit working precision.

### S5-MPFR.  `sdp_solve_canonical_t_w_mpfr.rs` + `sdp_recover_canonical_mpfr.rs` (~600 LOC)

Same pattern as S4-MPFR.  Plus a key win discovered in the smoke:
the `eval_laurent_at` issue from §1 of the audit is fully
addressable now — `MpfrFloat::from_str` accepts a decimal string,
so `LaurentQ::evaluate_mpfr` can return `MpfrFloat` directly with
no rug→f64→MpfrFloat round-trip in between.

### S6-MPFR.  Cargo wiring (already done in PR #459)

`clarabel-mpfr` feature flag landed at
[`tools/hecke-engine/Cargo.toml`](Cargo.toml).
Implementation work just adds the new modules behind that flag.

---

## Status retrospective

### Upstream Clarabel.rs#1 — `claude/bigrational-backend-BeGUU`

All seven phases plus three Round 4 wishlist items have shipped
upstream and are validated against QOU's hecke-engine SDP test
suite (71/71 passing under `clarabel-sdp` at fork rev `cf7b5f4`,
re-validated at `9673209`).

| Phase | What | Status |
|---|---|---|
| Phase 1 | Decouple `FloatT` from `num_traits::Float` | **Done** (`3799405`) |
| Phase 2 | Replace `Copy` with `Clone` bounds across cones, vecmath, info, variables, etc. | **Done** (`735a35f` — 120/120 lib tests, 6/6 examples) |
| Phase 4 | `RationalReal` newtype with thread-local arena, numeric traits, Display/LowerExp/Debug | **Done** (`9b46bd5`) |
| Phase 5 | `set_max_arena_bits` opt-in inner-loop precision capping | **Done** (`a47e20e`) |
| Phase 6 | CI bigrational job; QP and SOCP regression tests passing | **Done** (`45c259c`) |
| Phase 7 | Docs / README / CHANGELOG | **Done** (`63c3020`) |
| Phase 8a | Per-iteration `iter_diagnostics` log on `DefaultInfo` | **Done** (`eab6a34`) |
| Phase 8b | Run-time `MpfrFloat` backend; `lp_mpfr` example + CI | **Done** (`67eafd0`, `ee0b273`) |
| Wishlist #1 | `BlockDiagPSDConeT { block_dims }` cone sugar | **Done** (`7d3ff18`) |
| Wishlist #2 | Structured `Solution<T>` per-cone accessors (`dual_psd_block`, `primal_psd_block`, `primal_residual_per_block`) | **Done** (`b722064`) |
| Wishlist #3 | `tighten_to_rational(solution, denom_bound)` Peyrl–Parrilo helper | **Done** (`9673209`) |
| Wishlist (earlier) | Solution<T> serde derive, rug-interop, exact-mode tolerance docs | **Done** (`a435b2c`, `d245be4`) |

Out of scope upstream (explicitly deferred to Phase 9+):

- **Exact-rational SDP** (PSD cone projection on rationals) — needs
  eigendecomposition over algebraic numbers; the IPM iterate
  extension-degree blow-up makes it intractable past the smallest
  blocks.  See `docs/audits/exact-sdp-feasibility.md` for the
  Galois / Sturm / cost analysis.  QOU's §T5 routes around this
  via the §S9 dual-certificate path instead.
- **Sentinel propagation through arithmetic** — `inf + 1 → finite`
  by design; doesn't bite LP/QP/SOCP regression tests.
- **Per-iteration denom-bit log on iterates** (vs. per-iter on
  primal `x` only) — solver instrumentation; nice-to-have.

### QOU side — what's landed (PRs #448 + #459)

| PR | Commits | Scope |
|---|---|---|
| #448 | 24 | Workplan §1–§T5; substrate-precision audit (100 files); 65 witnesses regenerated; canonical-timestamp migration; first fork pin (`cf7b5f4`) |
| #459 | 4 + counting | Fork pin bump to `9673209` (Round 4 + Phase 8a/8b); 3 smoke-test bins validating all 5 new APIs end-to-end; §S9 + §S4-S6 implementation outlines |

Substrate-precision audit headline (PR #448): the antipattern
`Q0 = mp.mpf(str(Q0_FLOAT))` appeared in **100 files** under
`folio-assistant/computations/`, each silently capping its "50-dps"
computation at f64 precision.  Plus the canonical 38-dps `Vol(4_1)`
string was actually inaccurate past digit ~30.  After this work,
every file uses `Q0 = Q_MP` / `vol_4_1_at(dps)` from `q_parameter`,
so substrate values are genuinely 50 dps.

Smoke validation results (PR #459):

| Smoke bin | Features | Validates | Status |
|---|---|---|---|
| `clarabel-round4-sdp-smoke` | `clarabel-sdp` | Wishlist #1 + #2 (BlockDiagPSDConeT, dual_psd_block) | All tests pass |
| `clarabel-round4-rational-smoke` | `clarabel-bigrational` | Wishlist #3 + Phase 8a (tighten_scalar, iter_diagnostics) | All tests pass |
| `clarabel-phase8b-mpfr-smoke` | `clarabel-mpfr` | Phase 8b (T = MpfrFloat end-to-end) | All tests pass |

Two architectural realities surfaced by the smoke validation:

1. **`clarabel-sdp` and `clarabel-bigrational` are mutually
   exclusive feature flags** — `bigrational + sdp` is intentionally
   unsupported upstream.  §S9 must be split: f64 / MpfrFloat IPM
   in one binary, then post-process via local Stern-Brocot
   rationalisation in the same binary (avoiding the feature mutex).
2. **`MpfrFloat` solver tolerances must be tightened** to engage
   MPFR precision (defaults are f64-tuned ~1e-8).  Recommended
   `tol_gap_abs/rel = 1e-30`, `tol_feas = 1e-30`,
   `reduced_tol_* = 1e-15`.  Vertex-optimum LPs hit central-path
   degeneracy regardless; H_n confinement problems are interior
   and unaffected.

### Workplan items still pending (after PR #459 merges)

- **§S1–§S3** (~350 LOC) — `seminormal_matrices_mpfr` (port the
  existing character-only MPFR machinery to materialise generator
  matrices), generic `dense_la` helpers, generic `svec_pack`.
  Independent of upstream; can land as a non-breaking refactor.
- **§S4-MPFR / §S5-MPFR** (~950 LOC) — port `sdp_solver_clarabel.rs`
  / `sdp_solve_canonical_t_w.rs` / `sdp_recover_canonical.rs` to
  `T = MpfrFloat` siblings under `clarabel-mpfr`.  Smoke
  validation cleared the path.
- **§S7** (~250 LOC) — consumer-side `PrecisionScalar` schema,
  Zod schema, Python mpmath consumer.  Independent of upstream
  status.
- **§S8** (~150 LOC) — exact-rational LP/QP diagnostic at small n
  via `T = RationalReal`.  SDP path scoped out of §S8 per the
  exact-SDP-feasibility audit.
- **§S9** (~280 LOC) — dual-certificate verification: local
  Stern-Brocot tightening + Sturm-chain PSD verification on
  rationalised dual blocks.  Architectural blocker resolved by
  splitting the IPM solve from the certificate verification.
- **§T1–T5** — test plan.  Implements once §S4–S6 land.

Both §S9 and §S4–S6 deserve focused implementation PRs after
#459 merges.  §S1–S3 and §S7 can land in parallel since they're
upstream-independent.

---

## Cross-references

- [`prop:joint-tower-sdp-confinement`](../../content/quantum-observable-universe/braids-and-knots/joint-tower-sdp-confinement.md) — design spec
- [`prop:atom-knot-mass-derivation`](../../content/quantum-observable-universe/braids-and-knots/atom-knot-mass-derivation.md) — consumer
- [`R5_FULL_PLAN.md`](R5_FULL_PLAN.md) — phase R5.6/R5.7 unblocked by this
- [`R5_5_BUG_REPORT.md`](R5_5_BUG_REPORT.md) — svec post-mortem (resolved at f64; high-prec validates)
- [`RUST_INTEGRATION.md`](RUST_INTEGRATION.md) — parent integration plan
- [`seminormal_mpfr.rs`](src/seminormal_mpfr.rs) — existing MPFR character path
- [Clarabel.rs](https://clarabel.org/stable/rust/) — solver
