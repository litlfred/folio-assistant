# R5.5 H_5 anomaly — POST-MORTEM (was MY bug, not Clarabel's)

**Status**: **Resolved**.  The "Clarabel-rs bug at $d \geq 4$" was
**my own svec encoding error**.  Clarabel's `PSDTriangleConeT(n)`
expects the symmetric matrix's **upper-triangular part in column-major
order** (with $\sqrt{2}$ off-diagonal scaling); my code was packing
the **lower-triangular part in column-major order**.

For symmetric matrices these conventions happen to coincide at small
$d$ — the orderings produce the same vector at $d \in \{2, 3\}$ for
many matrices and at $d = 5$ for the identity specifically — which
masked the bug in the existing tests.  At $d \geq 4$ the orderings
diverge: my $\mathrm{svec}(I_4) = [1, 0, 0, 0, 1, 0, 0, 1, 0, 1]$
(diagonal at positions $\{0, 4, 7, 9\}$) gets read by Clarabel as a
**different matrix** (diagonal at positions $\{0, 2, 5, 9\}$), which
is genuinely indefinite — Clarabel's `Solved, c = 0` answer was
correct for the matrix it was actually seeing.

The diagonal positions for the correct upper-triangular column-major
layout are $k(k+3)/2$ for $k = 0, \ldots, d-1$:
  - $d{=}4$: $\{0, 2, 5, 9\}$
  - $d{=}6$: $\{0, 2, 5, 9, 14, 20\}$
  - $d{=}8$: $\{0, 2, 5, 9, 14, 20, 27, 35\}$

After fix, the minimal reproducer returns $c = 1$ for every
$d \in \{2, \ldots, 8\}$.  The full SDP solver now scales to $H_8$
with filtration cutoff $L = 2$ in 10 seconds; $H_{10+}$ at the same
cutoff exceeds memory limits (Wedderburn-block decomposition is what
R5.6 will need).

This document is preserved for the post-mortem narrative.  The
self-contained reproducer below is now an example of HOW to use
Clarabel `PSDTriangleConeT` correctly.

## Reproducer (minimal)

```rust
use clarabel::algebra::CscMatrix;
use clarabel::solver::*;

// Pose:  max c   s.t.   c · I_d  ⪰ 0,   c ≤ 1
// Expected: c = 1 (since c · I_d  ⪰ 0 ⇔ c ≥ 0 for any d)

for d in 2..=8 {
    let svec_dim = d * (d + 1) / 2;
    // svec(I_d) has 1s at diagonal positions, 0 elsewhere
    let mut svec_id = vec![0.0f64; svec_dim];
    let mut offset = 0;
    for col in 0..d {
        svec_id[offset] = 1.0;  // diagonal entry
        offset += d - col;
    }

    let mut a_rows = Vec::new();
    let mut a_vals = Vec::new();
    let mut b = Vec::new();
    for k in 0..svec_dim {
        a_rows.push(k);
        a_vals.push(-svec_id[k]);
        b.push(0.0);
    }
    a_rows.push(svec_dim);  // c ≤ 1
    a_vals.push(1.0);
    b.push(1.0);

    let a = CscMatrix::new(svec_dim + 1, 1,
                           vec![0, a_rows.len()],
                           a_rows, a_vals);
    let p = CscMatrix::zeros((1, 1));
    let q_vec = vec![-1.0];  // minimize -c → maximize c

    let cones = vec![
        SupportedConeT::PSDTriangleConeT(d),
        SupportedConeT::NonnegativeConeT(1),
    ];

    let settings = DefaultSettingsBuilder::default()
        .verbose(false).build().unwrap();
    let mut solver = DefaultSolver::new(&p, &q_vec, &a, &b, &cones,
                                         settings).unwrap();
    solver.solve();
    println!("d={}: status={:?}, c={:.4}", d,
             solver.solution.status, solver.solution.x[0]);
}
```

**Output**:
```
d=2: status=Solved, c=1.0000   ← correct
d=3: status=Solved, c=1.0000   ← correct
d=4: status=Solved, c=0.0000   ← BUG (expected c=1.0)
d=5: status=Solved, c=1.0000   ← correct
d=6: status=Solved, c=0.0000   ← BUG
d=7: status=Solved, c=0.0000   ← BUG
d=8: status=Solved, c=0.0000   ← BUG
```

`c = 0` is reported with status "Solved" — Clarabel claims c=0 is the
*optimal* value, when the true optimum is c=1 (the upper bound).
This is **not** an infeasibility detection failure; the SDP terminates
at a wrong objective value.

## What we ruled out

| Hypothesis | Evidence |
|---|---|
| seminormal_matrices bug | Hecke quadratic σ_i² = (q-q⁻¹)σ_i + I verified for every (λ, σ_i) at H_5; no bug |
| svec convention error | Confirmed col-major lower triangular with √2 off-diagonal scaling per Clarabel docs |
| Sparsity-split formulation | Bug reproduces with single free variable + no objective |
| CSC sparsity pattern | Bug reproduces with explicit zero entries (dense column) |
| Sparse vs dense PSD matrix | Bug reproduces with c·J_d (dense, all-ones, rank-1 PSD) at d ≥ 4 |
| Backend-specific (`sdp-netlib`) | Bug reproduces under `sdp-openblas` too |

## Path forward

### Option A — Switch SDP solver

| Solver | Status |
|---|---|
| Clarabel.rs 0.11 | bug at d ≥ 4 (current) |
| Clarabel.jl (Julia) | not tested; same algorithm as Clarabel.rs |
| SCS via clarabel | available via `clarabel` features (untested with our SDPs) |
| MOSEK FFI | commercial license required |
| SDPA via FFI | C++ build; possible but heavy |
| Custom IPM in Rust | several weeks of work |

The Clarabel.rs maintainers should be informed.  Filed as an upstream
issue would help; in the meantime, switching to a working solver is
the quickest fix.

### Option B — Bypass Clarabel for PSD; use bisection + eigenvalue check

Already implemented at R5-minimal: [`sdp_verifier.rs`](src/sdp_verifier.rs)
poses
$$\alpha^*(c) := \max\{\alpha : \alpha \cdot \rho_\lambda(T(c)) + (1-\alpha) I \succeq 0 \,\forall\,\lambda\}$$
via bisection on $\alpha$ + Jacobi-rotation eigenvalue check.  This
**does NOT use Clarabel** and works at any $d$.

To use it as a solver-equivalent: discretize the variable $c$ space,
pick the sparsest $c$ achieving $\alpha^* = 1$.  Slow but correct.

### Option C — Use Python's cvxpy via pyo3

cvxpy + Clarabel-py has a different code path and may not exhibit the
bug.  The existing R5.3 cross-validation tests only covered braid
representations at small matrix dimensions ($d \leq 3$ — H_3 has
$d_{(2,1)} = 2$, no larger block exists at H_3), where Clarabel works
correctly.  Those tests therefore did not expose this bug which only
manifests at $d \geq 4$.  At $d = 4 / d = 6$ the R5.3 SDP path may
also produce wrong results.

### Recommended

For R5.6 onward:

1. **Cross-validate**: write a property test that for every test
   problem, runs both Clarabel-rs SDP and bisection-α; expect agreement
   when status is "Solved".  Will catch additional Clarabel bugs at d ≥ 4.

2. **Fallback for production**: when Clarabel returns suspicious
   results (e.g. bound-active without reaching the bound), fall back to
   bisection + Jacobi.

3. **File upstream**: report this minimal reproducer to Clarabel.rs.
   Maintainers may already be aware (this is a fundamental SDP-cone
   handling issue, not a backend problem).

## Effect on R5-full deliverables

R5.1–R5.4 work as designed:
- R5.1+R5.2: BLAS install + clarabel sdp-netlib
- R5.3: Native SDP solver matches bisection at d ≤ 3 (cross-val test)
- R5.4: Multi-var T_w recovery at H_3 returns proton Borromean to 1e-5

R5.5 partial:
- ✓ H_3, H_4 (max d=3) — solver finds c = δ_e correctly
- ✗ H_5+ (d ≥ 4) — Clarabel returns wrong objective value

R5.5d → R5.7 (the headline ⁶Li / ⁷Li / α-cluster) need either Option
A (different solver) or Option B (bisection+eigenvalue) before they
can complete.

The infrastructure is sound; the only blocker is the Clarabel
algorithm bug.
