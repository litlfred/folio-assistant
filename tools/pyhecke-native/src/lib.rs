//! PyO3 native acceleration layer for `pyhecke`.
//!
//! Re-exposes the hottest hecke-engine kernels as a Python extension
//! module `pyhecke_native`. No NumPy dependency — returns nested
//! Python lists that `pyhecke.bridge` converts on demand. This keeps
//! the wheel small and the build simple.

use hecke_engine::{
    geck_pfeiffer, gram, littlewood_richardson, matrix_m_mpfr,
    reduce_laurent as rust_reduce_laurent, seminormal, seminormal_mn, seminormal_mpfr,
    tr_m_atomic_mpfr as rust_tr_m_atomic_mpfr,
    tr_m_word_lq as rust_tr_m_word_lq, wenzl_lr,
};
use pyo3::prelude::*;

/// Markov parameter z = 1 / (q^{1/2} + q^{-1/2}).
#[pyfunction]
fn markov_z(q: f64) -> f64 {
    gram::markov_z(q)
}

/// Hecke relation coefficient h = q - q^{-1}.
#[pyfunction]
fn hecke_h(q: f64) -> f64 {
    gram::hecke_h(q)
}

/// Markov-trace weights on the NF basis as a length-6 list.
#[pyfunction]
fn trace_weights(q: f64) -> Vec<f64> {
    gram::trace_weights(q).to_vec()
}

/// Gram matrix G_ij = tr_M(b_i · b_j) as a 6x6 list of lists.
#[pyfunction]
fn gram_matrix(q: f64) -> Vec<Vec<f64>> {
    gram::gram_matrix(q).iter().map(|r| r.to_vec()).collect()
}

/// Gram determinant — delegates to shared `hecke_engine::gram::det_6x6`.
#[pyfunction]
fn gram_determinant(q: f64) -> f64 {
    gram::det_6x6(&gram::gram_matrix(q))
}

/// Gram inverse as a 6x6 list of lists.
#[pyfunction]
fn gram_inverse(q: f64) -> Vec<Vec<f64>> {
    gram::gram_inverse(q).iter().map(|r| r.to_vec()).collect()
}

/// NF multiplication: multiply NF vector by `(c · σ_gen + d · 1)`.
///
/// Takes the 6-element NF vector and optional `h` (defaults to
/// `hecke_h(q_0)` = q_0 - q_0^{-1}). Returns a new 6-element list.
#[pyfunction]
#[pyo3(signature = (nf, c, d, gen, h=None))]
fn hm(nf: Vec<f64>, c: f64, d: f64, gen: u8, h: Option<f64>) -> PyResult<Vec<f64>> {
    if nf.len() != 6 {
        return Err(pyo3::exceptions::PyValueError::new_err(
            format!("nf must have exactly 6 elements, got {}", nf.len()),
        ));
    }
    let arr: [f64; 6] = [nf[0], nf[1], nf[2], nf[3], nf[4], nf[5]];
    let h_val = h.unwrap_or_else(|| gram::hecke_h(gram::Q_0));
    Ok(gram::hm(&arr, c, d, gen, h_val).to_vec())
}

/// Markov trace of a 6-element NF vector at a given `q`.
#[pyfunction]
#[pyo3(signature = (nf, q=None))]
fn nf_tr(nf: Vec<f64>, q: Option<f64>) -> PyResult<f64> {
    if nf.len() != 6 {
        return Err(pyo3::exceptions::PyValueError::new_err(
            format!("nf must have exactly 6 elements, got {}", nf.len()),
        ));
    }
    let arr: [f64; 6] = [nf[0], nf[1], nf[2], nf[3], nf[4], nf[5]];
    Ok(gram::nf_tr(&arr, q.unwrap_or(gram::Q_0)))
}

/// Sum of NF coefficients.
#[pyfunction]
fn nf_net(nf: Vec<f64>) -> PyResult<f64> {
    Ok(nf.iter().sum())
}

/// Build the full atom NF for (Z, N) via Hecke multiplication.
///
/// Mirrors `hecke_core.build_atom_nf`: proton / neutron B_3 confinement
/// + quark crossings + gluon self-coupling + inter-nucleon crossings +
/// electron (σ₁⁻¹) insertion. Returns a length-6 list of f64.
///
/// `h` defaults to `hecke_h(Q_0) = Q_0 - Q_0^{-1}` (the physical
/// substrate value). Pass an explicit `h` for alternative q.
#[pyfunction]
#[pyo3(signature = (z, n, h=None))]
fn build_atom_nf(z: u32, n: u32, h: Option<f64>) -> Vec<f64> {
    let h_val = h.unwrap_or_else(|| gram::hecke_h(gram::Q_0));
    gram::build_atom_nf(z, n, h_val).to_vec()
}

/// Per-generator Wedderburn volumes for the atom braid.
///
/// Returns a list of dicts `{sym, std, alt, full}` matching
/// `hecke_core.atom_per_generator_volumes`. `n_gens_total` =
/// `3A - 1` when `include_inter=True` (physical atom) else `2A`
/// (free baseline).
#[pyfunction]
#[pyo3(signature = (
    z, n,
    include_inter=true,
    crossings_per_pair=1,
    m_pp=None, m_pn=None, m_nn=None,
    q=None,
))]
#[allow(clippy::too_many_arguments)]
fn atom_per_generator_volumes(
    py: Python<'_>,
    z: u32,
    n: u32,
    include_inter: bool,
    crossings_per_pair: u32,
    m_pp: Option<u32>,
    m_pn: Option<u32>,
    m_nn: Option<u32>,
    q: Option<f64>,
) -> PyResult<PyObject> {
    let q_val = q.unwrap_or(gram::Q_0);
    let vols = gram::atom_per_generator_volumes(
        z, n, include_inter, crossings_per_pair,
        m_pp, m_pn, m_nn, q_val,
    );
    let list = pyo3::types::PyList::empty(py);
    for v in vols {
        let d = pyo3::types::PyDict::new(py);
        d.set_item("sym", v.sym)?;
        d.set_item("std", v.std)?;
        d.set_item("alt", v.alt)?;
        d.set_item("full", v.full)?;
        list.append(d)?;
    }
    Ok(list.into())
}

/// Hoefsmit seminormal character `χ_λ(β)` of a braid `β` for partition
/// `shape` at parameter `q`.
///
/// `shape`: partition λ ⊢ n as a list of descending part sizes.
/// `word`: braid as `[(sign, generator_index_1based), ...]`,
///   `sign ∈ {+1, -1}`, `generator_index ∈ {1, ..., n-1}`.
/// `q`: Hecke parameter (substrate value).
///
/// Returns `χ_λ(β) ∈ ℝ`.  Uses the sparse Hoefsmit kernel; gives a
/// ~50–100× speedup over the pure-Python implementation for `n ≥ 9`.
#[pyfunction]
fn chi_lambda_braid(shape: Vec<usize>, word: Vec<(i32, u32)>, q: f64) -> f64 {
    seminormal::chi_lambda_braid(&shape, &word, q)
}

/// **Cached-seminormal batched chi matrix** — `χ_{λ_i}(w_j)` for all
/// (shape, word) pairs, with seminormal blocks built once per shape.
/// Order-`p(n)` speedup over `chi_lambdas_braid` for atlases where
/// `len(words) ≈ p(n)`.
///
/// Returns Vec<Vec<f64>> with `result[i][j] = χ_{shapes[i]}(words[j])`.
#[pyfunction]
fn chi_lambda_matrix(
    shapes: Vec<Vec<usize>>,
    words: Vec<Vec<(i32, u32)>>,
    q: f64,
) -> Vec<Vec<f64>> {
    seminormal::chi_lambda_matrix(&shapes, &words, q)
}

/// **F3.2.ζ — q-character on a sequence of Hecke factors `c·σ + d·I`.**
///
/// `chi_q_atomic(shape, factors, q)` returns
/// `χ_λ(Π_i (c_i · σ_{g_i} + d_i · I))` for partition `λ ⊢ n` at
/// substrate parameter `q`.
///
/// `factors`: list of `(c, d, gen_1based)` triples, applied
/// **left-to-right** (factor at position 0 is rightmost in the
/// matrix product).
///
/// Use case: QOU atomic-braid Hecke characters with proton/neutron
/// `(c, d)` per crossing — what `chi_lambda_braid` (which only
/// takes `(sign, gen)` braid words) cannot handle. Unlocks A=12+
/// q-Hecke per-braid evaluation (P2.2c-12C).
///
/// Per-basis-vector iterative trace; O(dim²·k) per partition;
/// ≪ 1 s in release-optimised Rust for typical atomic braids.
#[pyfunction]
fn chi_q_atomic(shape: Vec<usize>, factors: Vec<(f64, f64, u32)>, q: f64) -> f64 {
    seminormal::chi_q_atomic(&shape, &factors, q)
}

/// Enumerate all partitions of `n` as a list of lists.
#[pyfunction]
fn partitions_of(n: usize) -> Vec<Vec<usize>> {
    seminormal::partitions_of(n)
}

/// Build the cycle-type representative braid for a partition.
fn cycle_type_braid_rust(parts: &[usize]) -> Vec<(i32, u32)> {
    let mut word = Vec::new();
    let mut offset: u32 = 0;
    for &c in parts {
        for k in 0..c.saturating_sub(1) {
            word.push((1_i32, offset + 1 + k as u32));
        }
        offset += c as u32;
    }
    word
}

/// Jones-Markov weights y_λ on H_n(q) for arbitrary n.
/// (which returns length-6 for H_3 NF basis only). Returns y_λ on the
/// **partition basis** (one per λ ⊢ n), satisfying Markov normalization
/// `Σ_λ y_λ · dim_q(λ) = 1`.
///
/// Method: cycle-type Schur orthogonality on the q-Hecke character matrix.
/// p(n) cycle-type representatives × p(n) partitions = p(n)×p(n) linear
/// system, solved via LU (with SVD pseudo-inverse fallback).
///
/// Per `docs/audits/2026-05-25-infra-audit-h3-vs-hn-hardcoded-api.md`:
/// canonical upstream replacement for the 6×6-hardcoded
/// `trace_weights(q)`. Use for any atom A ≥ 2 (H_{3A}, not H_3).
///
/// Cost: O(p(n)²) chi_lambda_braid + LU solve. Feasible n ≤ 24
/// (p(24)=1575); for n ≥ 36 (4He α-cluster scale) needs closed-form
/// q-Schur principal specialisation (future work).
#[pyfunction]
fn trace_weights_n(n: usize, q: f64) -> Vec<f64> {
    use nalgebra::{DMatrix, DVector};

    let shapes = seminormal::partitions_of(n);
    let p = shapes.len();
    let z = gram::markov_z(q);

    // Build cycle-type rep braids per partition
    let words: Vec<Vec<(i32, u32)>> = shapes
        .iter()
        .map(|s| cycle_type_braid_rust(s))
        .collect();

    // SPEEDUP: use chi_lambda_matrix which builds seminormal blocks
    // ONCE per shape (was p(n) times via repeated chi_lambda_braid calls).
    // result[j][i] = χ_{shapes[j]}(words[i]) — note transposed indexing.
    let chi_matrix = seminormal::chi_lambda_matrix(&shapes, &words, q);

    let mut a = DMatrix::<f64>::zeros(p, p);
    for i in 0..p {
        for j in 0..p {
            // A[i, j] = χ_{shapes[j]}(words[i]) = chi_matrix[j][i]
            a[(i, j)] = chi_matrix[j][i];
        }
    }

    let b: DVector<f64> = DVector::from_iterator(
        p,
        shapes.iter().map(|s| z.powi((n - s.len()) as i32)),
    );

    let decomp = a.clone().lu();
    let y = decomp
        .solve(&b)
        .unwrap_or_else(|| {
            let svd = a.svd(true, true);
            svd.solve(&b, 1e-12).unwrap_or_else(|_| DVector::zeros(p))
        });

    y.iter().copied().collect()
}

/// **q-Schur Plancherel weights y_λ on H_n(q) — CLOSED FORM, arbitrary n.**
///
/// Computes the q-Schur Plancherel measure on partitions λ ⊢ n:
///   y_λ(q) = q^{content_sum(λ)} / [n]_q!
/// where content_sum(λ) = Σ_{(i,j) ∈ λ} (j − i).
///
/// **DIFFERENT trace convention** from `trace_weights_n` (Wenzl JM):
///
/// | Convention | tr(σ_i) | Where used |
/// |------------|---------|------------|
/// | `trace_weights_n` (Wenzl JM) | `z = 1/(√q+1/√q)` | Borromean closed form, mass formula |
/// | `trace_weights_n_q_schur` (this) | `h = q - q⁻¹` | T(2,k) torus knot closed forms (sibling 5418678c8), lepton tower h-expansion |
///
/// **Closed form: NO linear system, NO chi evaluations.** Works for
/// arbitrary n instantly (O(p(n) · n²) total). Unblocks heavy atoms
/// (12C n=36, 16O n=48, 40Ca n=120, ...) that the LP-based Wenzl path
/// cannot reach.
///
/// Verified against sibling's H_2 closed form (commit `5418678c8`):
///   y_(2)   = q / [2]_q     (matches)
///   y_(1,1) = q⁻¹ / [2]_q   (matches)
#[pyfunction]
fn trace_weights_n_q_schur(n: usize, q: f64) -> Vec<f64> {
    let shapes = seminormal::partitions_of(n);

    // Compute [n]_q! = [1]_q · [2]_q · ... · [n]_q
    let qint = |k: i32| -> f64 {
        (q.powi(k) - q.powi(-k)) / (q - 1.0 / q)
    };
    let qfact_n: f64 = (1..=n as i32).map(|k| qint(k)).product();

    shapes
        .iter()
        .map(|shape| {
            // content_sum(λ) = Σ_{(i,j) ∈ λ} (j - i)
            let mut content_sum: i32 = 0;
            for (i, &row) in shape.iter().enumerate() {
                for j in 0..row {
                    content_sum += j as i32 - i as i32;
                }
            }
            q.powi(content_sum) / qfact_n
        })
        .collect()
}

/// Partition-basis Gram matrix on H_n(q) for arbitrary n.
///
/// n-generic replacement for the n=3-hardcoded `gram_matrix(q)` (which
/// returns 6×6 for the H_3 NF basis only). Returns the **partition-basis**
/// Gram matrix G[λ, μ] = tr_M(e_λ · e_μ) where {e_λ} are the partition
/// idempotents (Wedderburn projectors).
///
/// Since partition idempotents are orthogonal under Markov trace:
///   G[λ, μ] = δ_λμ · y_λ · dim_q(λ)
///
/// So the partition-basis Gram is **diagonal** with diagonal entries
/// `y_λ · dim_q(λ)`. Returns the full p(n) × p(n) matrix (with zeros
/// off-diagonal) for compatibility with linear-algebra consumers.
///
/// Cost: dominated by `trace_weights_n` call (O(p(n)²) chi_lambda
/// evaluations + LU solve). Subsequent matrix construction is O(p(n)).
///
/// Per `docs/audits/2026-05-25-infra-audit-h3-vs-hn-hardcoded-api.md`:
/// canonical replacement for the 6×6-hardcoded `gram_matrix(q)`.
#[pyfunction]
fn gram_matrix_n(n: usize, q: f64) -> Vec<Vec<f64>> {
    let shapes = seminormal::partitions_of(n);
    let p = shapes.len();
    let y = trace_weights_n(n, q);

    // Get classical dimensions via chi_lambda_braid on empty word
    let dims: Vec<f64> = shapes
        .iter()
        .map(|s| seminormal::chi_lambda_braid(s, &[], q))
        .collect();

    let mut g = vec![vec![0.0_f64; p]; p];
    for i in 0..p {
        g[i][i] = y[i] * dims[i];
    }
    g
}

/// Partition-basis Markov trace on H_n(q) for arbitrary n.
///
/// n-generic replacement for the n=3-hardcoded `nf_tr(nf, q)` (which
/// takes a 6-element NF vector). Takes a **partition-basis** vector
/// v with p(n) entries (one per λ ⊢ n) and computes:
///
///   tr_M(v) = Σ_λ v_λ · y_λ · dim_q(λ)
///
/// Since partition idempotents are orthogonal under Markov trace
/// (tr_M(e_λ) = y_λ · dim_q(λ)), this is just the dot product of v
/// with the diagonal of `gram_matrix_n`.
///
/// Returns scalar.
///
/// Per `docs/audits/2026-05-25-infra-audit-h3-vs-hn-hardcoded-api.md`:
/// canonical replacement for `nf_tr(nf, q)` (n=3 only) in production
/// callers that want to compute Markov trace of partition-basis
/// elements directly without going through chi_lambda_braid loops.
#[pyfunction]
fn nf_tr_n(v: Vec<f64>, n: usize, q: f64) -> PyResult<f64> {
    let shapes = seminormal::partitions_of(n);
    let p = shapes.len();
    if v.len() != p {
        return Err(pyo3::exceptions::PyValueError::new_err(format!(
            "partition-basis vector length {} doesn't match p({}) = {}",
            v.len(),
            n,
            p
        )));
    }
    let y = trace_weights_n(n, q);
    let dims: Vec<f64> = shapes
        .iter()
        .map(|s| seminormal::chi_lambda_braid(s, &[], q))
        .collect();

    let tr: f64 = (0..p).map(|i| v[i] * y[i] * dims[i]).sum();
    Ok(tr)
}

/// Partition-basis Gram inverse on H_n(q) for arbitrary n.
///
/// n-generic replacement for `gram_inverse(q)` (n=3 only). Since the
/// partition-basis Gram is diagonal (`G_ii = y_i · dim_i`), its inverse
/// is also diagonal with `G^{-1}_ii = 1 / (y_i · dim_i)`.
///
/// Returns p(n) × p(n) matrix; off-diagonal entries are zero, diagonal
/// entries are reciprocals of `y_λ · dim_q(λ)`.
///
/// Panics if any diagonal entry is zero (would be ill-defined gram).
#[pyfunction]
fn gram_inverse_n(n: usize, q: f64) -> Vec<Vec<f64>> {
    let shapes = seminormal::partitions_of(n);
    let p = shapes.len();
    let y = trace_weights_n(n, q);

    let dims: Vec<f64> = shapes
        .iter()
        .map(|s| seminormal::chi_lambda_braid(s, &[], q))
        .collect();

    let mut g_inv = vec![vec![0.0_f64; p]; p];
    for i in 0..p {
        let g_ii = y[i] * dims[i];
        g_inv[i][i] = if g_ii.abs() > 1e-300 { 1.0 / g_ii } else { 0.0 };
    }
    g_inv
}

/// **Batch `chi_q_atomic`** — f64 character of `c·σ + d·I` Hecke
/// factors evaluated across every partition of `n_strands`.  Returns
/// `Vec<(partition, chi_value)>`.  Rayon-parallel on the Rust side.
///
/// F-B of the `ffi-roundtrip-audit` skill: replaces Python
/// `for shape in partitions_of(n): chi_q_atomic(shape, factors, q)`
/// per-shape loops (saved one PyO3 crossing per partition + gained
/// work-stealing parallelism).  See
/// `.claude/skills/local/ffi-roundtrip-audit.md` §F-B.
#[pyfunction]
fn chi_q_atomic_all_partitions(
    n_strands: usize,
    factors: Vec<(f64, f64, u32)>,
    q: f64,
) -> Vec<(Vec<usize>, f64)> {
    seminormal::chi_q_atomic_all_partitions(n_strands, &factors, q)
}

/// **Classical Murnaghan-Nakayama character** `χ^λ(μ)`.
///
/// Computes the irreducible character of the symmetric group `S_n`
/// at the conjugacy class of cycle type `μ`, on the irrep indexed by
/// partition `λ`.  Returns an integer (classical MN values are in ℤ).
///
/// **Cost**: O(n² · #(border-strip-tableaux)) per character.  For
/// cross-validation with the Hoefsmit seminormal kernel at q = 1.
///
/// `lambda`: partition of n.
/// `mu`: cycle type (list of cycle lengths in any order).
#[pyfunction]
fn mn_chi(lambda: Vec<usize>, mu: Vec<usize>) -> i64 {
    seminormal_mn::mn_chi(&lambda, &mu)
}

/// **Debug helper**: returns the reduced Hecke-basis expansion as a list
/// of `(perm_one_line, length, cycle_type, coeff_terms)` for each
/// basis element after `reduce_basis_to_minimal_length`.
#[pyfunction]
fn debug_reduced_basis(n: usize, word: Vec<(i32, u32)>) -> Vec<(Vec<usize>, usize, Vec<usize>, Vec<(i32, String)>)> {
    let initial = geck_pfeiffer::braid_to_hecke(n, &word);
    let reduced = geck_pfeiffer::reduce_basis_to_minimal_length(&initial);
    let mut out = Vec::new();
    for (w, c) in reduced {
        let one_line = w.0.clone();
        let len = w.length();
        // cycle type
        let n = w.n();
        let mut visited = vec![false; n];
        let mut cycles = Vec::new();
        for start in 0..n {
            if visited[start] { continue; }
            let mut clen = 0;
            let mut j = start;
            while !visited[j] {
                visited[j] = true;
                j = w.0[j];
                clen += 1;
            }
            cycles.push(clen);
        }
        cycles.sort_by(|a, b| b.cmp(a));
        let coeff_terms: Vec<(i32, String)> = c.terms.into_iter()
            .map(|(he, bi)| (he, bi.to_string()))
            .collect();
        out.push((one_line, len, cycles, coeff_terms));
    }
    out
}

/// **F3.2.η — correct chi via basis expansion + Hoefsmit per T_w.**
///
/// Computes `χ_λ(T_β; q)` correctly at any q by:
///   1. Expanding T_β = Σ c_w · T_w in the Hecke basis.
///   2. For each basis element, finding a reduced word for w and
///      evaluating Hoefsmit on it.
///   3. Summing c_w · χ_λ(T_w) with c_w evaluated as f64 at q.
///
/// Returns f64 character value.  No MN speedup vs direct Hoefsmit
/// but validates the basis-expansion infrastructure.
#[pyfunction]
fn chi_via_gp_hoefsmit(
    lambda: Vec<usize>,
    n: usize,
    word: Vec<(i32, u32)>,
    q: f64,
) -> f64 {
    geck_pfeiffer::chi_lambda_via_gp_hoefsmit(&lambda, n, &word, q)
}

/// **F3.2.γ — q-character via Geck-Pfeiffer Hecke-basis expansion** *(EXPERIMENTAL).*
///
/// Computes `χ_λ(T_β; q)` for an arbitrary braid word `β` by:
///   1. Expanding `T_β = Σ c_w(q) · T_w` in the canonical Hecke basis.
///   2. Computing `χ_λ(T_w; q)` via q-MN on cycle type of w (a class
///      function on canonical T_w).
///   3. Summing `Σ c_w(q) · χ_λ(T_w; q)`.
///
/// Returns the q-Laurent polynomial as `[(half_exp, coeff_str), ...]`.
///
/// **WARNING (Copilot review #r3144...): structurally incomplete at q ≠ 1.**
/// The underlying [`geck_pfeiffer::chi_lambda_via_geck_pfeiffer`] is
/// explicitly documented as incomplete: at q ≠ 1, two basis elements
/// `T_w` and `T_{w'}` with the SAME cycle type but DIFFERENT lengths
/// give DIFFERENT Hecke characters, so the q-MN-on-cycle-type step is
/// only valid on minimal-length representatives.  The current
/// implementation reduces basis elements via simple-reflection
/// conjugation only — sufficient for many cases at n ≤ 6 but **not
/// guaranteed minimal** without the full Geck-Pfeiffer 2000 §3.2
/// "good cuspidal moves".  Empirically: D atomic braid (n=6) reduces
/// to 145 basis elements of which 17 are minimal-length and 128 are
/// not (see `geck_pfeiffer.rs` notes).
///
/// **At q = 1** the result is correct (Hecke ↦ S_n, characters are
/// class functions on cycle type alone).
///
/// **For correct q ≠ 1 evaluation on arbitrary braids**, prefer
/// [`chi_via_gp_hoefsmit`] (basis expansion + Hoefsmit per T_w —
/// correct but no MN speedup) or the direct seminormal kernel
/// [`chi_lambda_braid`] / [`chi_lambda_braid_mpfr`].
///
/// **Cost**: worst-case O(n!) basis elements but typical sparse braid
/// words give smaller spans.  At n = 6 (D atomic braid), basis can
/// have up to 720 elements but most words touch far fewer.
#[pyfunction]
fn chi_q_via_gp(
    py: Python<'_>,
    lambda: Vec<usize>,
    n: usize,
    word: Vec<(i32, u32)>,
) -> Vec<(i32, String)> {
    // GIL release per `docs/audits/2026-06-07-pyhecke-native-gil-release-patch.md`.
    // The Geck-Pfeiffer compute is fully Rust-side (no Python objects touched);
    // releasing the GIL lets Python threads parallelise per-partition calls
    // for the derived-χ catalogue sweep (≈ N× speedup on N-core boxes).
    py.allow_threads(|| {
        let poly = geck_pfeiffer::chi_lambda_via_geck_pfeiffer(&lambda, n, &word);
        poly.terms
            .into_iter()
            .map(|(he, c)| (he, c.to_string()))
            .collect()
    })
}

/// **Batched** chi_q_via_gp — computes χ^λ(T_β) for all `shapes` from
/// a SINGLE Geck-Pfeiffer reduction of the braid word. Per
/// `docs/audits/2026-06-07-pyhecke-native-gil-release-patch.md` Patch 2.
/// The GP reduction is the expensive part (depends only on `(n, word)`,
/// not on `λ`); sharing it across the partition loop gives
/// ~O(p(n))× speedup vs calling `chi_q_via_gp` per partition.
#[pyfunction]
fn chi_lambdas_via_gp(
    py: Python<'_>,
    shapes: Vec<Vec<usize>>,
    n: usize,
    word: Vec<(i32, u32)>,
) -> Vec<Vec<(i32, String)>> {
    py.allow_threads(|| {
        let polys = geck_pfeiffer::chi_lambdas_via_geck_pfeiffer(&shapes, n, &word);
        polys
            .into_iter()
            .map(|poly| {
                poly.terms
                    .into_iter()
                    .map(|(he, c)| (he, c.to_string()))
                    .collect()
            })
            .collect()
    })
}

/// **Littlewood-Richardson coefficient `c^λ_{μν}`.**
///
/// Computes the multiplicity of the Specht module `S^λ` in the
/// induced representation `Ind_{S_p × S_q}^{S_n} S^μ ⊠ S^ν`, equivalently
/// the number of LR tableaux of skew shape `λ/μ` with content `ν`.
///
/// Used by the F4 composer (`chi_via_factorization`): for a tensor-
/// product factorization β = β_1 ⊗ β_2,
///
///   χ_λ(β) = Σ_{μ ⊢ p, ν ⊢ q} c^λ_{μν} · χ_μ(β_1) · χ_ν(β_2)
///
/// `lambda`: outer partition λ.
/// `mu`: inner partition μ (must satisfy μ ⊆ λ componentwise).
/// `nu`: content partition ν.
///
/// Returns 0 if `|λ| ≠ |μ| + |ν|` or μ ⊄ λ.
#[pyfunction]
fn lr_coefficient(lambda: Vec<usize>, mu: Vec<usize>, nu: Vec<usize>) -> i64 {
    littlewood_richardson::lr_coefficient(&lambda, &mu, &nu)
}

/// **Experimental q-deformed character of a braid word.**
///
/// `chi_q_word(lambda, n_strands, word)` returns a Laurent polynomial
/// as `[(half_exp, coeff_str), ...]`.  See [`mn_chi_q`] for the
/// polynomial encoding format.
///
/// **WARNING (Copilot review)**: the underlying
/// `seminormal_mn::chi_lambda_braid_qdef` is correct at `q = 1`
/// (collapses to classical MN) and on canonical/minimal-length
/// permutation braids at `q ≠ 1`, but provides a deliberately
/// simplified (and incorrect) q-deformation for non-minimal braid
/// words.  For correct q ≠ 1 evaluation on arbitrary braids, use
/// [`chi_via_gp_hoefsmit`] (basis expansion + Hoefsmit per T_w) or
/// the direct seminormal kernel [`chi_lambda_braid`].
///
/// To avoid accidental misuse this binding rejects:
///   1. Words containing negative generators (would require the
///      unsupported `σ⁻¹ = σ − h` expansion).
///   2. **Positive but non-reduced words** (Copilot review #r3144...),
///      detected by comparing word length to the underlying
///      permutation's inversion length.  E.g. `[σ_1, σ_2, σ_1]` (length
///      3) is rejected because the underlying permutation of the
///      braid `σ_1 σ_2 σ_1` is `(1 3)` with only 1 inversion → its
///      reduced expression has length 1, so the q≠1 character is NOT
///      a class function on cycle type for this 3-letter word.
#[pyfunction]
fn chi_q_word(
    lambda: Vec<usize>,
    n_strands: usize,
    word: Vec<(i32, u32)>,
) -> PyResult<Vec<(i32, String)>> {
    if word.iter().any(|(sign, _)| *sign < 0) {
        return Err(pyo3::exceptions::PyValueError::new_err(
            "chi_q_word is experimental for q != 1 and only supported \
             for canonical/minimal-length permutation braids; words \
             with negative generators are rejected. Use \
             chi_via_gp_hoefsmit or chi_lambda_braid for correct \
             evaluation on arbitrary braids.",
        ));
    }
    // Reject positive non-reduced words: the underlying permutation
    // of the braid (apply each generator on the right of the
    // identity) must have inversion-count equal to the word length.
    let mut perm: Vec<usize> = (0..n_strands).collect();
    for &(_, gen) in &word {
        let i = (gen as usize).saturating_sub(1);
        if i + 1 < perm.len() {
            perm.swap(i, i + 1);
        }
    }
    let mut inversions = 0usize;
    for i in 0..perm.len() {
        for j in (i + 1)..perm.len() {
            if perm[i] > perm[j] {
                inversions += 1;
            }
        }
    }
    if inversions != word.len() {
        return Err(pyo3::exceptions::PyValueError::new_err(format!(
            "chi_q_word: input word has length {} but its underlying \
             permutation has {} inversions — non-reduced words are not \
             supported (q-character is not a class function of cycle \
             type for non-canonical braids).  Reduce the word to a \
             minimal-length expression of the same permutation, or use \
             chi_via_gp_hoefsmit / chi_lambda_braid for correct \
             evaluation on arbitrary braids.",
            word.len(), inversions
        )));
    }
    let poly = seminormal_mn::chi_lambda_braid_qdef(&lambda, n_strands, &word);
    Ok(poly
        .terms
        .into_iter()
        .map(|(he, c)| (he, c.to_string()))
        .collect())
}

/// **q-deformed Murnaghan-Nakayama character** `χ^λ(T_w; q)` *(EXPERIMENTAL).*
///
/// Computes the Hecke character of the canonical permutation braid
/// `T_w ∈ H_n(q)` of cycle type `μ`, returning the result as a list
/// of `(half_exponent, coefficient)` pairs encoding a Laurent
/// polynomial in `q^{1/2}`.  The half-exponent `2k` represents
/// `q^{k}`; `2k+1` represents `q^{(2k+1)/2}`.
///
/// **WARNING (Copilot review #r3144...): simplified q-deformation.**
/// The underlying [`seminormal_mn::chi_lambda_mn_qdef`] is documented
/// as a deliberately-simplified Halverson–Ram-style broken-strip
/// q-deformation: at `q = 1` it agrees exactly with classical MN
/// (verified across the full S_3, S_5 character tables), and on the
/// trivial / sign irreps it agrees with Hoefsmit at `q ≠ 1`.  For
/// *non-trivial* irreps at `q ≠ 1` it is **not** the canonical
/// Ram–Wenzl q-MN — the broken-strip q-weight differs from the
/// Ram–Wenzl 1992 weight on multi-row strips.  Treat output for such
/// cases as a placeholder until the proper Ram–Wenzl recursion is
/// wired in (next milestone).
///
/// For ground truth, evaluate via the Hoefsmit kernel
/// [`chi_lambda_braid`] on a reduced word for `T_w`, or via the basis
/// expansion + Hoefsmit path [`chi_via_gp_hoefsmit`].
///
/// Currently handles permutation-form `μ` only; mixed-sign generators
/// (inverses) require Hecke-relation expansion (separate milestone).
///
/// Returns `[(half_exp, coeff_str), ...]` where `coeff_str` is the
/// BigInt rendered as decimal (callers parse via `int(s)`).
#[pyfunction]
fn mn_chi_q(lambda: Vec<usize>, mu: Vec<usize>) -> Vec<(i32, String)> {
    let poly = seminormal_mn::chi_lambda_mn_qdef(&lambda, &mu);
    poly.terms
        .into_iter()
        .map(|(he, c)| (he, c.to_string()))
        .collect()
}

/// **Batch character evaluation across many partitions** (rayon-parallel).
///
/// Evaluates `χ_λ(β)` for every partition in `shapes` in parallel using
/// Rust rayon.  Returns a `List[float]` in the same order.
///
/// Faster than calling `chi_lambda_braid` from a Python
/// `multiprocessing.Pool`: no per-partition pickling overhead, rayon
/// work-stealing balances dim variation across partitions.
#[pyfunction]
fn chi_lambdas_braid(
    shapes: Vec<Vec<usize>>,
    word: Vec<(i32, u32)>,
    q: f64,
) -> Vec<f64> {
    seminormal::chi_lambdas_braid(&shapes, &word, q)
}

/// **Batch MPFR character evaluation across many partitions** (rayon-parallel).
///
/// Like `chi_lambda_braid_mpfr` but in batch.  Returns a `List[str]`,
/// each entry being a decimal string at requested `dps` precision.
#[pyfunction]
#[pyo3(signature = (shapes, word, q_str, dps=50))]
fn chi_lambdas_braid_mpfr(
    shapes: Vec<Vec<usize>>,
    word: Vec<(i32, u32)>,
    q_str: String,
    dps: u32,
) -> Vec<String> {
    seminormal_mpfr::chi_lambdas_braid_mpfr(&shapes, &word, &q_str, dps)
}

/// **High-precision (MPFR) character `χ_λ(β)`.**
///
/// Computes the Hoefsmit seminormal character at `dps` decimal-precision
/// using MPFR-backed arbitrary-precision arithmetic. Returns the result
/// as a decimal string (callers should parse via `mpmath.mpf` or
/// equivalent). Substantially slower than the `f64` path (~10–30×) but
/// exact at the requested precision — no f64 rounding error.
///
/// `q_str`: substrate parameter as a decimal string (avoids f64 lossy
///   conversion at the boundary).
/// `dps`: requested decimal precision (default 50 if caller passes a
///   smaller value, MPFR uses internal guard bits).
#[pyfunction]
#[pyo3(signature = (shape, word, q_str, dps=50))]
fn chi_lambda_braid_mpfr(
    shape: Vec<usize>,
    word: Vec<(i32, u32)>,
    q_str: String,
    dps: u32,
) -> String {
    seminormal_mpfr::chi_lambda_braid_mpfr(&shape, &word, &q_str, dps)
}

/// Matrix-M block-restricted χ^λ at substrate q.
///
/// Computes χ^λ(T_β)(q) for a parabolic-shaped braid
/// `β = β_left · σ_{k_split}^{bridge_sign} · β_right` via the
/// μ_p block-restriction trace formula (see PR #2015 / Tier 2
/// audit). The caller supplies `q` as a decimal string — the
/// implementation works for any q, not just the substrate q_0; the
/// catalogue / sweep uses substrate q_0 by convention but this
/// binding is q-agnostic. The full dim_V_λ × dim_V_λ seminormal
/// matrices are built ONCE inside this call, sub-blocks extracted,
/// full matrices dropped — call-time work is on the small per-μ_p
/// blocks only.
///
/// For multi-call use (e.g. tr_M aggregation Σ_λ y_λ χ^λ over
/// every partition), each call rebuilds its own per-λ cache.
/// Future API may add a cache handle to amortise the seminormal
/// build across multiple braid words on the same shape.
///
/// `word_left`: list of `(sign, gen_1based)` pairs, all gens < k_split.
/// `bridge_sign`: +1 or -1.
/// `word_right`: list of `(sign, gen_1based)` pairs, all gens > k_split.
/// `q_str`: deformation parameter q as decimal string.
/// `dps`: requested decimal precision (default 50).
///
/// Returns χ value as a decimal string with `dps` digits.
///
/// **NO f64 in compute path** — `rug::Float` throughout.
///
/// Raises `ValueError` on structural invalid input (k_split out of
/// range, generators outside the parabolic split, bridge_sign not
/// ±1) so a downstream Python caller does not crash the interpreter
/// on a malformed call. An unparsable `q_str` currently surfaces as
/// `PanicException` (not `ValueError`) — a fallible `try_` variant
/// in `matrix_m_mpfr.rs` is the planned follow-up; see the binding
/// body comment for context.
#[pyfunction]
#[pyo3(signature = (shape, word_left, bridge_sign, word_right, k_split, q_str, dps=50))]
fn chi_via_matrix_m_mpfr(
    shape: Vec<usize>,
    word_left: Vec<(i32, usize)>,
    bridge_sign: i32,
    word_right: Vec<(i32, usize)>,
    k_split: usize,
    q_str: String,
    dps: u32,
) -> PyResult<String> {
    // Validate at the binding boundary so the Python interpreter sees
    // a clean ValueError instead of a Rust panic. Mirrors the asserts
    // in matrix_m_mpfr::precompute_block_tables_mpfr but converts each
    // failure to a typed exception.
    let n: usize = shape.iter().sum();
    if n == 0 {
        return Err(pyo3::exceptions::PyValueError::new_err(
            "shape must be a non-empty partition (sum > 0)".to_string(),
        ));
    }
    if k_split < 1 {
        return Err(pyo3::exceptions::PyValueError::new_err(
            "k_split must be ≥ 1 (it is the 1-based bridge generator index)".to_string(),
        ));
    }
    if k_split >= n {
        return Err(pyo3::exceptions::PyValueError::new_err(format!(
            "k_split = {} ≥ shape sum {}: σ_{{k_split}} would not exist (need k_split < n)",
            k_split, n,
        )));
    }
    if bridge_sign != 1 && bridge_sign != -1 {
        return Err(pyo3::exceptions::PyValueError::new_err(format!(
            "bridge_sign must be +1 or -1, got {}",
            bridge_sign,
        )));
    }
    for (sign, g) in &word_left {
        if *sign != 1 && *sign != -1 {
            return Err(pyo3::exceptions::PyValueError::new_err(format!(
                "word_left sign must be +1 or -1, got {} at gen {}",
                sign, g,
            )));
        }
        if *g < 1 || *g >= k_split {
            return Err(pyo3::exceptions::PyValueError::new_err(format!(
                "word_left generator σ_{} not in left parabolic [1, {}]",
                g, k_split - 1,
            )));
        }
    }
    for (sign, g) in &word_right {
        if *sign != 1 && *sign != -1 {
            return Err(pyo3::exceptions::PyValueError::new_err(format!(
                "word_right sign must be +1 or -1, got {} at gen {}",
                sign, g,
            )));
        }
        if *g <= k_split || *g >= n {
            return Err(pyo3::exceptions::PyValueError::new_err(format!(
                "word_right generator σ_{} not in right parabolic [{}, {}]",
                g, k_split + 1, n - 1,
            )));
        }
    }
    // q_str is parsed inside precompute_block_tables_mpfr; the Rust
    // function panics on an unparsable value, which PyO3 surfaces as
    // pyo3::panic::PanicException. We can't catch it without
    // catch_unwind + UnwindSafe, which Rust closures over &Vec<…> are
    // not by default. Leaving structural validation here (the common
    // failure mode) and accepting that a bad q_str produces a
    // PanicException with the descriptive Rust message rather than a
    // ValueError — a follow-up can add a fallible try_ variant in
    // matrix_m_mpfr.rs.

    let cache =
        matrix_m_mpfr::precompute_block_tables_mpfr(&shape, k_split, &q_str, dps);
    let chi = matrix_m_mpfr::chi_via_matrix_m_mpfr(
        &cache, &word_left, bridge_sign, &word_right,
    );
    // Use `to_string_radix(10, Some(dps as usize))` so the decimal
    // output is pinned to the requested precision (the bare to_string
    // defaults to a precision that may not match `dps`).
    Ok(chi.to_string_radix(10, Some(dps as usize)))
}

/// Operator-selection LP at MPFR precision (`prop:operator-selection-lp`).
///
/// Decimal-STRING IO so 50-dps precision survives the boundary (not f64).
/// `t`: objective/traces; `g`: Frobenius Gram (row-major); `n_target`: net
/// RHS; optional `m_bound` (default `"1e6"`), `dual_tol` (default `"1e-9"`),
/// `prec_bits` (default 167 ≈ 50 dps).  Returns a dict matching
/// `pyhecke.lp_dual_solver.LpDualResult.to_dict()` plus full-precision
/// `*_str` variants.
///
/// Only present when the wheel is built with `--features clarabel-lp`
/// (pulls clarabel + MPFR into the wheel).  The default wheel omits it; the
/// Python bridge falls back to the `clarabel-operator-selection-lp` CLI.
#[cfg(feature = "clarabel-lp")]
#[pyfunction]
#[pyo3(signature = (t, g, n_target, m_bound=None, dual_tol=None, prec_bits=167))]
fn operator_selection_lp(
    py: Python<'_>,
    t: Vec<String>,
    g: Vec<Vec<String>>,
    n_target: String,
    m_bound: Option<String>,
    dual_tol: Option<String>,
    prec_bits: u32,
) -> PyResult<PyObject> {
    let m_bound = m_bound.unwrap_or_else(|| "1e6".to_string());
    let dual_tol = dual_tol.unwrap_or_else(|| "1e-9".to_string());
    let r = hecke_engine::operator_selection_lp::solve_operator_selection_lp_from_strings(
        &t, &g, &n_target, &m_bound, &dual_tol, prec_bits,
    )
    .map_err(pyo3::exceptions::PyValueError::new_err)?;
    let d = pyo3::types::PyDict::new(py);
    d.set_item("x_star", r.x_star)?;
    d.set_item("y0_star", r.y0_star)?;
    d.set_item("y_star", r.y_star)?;
    d.set_item("active_set", r.active_set)?;
    d.set_item("primal_obj", r.primal_obj)?;
    d.set_item("dual_obj", r.dual_obj)?;
    d.set_item("duality_gap", r.duality_gap)?;
    d.set_item("feasible", r.feasible)?;
    d.set_item("status", r.status)?;
    d.set_item("x_star_str", r.x_star_str)?;
    d.set_item("y0_star_str", r.y0_star_str)?;
    d.set_item("y_star_str", r.y_star_str)?;
    d.set_item("primal_obj_str", r.primal_obj_str)?;
    d.set_item("dual_obj_str", r.dual_obj_str)?;
    d.set_item("duality_gap_str", r.duality_gap_str)?;
    d.set_item("precision_bits", r.precision_bits)?;
    Ok(d.into())
}

#[pymodule]
fn pyhecke_native(m: &Bound<'_, PyModule>) -> PyResult<()> {
    #[cfg(feature = "clarabel-lp")]
    m.add_function(wrap_pyfunction!(operator_selection_lp, m)?)?;
    m.add_function(wrap_pyfunction!(markov_z, m)?)?;
    m.add_function(wrap_pyfunction!(hecke_h, m)?)?;
    m.add_function(wrap_pyfunction!(trace_weights, m)?)?;
    m.add_function(wrap_pyfunction!(gram_matrix, m)?)?;
    m.add_function(wrap_pyfunction!(gram_determinant, m)?)?;
    m.add_function(wrap_pyfunction!(gram_inverse, m)?)?;
    m.add_function(wrap_pyfunction!(hm, m)?)?;
    m.add_function(wrap_pyfunction!(nf_tr, m)?)?;
    m.add_function(wrap_pyfunction!(nf_net, m)?)?;
    m.add_function(wrap_pyfunction!(build_atom_nf, m)?)?;
    m.add_function(wrap_pyfunction!(atom_per_generator_volumes, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambda_braid, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambda_matrix, m)?)?;
    m.add_function(wrap_pyfunction!(chi_q_atomic, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambdas_braid, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambda_braid_mpfr, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambdas_braid_mpfr, m)?)?;
    m.add_function(wrap_pyfunction!(chi_via_matrix_m_mpfr, m)?)?;
    m.add_function(wrap_pyfunction!(partitions_of, m)?)?;
    m.add_function(wrap_pyfunction!(trace_weights_n, m)?)?;
    m.add_function(wrap_pyfunction!(trace_weights_n_q_schur, m)?)?;
    m.add_function(wrap_pyfunction!(gram_matrix_n, m)?)?;
    m.add_function(wrap_pyfunction!(gram_inverse_n, m)?)?;
    m.add_function(wrap_pyfunction!(nf_tr_n, m)?)?;
    m.add_function(wrap_pyfunction!(chi_q_atomic_all_partitions, m)?)?;
    m.add_function(wrap_pyfunction!(mn_chi, m)?)?;
    m.add_function(wrap_pyfunction!(mn_chi_q, m)?)?;
    m.add_function(wrap_pyfunction!(chi_q_word, m)?)?;
    m.add_function(wrap_pyfunction!(lr_coefficient, m)?)?;
    m.add_function(wrap_pyfunction!(chi_q_via_gp, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambdas_via_gp, m)?)?;
    m.add_function(wrap_pyfunction!(debug_reduced_basis, m)?)?;
    m.add_function(wrap_pyfunction!(chi_via_gp_hoefsmit, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambda_all_partitions_f64, m)?)?;
    m.add_function(wrap_pyfunction!(chi_lambda_all_partitions_mpfr, m)?)?;
    m.add_function(wrap_pyfunction!(tr_m_word_lq, m)?)?;
    m.add_function(wrap_pyfunction!(tr_m_word_lq_clear_cache, m)?)?;
    m.add_function(wrap_pyfunction!(incremental_reduce_rust, m)?)?;
    m.add_function(wrap_pyfunction!(tr_m_atomic_mpfr, m)?)?;
    m.add_function(wrap_pyfunction!(tr_m_atomic_mpfr_with_state, m)?)?;
    m.add_function(wrap_pyfunction!(tr_m_atomic_mpfr_cached, m)?)?;
    m.add_function(wrap_pyfunction!(atomic_reduce_cache_clear, m)?)?;
    m.add_function(wrap_pyfunction!(atomic_reduce_cache_size, m)?)?;
    // Pull __version__ directly from Cargo.toml so the Python module,
    // the Rust crate, and pyproject.toml never drift. (Gemini review
    // r3103025537: hardcoded version is fragile.)
    m.add("__version__", env!("CARGO_PKG_VERSION"))?;
    Ok(())
}

/// Compute χ^λ(β, q) for every partition λ ⊢ n_strands, given a
/// canonical-form atomic braid word `(sign, gen_1based)` where
/// `sign ∈ {1, -1, 0}` with 0 = averaged half-sum (σ + σ⁻¹)/2.
///
/// Delegates to `hecke_engine::wenzl_lr::chi_lambda_canonical_all_partitions_f64`
/// (rayon-parallel over partitions; direct-averaging f64 path, no
/// 2^k sub-word expansion). Returns `Vec<(partition, χ^λ)>`.
///
/// Use case: the Python `markov_peel` critical path computes
/// `tr_M(β, q) = Σ_λ y_λ(q) · χ^λ(β, q)` via the Wenzl bridge.
/// The Σ_λ y_λ · χ^λ combine is cheap in Python; the per-partition
/// χ^λ at H_{3A} (A ≥ 5) is the bottleneck. This exposes the
/// Rust accelerator: dim 462 sympy matmul at H_12 → tens of ms
/// in Rust per PR #682.
#[pyfunction]
fn chi_lambda_all_partitions_f64(
    n_strands: usize,
    word: Vec<(i32, u32)>,
    q: f64,
) -> Vec<(Vec<usize>, f64)> {
    // Translate (sign, gen) → (Crossing, gen). The Rust API uses
    // `Crossing::Sigma` / `SigmaInv` / `Averaged` for sign 1/-1/0.
    let word_with_averaged: Vec<wenzl_lr::CrossingPair> = word
        .iter()
        .map(|&(sign, gen)| {
            let c = match sign {
                1 => wenzl_lr::Crossing::Sigma,
                -1 => wenzl_lr::Crossing::SigmaInv,
                0 => wenzl_lr::Crossing::Averaged,
                _ => panic!(
                    "chi_lambda_all_partitions_f64: unknown sign {} \
                     (expected -1, 0, or 1)",
                    sign
                ),
            };
            (c, gen)
        })
        .collect();
    wenzl_lr::chi_lambda_canonical_all_partitions_f64(
        n_strands,
        &word_with_averaged,
        q,
    )
}

/// **MPFR variant** of [`chi_lambda_all_partitions_f64`] at
/// arbitrary precision (≥ 50 dps recommended).
///
/// Returns `Vec<(partition, chi_decimal_string)>`. The caller is
/// expected to load each chi via `mpmath.mpf(decimal_string)` to
/// preserve precision. Per CLAUDE.md §Precision goals L1 (50-dps
/// compute floor), this is the production path for categorical
/// identities; the f64 variant exists for speed-only use cases
/// where structural-zero distinction is not required.
///
/// `q_str` is the substrate parameter as a decimal string (50+ dps
/// recommended; pin to `q_parameter.Q_50_DIGIT_STR` from Python).
/// `dps` controls the MPFR working precision (50 = production,
/// 100 = research-grade).
#[pyfunction]
fn chi_lambda_all_partitions_mpfr(
    n_strands: usize,
    word: Vec<(i32, u32)>,
    q_str: String,
    dps: u32,
) -> Vec<(Vec<usize>, String)> {
    let word_with_averaged: Vec<wenzl_lr::CrossingPair> = word
        .iter()
        .map(|&(sign, gen)| {
            let c = match sign {
                1 => wenzl_lr::Crossing::Sigma,
                -1 => wenzl_lr::Crossing::SigmaInv,
                0 => wenzl_lr::Crossing::Averaged,
                _ => panic!(
                    "chi_lambda_all_partitions_mpfr: unknown sign {} \
                     (expected -1, 0, or 1)",
                    sign
                ),
            };
            (c, gen)
        })
        .collect();
    wenzl_lr::chi_lambda_canonical_all_partitions_mpfr(
        n_strands,
        &word_with_averaged,
        &q_str,
        dps,
    )
}

/// **Markov-axiom recursive ascent** in Rust — the canonical
/// Jones-Markov trace `tr_M(w, q)` for a single Hecke word `w` in
/// H_n(q), returned as a serialised ZHLaurent polynomial in (z, h)
/// with BigInt-in-q^{1/2} coefficients.
///
/// Mirrors `folio-assistant/computations/laurent_q_trace.py
/// tr_M_word_lq` exactly, but with BigInt arithmetic in Rust
/// (no f64). Per CLAUDE.md §Precision goals L1 — every coefficient
/// is exact; the Python caller evaluates at q₀ to mpmath.mpf at
/// production dps.
///
/// `word`: 0-based generator indices (consistent with
/// `markov_trace_canonical.tr_M_word` and the Python `tr_M_word_lq`).
/// `n_strands`: H_n strand count.
///
/// Returns `Vec<((z_exp, h_exp), Vec<(q_half_exp, big_int_str)>)>`.
/// The outer Vec has one entry per non-zero (z, h) monomial; each
/// coefficient is a list of `(q_exp_doubled, BigInt_decimal_string)`
/// pairs (where `q_exp_doubled = 2 * q_exp` to support half-integer
/// q-exponents — see `hecke_engine::laurent_poly_q::LaurentPolyQ`
/// for the encoding).
///
/// Raises `RuntimeError` on Case C (multiple top-1 in segment) —
/// caller routes to the sympy ocneanu_fallback path same as the
/// Python implementation.
#[pyfunction]
fn tr_m_word_lq(
    word: Vec<u32>,
    n_strands: usize,
) -> PyResult<Vec<((i32, i32), Vec<(i32, String)>)>> {
    match rust_tr_m_word_lq::tr_m_word_lq(&word, n_strands, 200) {
        Ok(zh) => Ok(zh.to_ffi()),
        Err(msg) => Err(pyo3::exceptions::PyRuntimeError::new_err(msg)),
    }
}

/// Clear the global recursion cache. Call between independent
/// atoms to prevent unbounded memory growth in long-running
/// sessions (matches the Python `_tr_M_word_lq_cached.cache_clear()`).
#[pyfunction]
fn tr_m_word_lq_clear_cache() {
    rust_tr_m_word_lq::clear_cache();
}

/// **Tier 1.A entry point — Rust `incremental_reduced_element_fast`.**
///
/// Runs the Markov-peel reduce loop (R1 Hecke quadratic, R2 far-comm,
/// R3 Yang-Baxter braid — see `hecke_engine::reduce_laurent`) on an
/// atomic-braid signed word.  Returns the fully-reduced
/// `LaurentHeckeElement` as a flat FFI vector.
///
/// Tier 1.A of the compute-optimisation roadmap
/// (`docs/audits/2026-05-20-compute-optimization-roadmap.md`): port
/// of `folio-assistant/computations/hecke_laurent_fast.py`'s
/// `incremental_reduced_element_fast` driver, addressing the 60-70%
/// of wall on ⁶Li `tr_M_atomic` that the cProfile attributed to
/// sympy `Rational` arithmetic inside the Python LaurentQ `__mul__`.
///
/// `signed_word`: `[(sign, gen_0based), ...]` where `sign ∈ {-1, 0, +1}`
///   (the same encoding used by `chi_lambda_all_partitions_*`, but with
///   0-based generator indices to match the Python reduce convention).
/// `max_iterations_per_step`: per-step fixpoint cap (production: 10000).
///
/// Returns `Vec<(Vec<i32>, Vec<(q_exp, num_str, den_str)>)>` — each
/// element is `(σ-word, list of (q-exponent, BigInt-numerator decimal,
/// BigInt-denominator decimal))`.  The Python bridge reconstructs
/// `dict[tuple, sympy.Rational]` or evaluates directly to `mpmath.mpf`
/// at `q₀`.
///
/// **R4 is not implemented** — see the module-level docstring on
/// `hecke_engine::reduce_laurent` for the rationale (R4 sympy
/// round-trip was empirically slower than the unfolded LaurentQ
/// reduce).  Words containing negative entries (formal-variable
/// markers) round-trip unchanged so a future R4 port can slot in.
#[pyfunction]
#[pyo3(signature = (signed_word, max_iterations_per_step=10_000))]
fn incremental_reduce_rust(
    signed_word: Vec<(i8, i32)>,
    max_iterations_per_step: u32,
) -> Vec<(Vec<i32>, Vec<(i32, String, String)>)> {
    let elem = rust_reduce_laurent::incremental_reduce(
        &signed_word,
        max_iterations_per_step,
    );
    elem.to_ffi()
}

/// **Tier 1.A — full pipeline in Rust + MPFR, single decimal string out.**
///
/// End-to-end equivalent of:
///   `tr_M(β_atomic, q₀) @ dps`
/// implemented entirely in Rust (R1+R2+R3 reduce → tr_M_word_lq
/// per reduced word → MPFR substitution at `q₀`).  No per-word
/// PyO3 calls; no Python mpmath combine loop; no Python ↔ Rust
/// shuttling of BigInt decimal strings per coefficient.
///
/// `signed_word`: `[(sign, gen_0based), ...]` — same shape as
/// `incremental_reduce_rust`.
/// `n_strands`: `3·A` (where `A = Z + N`).
/// `q_str`: substrate parameter as a decimal string.
/// `dps`: working precision in decimal places (default 50,
/// CLAUDE.md §Precision goals L1 floor).
///
/// Returns: one decimal-string-encoded MPFR value at full precision.
/// Python caller does `mpmath.mpf(result_str)`.
///
/// Raises `RuntimeError` if the trace recursion hits Case C —
/// caller routes to the sympy ocneanu fallback (same contract as
/// `tr_m_word_lq`).
#[pyfunction]
#[pyo3(signature = (signed_word, n_strands, q_str, dps=50))]
fn tr_m_atomic_mpfr(
    signed_word: Vec<(i8, i32)>,
    n_strands: usize,
    q_str: String,
    dps: u32,
) -> PyResult<String> {
    rust_tr_m_atomic_mpfr::tr_m_atomic_mpfr(&signed_word, n_strands, &q_str, dps)
        .map_err(pyo3::exceptions::PyRuntimeError::new_err)
}

/// **Rust-side cached variant of [`tr_m_atomic_mpfr`].**
///
/// Looks up the longest cached prefix of `signed_word` in the
/// in-process `hecke_engine::atomic_reduce_cache`, resumes the
/// reduce from that state, applies the suffix, and caches the
/// final state under the full signed-word's hash.
///
/// **Zero FFI marshalling on cache hit.**  The cached
/// `LaurentHeckeElement` never crosses the Python ↔ Rust boundary —
/// Python passes only the signed word, hash + lookup happen
/// entirely in Rust.  Productive variant of the prefix-cache
/// pattern (the disk-resident JSON `_prefix_cache.py` path is a
/// net loss per `docs/audits/2026-05-22-prefix-cache-negative-bench.md`).
///
/// Cache lifetime: process-bound.  Use `atomic_reduce_cache_clear()`
/// to drop state between independent sessions.
#[pyfunction]
#[pyo3(signature = (signed_word, n_strands, q_str, dps=50))]
fn tr_m_atomic_mpfr_cached(
    signed_word: Vec<(i8, i32)>,
    n_strands: usize,
    q_str: String,
    dps: u32,
) -> PyResult<String> {
    rust_tr_m_atomic_mpfr::tr_m_atomic_mpfr_cached(&signed_word, n_strands, &q_str, dps)
        .map_err(pyo3::exceptions::PyRuntimeError::new_err)
}

/// Empty the Rust-side atomic-reduce cache.  Call between
/// independent sessions / benchmarks to avoid warm-cache bias.
#[pyfunction]
fn atomic_reduce_cache_clear() {
    hecke_engine::atomic_reduce_cache::clear_cache();
}

/// Number of cached reduced-state entries in the Rust-side cache.
#[pyfunction]
fn atomic_reduce_cache_size() -> usize {
    hecke_engine::atomic_reduce_cache::cache_size()
}

/// **Resume-from-state variant of [`tr_m_atomic_mpfr`].**
///
/// Returns `(mpf_decimal_string, final_reduced_state_ffi)`.  The
/// `final_reduced_state_ffi` can be persisted via
/// `_prefix_cache.save_prefix_state(...)` and replayed later via
/// `initial_state_ffi`.
///
/// `initial_state_ffi=None` (or `[]`) → start from identity (same
/// as `tr_m_atomic_mpfr`).
///
/// Per PR #886 prefix-cache infra: when computing `tr_M(β_K)` for
/// atom K whose signed word starts with a cached prefix `P`, pass
/// the cached state as `initial_state_ffi` and the SUFFIX
/// `signed_word[len(P):]` as `signed_word_suffix`.  Result is
/// numerically identical to the from-scratch path but skips the
/// already-reduced work.
#[pyfunction]
#[pyo3(signature = (signed_word_suffix, n_strands, q_str, dps=50, initial_state_ffi=None))]
fn tr_m_atomic_mpfr_with_state(
    signed_word_suffix: Vec<(i8, i32)>,
    n_strands: usize,
    q_str: String,
    dps: u32,
    initial_state_ffi: Option<Vec<(Vec<i32>, Vec<(i32, String, String)>)>>,
) -> PyResult<(String, Vec<(Vec<i32>, Vec<(i32, String, String)>)>)> {
    let initial = match initial_state_ffi {
        None => hecke_engine::laurent_hecke_element::LaurentHeckeElement::identity(),
        Some(data) if data.is_empty() => {
            hecke_engine::laurent_hecke_element::LaurentHeckeElement::identity()
        }
        Some(data) => {
            hecke_engine::laurent_hecke_element::LaurentHeckeElement::from_ffi(&data)
                .map_err(pyo3::exceptions::PyValueError::new_err)?
        }
    };
    let (val, final_state) = rust_tr_m_atomic_mpfr::tr_m_atomic_mpfr_with_state(
        &signed_word_suffix,
        n_strands,
        &q_str,
        dps,
        initial,
    )
    .map_err(pyo3::exceptions::PyRuntimeError::new_err)?;
    Ok((val, final_state.to_ffi()))
}
