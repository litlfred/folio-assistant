# Rust integration plan — joint-tower SDP certificate emitter

Production-scale solver for [`prop:joint-tower-sdp-confinement`](../../content/quantum-observable-universe/braids-and-knots/joint-tower-sdp-confinement.md)
at H_18 (⁶Li), H_21 (⁷Li), and the α-cluster scale H_24 → H_120
(⁸Be → ⁴⁰Ca).

The Python reference implementation in
[`folio-assistant/computations/joint_tower_sdp_solver.py`](../../folio-assistant/computations/joint_tower_sdp_solver.py)
+ [`joint_tower_sdp_solver_v2.py`](../../folio-assistant/computations/joint_tower_sdp_solver_v2.py)
is enough for Phase 3a/3b (H_3 ground truth + H_3 historical entries
6_2, L6a4 with cvxpy) but does **not** scale.  The Rust extension takes
over from Phase 3c onward.

## What's already in place

### Existing Rust modules (4779 LOC across 10 source files)

| Module | LOC | Purpose | Reuse for joint-tower SDP |
|---|---|---|---|
| `certificate.rs` | 128 | Per-isotope JSON certificate (Laurent poly summary) | **REPLACE** with joint-tower-SDP cert format |
| `seminormal.rs` | 444 | Hoefsmit seminormal matrices σ_i for any λ ⊢ n; χ_λ(β) | **REUSE** as Wedderburn-block evaluator |
| `seminormal_mn.rs` | 906 | q-Murnaghan-Nakayama recursion for χ_λ | **REUSE** as alternate χ_λ implementation |
| `seminormal_mpfr.rs` | 260 | MPFR high-precision wrapper | **REUSE** for ≥50-dps eval at q_0 |
| `gram.rs` | 737 | Gram matrix at H_3 | reference for higher-n extension |
| `geck_pfeiffer.rs` | 701 | Geck-Pfeiffer character algorithm | alternate path for χ_λ |
| `littlewood_richardson.rs` | 277 | LR coefficients | for tower-edge embedding multiplicities |
| `laurent_poly_q.rs` | 337 | Symbolic q polynomials (BigInt coeffs) | **REUSE** for ℚ(q) coefficients |

### Existing binaries (18 total in `src/bin/`)

`v6.rs … v19_nuclear_mass.rs` — sequential generations of the engine.
`v19_nuclear_mass.rs` is the latest; reads atom registry, runs Gröbner
reduction, emits per-isotope certificate.

### Existing per-isotope certificates

`certificate-{1h, 2h, 3h, 3he, 4he, 6li, 7li, 11li, 8be, 10be, 11be, 12c, 13c, 14c, 14n, 16o, 19f, 20ne, ...}.json`
— already produced for ¹H through ²⁰Ne (and beyond).

## Gap analysis (existing certificate vs design spec)

### What existing `certificate.rs` emits (per isotope)

```json
{
  "isotope": {"a": 7, "n": 4, "z": 3, "symbol": "li", "name": "7Li"},
  "engine": {"name": "hecke-modular", "version": "0.11.0"},
  "elapsed_seconds": 0.005740499,
  "f_pauli_f64": 8.630603311363078,
  "l1_norm_f64": 0.035506262013014996,
  "net_f64": 0.1691307668541459,
  "tr_alt_f64": -1.4597005564647685
}
```

— a per-isotope **scalar summary** (4 floats: `f_pauli`, `l1_norm`,
`net`, `tr_alt`).  Useful but not the structured certificate the
joint-tower SDP needs.

### What the design spec needs (per isotope)

```json
{
  "name": "7Li",
  "n_0": 21,
  "filtration_certificate": {
    "<grade>": [
      {"perm": [...], "canonical_word": [...], "coefficient_in_q": "..." }
    ],
    ...
  },
  "filtration_shape": {"<grade>": <count>, ...},
  "max_grade": <int>,
  "jet_log": [
    {"step": ..., "multiplier": ..., "predecessor": [...],
     "successor": [...], "filtration_before": ..., "filtration_after": ...,
     "relation": "ascending|hecke-quadratic"},
    ...
  ],
  "wedderburn_block_psd_at_q_0": {
    "<lambda>": {"min_eigenvalue": ..., "psd": true|false, ...},
    ...
  },
  "cross_level_edges": [
    {"parent": "...", "constituents": [...], "embedding_consistent": ...},
    ...
  ],
  "rho_factor": <int>,
  "B_pred_MeV": <float>,
  "B_AME_MeV": <float>,
  "err_ppb": <int>,
  "methodology": "principled-derivation"
}
```

— per-grade GB-filtration + jet-order log + Wedderburn-block PSD
diagnostics + cross-level consistency.

## Implementation plan (Rust extension)

### Phase R1 — Certificate format extension

Add `src/joint_tower_sdp_certificate.rs` (new module, ~300 LOC):

```rust
pub struct JointTowerSdpCertificate {
    pub name: String,
    pub atomic_n_0: usize,
    pub native_strand_count: usize,
    pub braid_word: Vec<i32>,
    pub filtration_certificate: BTreeMap<usize, Vec<FiltrationTerm>>,
    pub filtration_shape: BTreeMap<usize, usize>,
    pub max_grade: usize,
    pub jet_log: Vec<JetEvent>,
    pub wedderburn_blocks: BTreeMap<String, WedderburnBlockReport>,
    pub cross_level_edges: Vec<CrossLevelEdge>,
    pub rho_factor: u32,
    pub b_pred_mev: f64,
    pub b_ame_mev: f64,
    pub err_ppb: i64,
    pub methodology: Methodology,
}

pub struct FiltrationTerm {
    pub perm: Vec<usize>,
    pub canonical_word: Vec<u32>,
    pub coefficient_in_q: SparsePoly,   // reuse existing Laurent poly
}

pub struct JetEvent {
    pub step: u64,
    pub multiplier: i32,
    pub predecessor: Vec<usize>,
    pub successor: Vec<usize>,
    pub filtration_before: usize,
    pub filtration_after: usize,
    pub relation: JetRelation,
}

pub enum JetRelation {
    Ascending,
    HeckeQuadratic,
}

pub struct WedderburnBlockReport {
    pub partition: Vec<usize>,
    pub d_lambda: usize,
    pub matrix_at_q_0_sym_eigvals: Vec<f64>,
    pub min_eigenvalue: f64,
    pub psd_symmetric_part: bool,
}

pub struct CrossLevelEdge {
    pub parent: String,
    pub constituent: String,
    pub embedding_codomain_n_0: usize,
    pub embedding_domain_n_0: usize,
    pub embedding_consistent: bool,
}
```

This preserves the existing `SparsePoly` + Laurent-poly infrastructure
and adds the joint-tower-SDP layer on top.

### Phase R2 — GB-NF reducer (port of Python PoC)

Add `src/gb_nf_reducer.rs` (~250 LOC).  This is the Rust port of
[`gb_filtration_jet_tracker.py`](../../folio-assistant/computations/gb_filtration_jet_tracker.py)
— the proof-of-concept locked the algorithm; this reimplements it in
Rust at production scale.

Key types:
- `HeckeElement<Q>` parameterized by `Q: Coefficient` (Laurent poly,
  MPFR float, or rational).
- `right_mul_t(i)`, `right_mul_t_inv(i)` matching the Python API.
- `reduce_braid(word) -> JointTowerSdpCertificate`.

### Phase R3 — Wedderburn-block PSD evaluator

Add `src/wedderburn_psd.rs` (~150 LOC).

For each partition λ ⊢ n_0, use existing `seminormal::seminormal_matrices`
to build the seminormal matrices ρ_λ(σ_i), then compose to get
ρ_λ(T_w).  Symmetrize and call `nalgebra::SymmetricEigen` (or
`ndarray-linalg`) to get eigenvalues.  Emit per-block PSD diagnostic.

### Phase R4 — Cross-level embeddings

Add `src/cross_level_embedding.rs` (~200 LOC).

For each tower edge `parent ← Σ_i constituents`, construct the
canonical embedding π : ⊗_i H_{n_i}(q_0) ↪ H_{n_parent}(q_0) and
verify the per-grade coefficients of `T_w(parent)` match the
embedded coefficients of `⊗_i T_w(constituent_i)`.

This uses Littlewood-Richardson coefficients (already implemented in
`littlewood_richardson.rs`) for the multiplicities.

### Phase R5 — SDP-as-SOLVER (for ⁶Li, ⁷Li, α-cluster)

Add `src/sdp_solver.rs` (~400 LOC) + dependency on a Rust SDP solver.

**Solver options**:

1. **`good_lp` + `clarabel`** — pure-Rust SDP via the Clarabel solver
   (which we already use via cvxpy in Python).  Native Rust binding
   exists.
2. **FFI to SCS or MOSEK** — production-grade but adds C dependency.
3. **Hand-rolled spectral-bundle method** — no external solver, but
   significant implementation effort.

Recommendation: **Clarabel-rs** (option 1).  Same solver as the Python
prototype; pure Rust; tested for SDP feasibility at the relevant scale.

For unknown canonical T_w (⁶Li, ⁷Li):
- Variables: `c_w(q_0) ∈ ℝ` for `w ∈ S_{n_0}` with filtration cutoff
  L (initially L = 6 for ⁶Li, scale up if infeasible).
- Constraints:
  (1) Wedderburn-block PSD: `ρ_λ(T_w) ⪰ 0` for all `λ ⊢ n_0` (built
      via `seminormal_matrices` then assembled into block-diagonal).
  (2) GB-filtration grading: `c_w = 0` if `ℓ(w) > L`.
  (3) Jet-order indexing: variables ordered by an admissible jet
      sequence (single iteration; refinement at outer loop).
  (4) Cross-level consistency: linear constraints from
      `cross_level_embedding`.
- Objective: minimize an L1 penalty on `|c_w|` to find the *sparsest*
  feasible solution (Wedderburn-block-multiplicity argument).

### Phase R6 — Binary entry point + atlas integration

Add `src/bin/joint_tower_sdp.rs` (~150 LOC).

Reads atom registry from `confined-particle.md`, runs the full pipeline
per atom, emits one JSON per atom into
`folio-assistant/computations/joint-tower-sdp-{atom}.witness.json` —
matching the Python reference implementation's output schema.

The atlas renderer (`recursive_atom_knot_atlas_render.py`) will then
auto-detect these witnesses and pull from them in preference to
`mass-table-ppb.witness.json` for atoms where the principled
derivation is available.

### Phase R7 — Wire into staleness tracker + build

Update [`witness_staleness_tracker.py`](../../folio-assistant/computations/witness_staleness_tracker.py):

```python
"joint-tower-sdp-rust": [
    "../../tools/hecke-engine/src/joint_tower_sdp_certificate.rs",
    "../../tools/hecke-engine/src/gb_nf_reducer.rs",
    "../../tools/hecke-engine/src/wedderburn_psd.rs",
    "../../tools/hecke-engine/src/cross_level_embedding.rs",
    "../../tools/hecke-engine/src/sdp_solver.rs",
    "../../tools/hecke-engine/src/bin/joint_tower_sdp.rs",
    # Plus all upstream Rust modules that haven't changed
    "../../tools/hecke-engine/src/seminormal.rs",
    "../../tools/hecke-engine/src/laurent_poly_q.rs",
    # Atom registry
    "../../content/quantum-observable-universe/braids-and-knots/confined-particle.md",
],
```

Then `cargo build --release --bin joint_tower_sdp` becomes a
build-pipeline step; outputs are picked up by the atlas renderer.

## Estimated effort

| Phase | LOC | Complexity | Time |
|---|---|---|---|
| R1 — cert format | ~300 | mechanical (struct definitions + serde) | 2-4 hr |
| R2 — GB-NF reducer | ~250 | direct port from Python PoC | 4-6 hr |
| R3 — Wedderburn PSD | ~150 | uses existing `seminormal::` | 2-3 hr |
| R4 — cross-level embedding | ~200 | uses existing `littlewood_richardson::` | 4-6 hr |
| R5 — SDP solver | ~400 | needs `clarabel-rs` integration | 1-2 days |
| R6 — binary | ~150 | wires R1–R5 + atom registry parsing | 2-3 hr |
| R7 — staleness wiring | ~50 | Python edit | 30 min |
| **Total** | **~1500 LOC Rust + small Python** | | **2-3 working days** |

The bottleneck is R5 (SDP-as-solver).  R1–R4 can land in parallel as
they're independent of the solver and immediately useful for verifier-
mode operation (port of Phase 3a/3b to Rust).

## Validation strategy

For each Rust phase:

1. **Per-module unit test**: small known case (e.g.\ proton/neutron at
   H_3) where Python reference output is trusted.  `cargo test` checks
   bit-for-bit equality of certificate JSON.
2. **End-to-end integration test**: run Rust binary on the full
   ¹H–⁴⁰Ca registry, diff output against Python Phase 3a/3b witnesses.
3. **Scale test**: run on ⁶Li (n_0 = 18), ⁷Li (n_0 = 21).  This is the
   first place Rust is *required* — Python won't scale.
4. **α-cluster scale test**: ⁸Be (n_0 = 24) → ⁴⁰Ca (n_0 = 120).  This
   is the production-mode endpoint.

## Replacing the deprecated li-atom-knot-search

Once Phase R5 lands and successfully solves the SDP for ⁶Li / ⁷Li:

1. The new principled derivations ⁶Li, ⁷Li get methodology tag
   `principled-derivation` instead of `deprecated-volume-match`.
2. [`methodology-deprecation.witness.json`](../../folio-assistant/computations/methodology-deprecation.witness.json)
   is updated: ⁶Li, ⁷Li move out of the deprecated list.
3. The atlas renderer
   ([`recursive_atom_knot_atlas_render.py`](../../folio-assistant/computations/recursive_atom_knot_atlas_render.py))
   stops quarantining them and renders them in the principled section.
4. Phase 3c of the workplan is complete.

## References

- [`prop:joint-tower-sdp-confinement`](../../content/quantum-observable-universe/braids-and-knots/joint-tower-sdp-confinement.md)
  — design spec.
- [`prop:atom-knot-mass-derivation`](../../content/quantum-observable-universe/braids-and-knots/atom-knot-mass-derivation.md)
  — consumer of the certificate.
- [`gb-filtration-jet-order.witness.json`](../../folio-assistant/computations/gb-filtration-jet-order.witness.json)
  — Python PoC of the certificate format.
- [`joint-tower-sdp-h3.witness.json`](../../folio-assistant/computations/joint-tower-sdp-h3.witness.json)
  — Phase 3a output, schema reference.
- [`joint-tower-sdp-h6-h9.witness.json`](../../folio-assistant/computations/joint-tower-sdp-h6-h9.witness.json)
  — Phase 3b output (schema with cvxpy SDP-feasibility extension).
- [Clarabel.rs](https://clarabel.org/stable/rust/) — recommended Rust SDP solver.
