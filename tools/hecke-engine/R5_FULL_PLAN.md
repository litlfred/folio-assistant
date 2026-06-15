# R5-full plan — joint-tower SDP solver for unknown $T_w$

This branch implements the final phase of the production-scaling
roadmap from
[`RUST_INTEGRATION.md`](RUST_INTEGRATION.md): an actual
**SDP-as-solver** that produces canonical $T_w \in H_{n_0}(q_0)$ for
atoms whose Hecke element is **not** known a priori — concretely
⁶Li ($H_{18}$), ⁷Li ($H_{21}$), and the α-cluster atoms ⁸Be → ⁴⁰Ca
($H_{24}$ → $H_{120}$).

R5-full lands the principled replacement for the deprecated
`li-atom-knot-search.witness.json`.  Once it succeeds the
volume-match search is fully retirable.

## Branch context

- Branched from: `origin/main` after PR #433 (R1–R5min) lands.
- Inherits from PR #433: certificate format, GB-NF reducer, Wedderburn
  PSD evaluator, cross-level embedding LR, PSD-cone $\alpha^*$ verifier
  (bisection, no system BLAS).
- Adds: actual SDP solver (Clarabel.rs + system BLAS), unknown-$T_w$
  variable formulation, atlas integration that retires the deprecated
  Li search.

## SDP formulation

Per atom $\mathfrak{H}$ with strand count $n_0$:

```
variables:
  c_w(q_0) ∈ ℝ  for w ∈ S_{n_0} with ℓ(w) ≤ L  (filtration cutoff)

minimize:
  ‖c‖_1                               (sparsest feasible solution)

subject to:
  ρ_λ(T_w(c)) ⪰ 0     ∀ λ ⊢ n_0       (Wedderburn-block PSD)
  π_{𝔥 → 𝔥'}(T_w(𝔥)) = T_w(𝔥')        (cross-level consistency)
  c · m_e · ρ ≈ B_AME ± δ              (AME anchor, δ small)
```

Where $T_w(c) := \sum_{w} c_w \cdot T_w$ is the Hecke element built
from variables.

## Implementation phases

| Phase | Scope | Effort | Status |
|---|---|---|---|
| R5.1 | System BLAS install (openblas / netlib + gfortran) | a few hours | **done** |
| R5.2 | `clarabel = "0.11"` with `sdp` feature in `Cargo.toml`; minimal SDP smoke test | 1-2 hr | **done** |
| R5.3 | Port `sdp_verifier.rs` bisection to a true Clarabel SDP call (single block, identity), confirm same $\alpha^*$ output | 2-3 hr | **done** (works at $d \leq 3$; cross-validated) |
| R5.4 | Pose the **proton known-$T_w$ recovery test**: variables $c_w$ for $w \in S_3$; constraint set the SDP that should recover $c$ matching the Borromean reduction | 4-6 hr | **done** ($\leq 10^{-5}$ residual at $H_3$) |
| R5.5 | Pose the **⁶Li solver** at $H_{18}$ with filtration cutoff $L = 8$ | 1-2 days | **base infra done; H_3..H_8 work**.  H_18 needs Wedderburn-block decomposition (memory-bounded, not a correctness issue).  See [R5_5_BUG_REPORT.md](R5_5_BUG_REPORT.md) for the post-mortem on the original svec-encoding bug. |
| R5.6 | Wedderburn-block decomposition: solve per-block PSD constraints in parallel, couple via linear constraints.  Required for H_18 (⁶Li) and beyond. | 2-3 days | next research item |
| R5.7 | ⁶Li at $H_{18}$ + ⁷Li at $H_{21}$ with AME anchor | 1-2 days | depends on R5.6 |
| R5.8 | Update `methodology-deprecation.witness.json` to move ⁶Li/⁷Li from `deprecated-volume-match` to `principled-derivation`; update atlas renderer to consume the new witnesses; retire `li_atom_knot_search.py` | 2-3 hr | depends on R5.7 |

Total estimated remaining: 4-6 working days. **No solver-side blocker any more** — Clarabel.rs works correctly when fed the right svec convention.

## Validation strategy

Each phase emits a witness JSON.  Per-atom output is bit-for-bit
compared against:
- R3 Wedderburn-PSD evaluator (per-block PSD must hold for the SDP solution)
- R4 cross-level multi-LR identity (must hold after substitution)
- mass-table-ppb anchor at q_0 (B_pred should match AME for ⁶Li/⁷Li
  via the anchor constraint)

For ⁶Li/⁷Li, three signals indicate success:
1. SDP returns feasible $c$ with sparse support.
2. The Markov closure of the resulting braid has SnapPy
   `high_precision()` volume that matches the volume conjecture
   asymptotic (post-Archimedean naming check).
3. The recovered knot may or may not equal $K_{11a259}$ /
   $L_{11a62}$.  If yes, the volume-match was structurally
   correct; if no, the volume-match was a coincidence (which is
   the genuine open question).

## Risks

1. **Variable count blow-up**: $|S_{18}|$ has $18! \approx 6.4 \times 10^{15}$
   elements.  Filtration cutoff $L = 8$ reduces to
   $\binom{18}{8} \cdot \text{(jet-order-paths)} \approx 10^5$ — at the
   edge of single-machine SDP solvers.  Decomposition by Wedderburn
   block is essential.
2. **No unique solution**: $\ell_1$-minimization may have multiple
   minimizers; need to ensure the SDP returns a *canonical* one.
   Adding the GB-filtration sparsity pattern as a hard constraint
   instead of soft regularizer fixes this.
3. **q_0 numerical sensitivity**: $q_0 \approx 1.1097$ is not
   special — small perturbations can flip PSD signatures.  Use
   MPFR with $\geq 50$ digits and re-validate.

## References

- [`prop:joint-tower-sdp-confinement`](../../content/quantum-observable-universe/braids-and-knots/joint-tower-sdp-confinement.md) — design spec.
- [`prop:atom-knot-mass-derivation`](../../content/quantum-observable-universe/braids-and-knots/atom-knot-mass-derivation.md) — consumer of the certificate.
- [PR #433](https://github.com/litlfred/qou/pull/433) — R1–R5min that this branch builds on.
- `RUST_INTEGRATION.md` — the parent integration plan.
- `tools/hecke-engine/src/sdp_verifier.rs` — the bisection-based
  verifier this branch upgrades to a real SDP solver.
- [Clarabel.rs](https://clarabel.org/stable/rust/) docs.
