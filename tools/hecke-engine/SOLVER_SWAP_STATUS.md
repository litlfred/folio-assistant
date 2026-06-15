# Solver swap status — Clarabel-rs feature-gating

**Commit landing this status.** This document tracks what is and is
not swap-clean after `solver-swap: feature-gate clarabel-sdp behind
opt-in feature` (commit
[`6f083a1`](https://github.com/litlfred/qou/commit/6f083a1)).

## Build matrix

| Build command | Pulls Clarabel-rs? | Pulls OpenBLAS / LAPACK / gfortran? | Status |
|---|---|---|---|
| `cargo build --release --lib` | no | no | clean (~2m fresh, ~12s warm) |
| `cargo build --release --bin joint-tower-sdp` | no | no | clean |
| `cargo build --release --bin hecke-engine` | no | no | clean |
| `cargo build --release` (all bins) | no | no | clean (R5.5 diagnostic bins are gated via `required-features`) |
| `cargo build --release --features clarabel-sdp --lib` | yes | yes (system) | requires cmake + system BLAS toolchain |
| `cargo build --release --features clarabel-sdp` (all bins) | yes | yes (system) | re-enables R5.5 + R5.4 + R5-full SDP-as-solver path |

The default profile is the production deployment target. The
opt-in profile is for solver-research work and is expected to
require the system toolchain (matching the original PR #444 setup).

## Module gating

| Module | Default feature | clarabel-sdp feature |
|---|---|---|
| `certificate` | yes | yes |
| `cross_level_embedding` | yes | yes |
| `gb_nf_reducer` | yes | yes |
| `geck_pfeiffer` | yes | yes |
| `gram` | yes | yes |
| `joint_tower_sdp_certificate` | yes | yes |
| `laurent_poly_q` | yes | yes |
| `littlewood_richardson` | yes | yes |
| `seminormal` | yes | yes |
| `seminormal_mn` | yes | yes |
| `seminormal_mpfr` | yes | yes |
| `wedderburn_psd` | yes | yes |
| `sdp_verifier` (bisection α\* — works at any d, no BLAS) | yes | yes |
| `sdp_solver_clarabel` (R5.1–R5.3 minimal Clarabel wrapper) | **no** | yes |
| `sdp_solve_canonical_t_w` (R5-full SDP-as-solver) | **no** | yes |
| `sdp_recover_canonical` (R5.4 known-T\_w recovery test) | **no** | yes |

## Binary gating

| Binary | Default feature | clarabel-sdp feature |
|---|---|---|
| `joint-tower-sdp` (R1+R2+R6 production emitter) | yes | yes |
| `hecke-engine` (v8 symbolic engine) | yes | yes |
| `hecke-mass`, `hecke-atomic`, `hecke-allparts`, etc. | yes | yes |
| `r5-5-scale-test` | **no** | yes (`required-features`) |
| `r5-5-diagnose-h5` | **no** | yes (`required-features`) |
| `r5-5-minimal-h5` | **no** | yes (`required-features`) |

## What still needs a real solver swap

The bisection-based α\* verifier (`sdp_verifier`) computes the
*PSD-cone gap* for a *given* candidate `T_w`. It does **not**
recover the c\_w coefficient vector when `T_w` is unknown — that
is the SDP-as-solver problem (R5-full). For unknown-`T_w`
recovery (⁶Li at H₁₈, ⁷Li at H₂₁, α-cluster atoms ⁸Be → ⁴⁰Ca up
to H₁₂₀), the choices are:

1. **cvxpy / SDPA / Mosek subprocess bridge.** Rust serializes
   the SDP problem to JSON, spawns a Python (or native) solver,
   reads back the c\_w vector. Slow per call but unblocks H₅+ today
   without re-introducing a Cargo dep on Clarabel's BLAS chain.
   Stub design: a `Backend` trait in
   `tools/hecke-engine/src/sdp_backend.rs` with two impls —
   `BisectionAlphaStarBackend` (default) and
   `CvxpySubprocessBackend` (opt-in via env var or config).
2. **Pure Rust SDPA-rs (or similar maintained crate).** Investigate.
3. **Custom Rust IPM.** Research effort; defer.

Until one of (1)–(3) lands, the production binary `joint-tower-sdp`
emits certificates that quantify the PSD gap (α\*) but do not
recover the c\_w solution for unknown `T_w`. The mass-table-ppb
witness pipeline still produces `B_pred` for known-`T_w` atoms via
the existing symbolic Markov-trace path
([`y_lambda_mpfr_witness.py`](../../folio-assistant/computations/y_lambda_mpfr_witness.py),
[`q_mn_recursive_memoized.py`](../../folio-assistant/computations/q_mn_recursive_memoized.py)).

## Smoke-test recipe

After any change touching the SDP path:

```bash
# Default-feature build must be BLAS-free and produce both prod binaries.
cargo build --release --lib
cargo build --release --bin joint-tower-sdp
cargo build --release --bin hecke-engine

# Opt-in build is allowed to fail without system BLAS.  When BLAS
# is available, all binaries (including R5.5 diagnostics) must build.
cargo build --release --features clarabel-sdp --bin r5-5-scale-test || true
```

CI should run the first three commands as a hard gate; the opt-in
build can be a separate non-blocking job.

## See also

- Plan G — vol-shortcut retirement: replaces the SnapPy `Vol_hyp(K)`
  shortcut for ²H/³H/³He/electron with symbolic `tr_M(T_w)`. That work
  needs the full Markov-trace path (already swap-clean) and does
  **not** require an SDP solver.
- Plan F — MPFR precision lift: orthogonal to solver choice; lifts
  the entire pipeline from f64 to mpmath / `rug::Float` @ 50 dps.
- Plan H — ρ(Z, N) from Wedderburn multiplicity: blocked on R5-full
  SDP-as-solver, which is blocked on (1)/(2)/(3) above.
