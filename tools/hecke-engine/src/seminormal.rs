//! Hoefsmit seminormal-form representation of the Iwahori–Hecke algebra
//! `H_n(q)`.
//!
//! For a partition `λ ⊢ n`, builds matrices `σ_1, ..., σ_{n-1}` for the
//! Hecke generators in the seminormal basis indexed by standard Young
//! tableaux of shape `λ`.  Each matrix has at most two non-zero entries
//! per row (1×1 or 2×2 blocks under the SYT-swap action), so we use a
//! row-major sparse representation `Vec<Vec<(usize, f64)>>`.
//!
//! Public API:
//! - `partitions_of(n)` — enumerate partitions of `n` (descending parts).
//! - `standard_young_tableaux(shape)` — enumerate SYT of given shape.
//!   Returns `Vec<Vec<(row, col)>>` indexed `[tab_idx][entry−1] = cell`.
//! - `seminormal_matrices(shape, q)` — build sparse matrices for
//!   `σ_1, ..., σ_{n−1}` at parameter `q`.
//! - `chi_lambda_braid(shape, word, q)` — character `χ_λ(β)` of the
//!   braid `β` represented as a sequence of `(sign, generator_index)`
//!   pairs (1-indexed, sign = +1 / −1).
//!
//! Reference: Hoefsmit 1974, "Representations of Hecke algebras of
//! finite groups with BN-pairs of classical type"; Mathas, "Iwahori–
//! Hecke Algebras and Schur Algebras of the Symmetric Group" (1999).

/// Cell content `c(r, j) = j − r` (column-minus-row).
#[inline]
fn content(row: usize, col: usize) -> i32 {
    col as i32 - row as i32
}

/// Enumerate cells of the Young diagram of `shape` in row-major order.
fn young_cells(shape: &[usize]) -> Vec<(usize, usize)> {
    let mut cells = Vec::with_capacity(shape.iter().sum());
    for (i, &row_len) in shape.iter().enumerate() {
        for j in 0..row_len {
            cells.push((i, j));
        }
    }
    cells
}

/// Enumerate all partitions of `n`, each as a Vec of descending parts.
pub fn partitions_of(n: usize) -> Vec<Vec<usize>> {
    let mut out = Vec::new();
    let mut current = Vec::new();
    fn rec(n: usize, max: usize, current: &mut Vec<usize>, out: &mut Vec<Vec<usize>>) {
        if n == 0 {
            out.push(current.clone());
            return;
        }
        let upper = n.min(max);
        for i in (1..=upper).rev() {
            current.push(i);
            rec(n - i, i, current, out);
            current.pop();
        }
    }
    rec(n, n, &mut current, &mut out);
    out
}

/// Enumerate all SYTs of `shape`.  Each SYT is `Vec<(row, col)>` indexed
/// by `entry − 1`: position `[k]` is the cell holding the entry `k+1`.
pub fn standard_young_tableaux(shape: &[usize]) -> Vec<Vec<(usize, usize)>> {
    let n: usize = shape.iter().sum();
    if n == 0 {
        return vec![vec![]];
    }
    let cells = young_cells(shape);
    let nc = cells.len();

    // Pre-compute the "left neighbor" and "above neighbor" cell index
    // (or None) for each cell.  Used to enforce SYT constraint: a cell
    // can only be filled after its left and above neighbors are.
    let mut left_idx: Vec<Option<usize>> = vec![None; nc];
    let mut above_idx: Vec<Option<usize>> = vec![None; nc];
    for (k, &(r, c)) in cells.iter().enumerate() {
        if c > 0 {
            for (kk, &(rr, cc)) in cells.iter().enumerate() {
                if rr == r && cc == c - 1 {
                    left_idx[k] = Some(kk);
                    break;
                }
            }
        }
        if r > 0 {
            for (kk, &(rr, cc)) in cells.iter().enumerate() {
                if rr == r - 1 && cc == c {
                    above_idx[k] = Some(kk);
                    break;
                }
            }
        }
    }

    let mut results: Vec<Vec<(usize, usize)>> = Vec::new();
    let mut filled: Vec<(usize, usize)> = Vec::with_capacity(n);
    let mut available = vec![true; nc];

    fn fill(
        entry: usize,
        n: usize,
        cells: &[(usize, usize)],
        left_idx: &[Option<usize>],
        above_idx: &[Option<usize>],
        filled: &mut Vec<(usize, usize)>,
        available: &mut [bool],
        results: &mut Vec<Vec<(usize, usize)>>,
    ) {
        if entry > n {
            results.push(filled.clone());
            return;
        }
        for ci in 0..cells.len() {
            if !available[ci] {
                continue;
            }
            // Left neighbor must be filled (i.e. not available).
            if let Some(li) = left_idx[ci] {
                if available[li] {
                    continue;
                }
            }
            // Above neighbor must be filled.
            if let Some(ai) = above_idx[ci] {
                if available[ai] {
                    continue;
                }
            }
            filled.push(cells[ci]);
            available[ci] = false;
            fill(entry + 1, n, cells, left_idx, above_idx, filled, available, results);
            filled.pop();
            available[ci] = true;
        }
    }

    fill(1, n, &cells, &left_idx, &above_idx, &mut filled, &mut available, &mut results);
    results
}

/// Sparse row-major matrix: `m[i] = [(j, value), ...]` for the non-zero
/// entries of row `i`.  Used for the σ_k matrices (≤ 2 entries / row).
pub type SparseMatrix = Vec<Vec<(usize, f64)>>;

/// Block representation of a Hoefsmit σ_k matrix: list of `(rows, vals)`
/// blocks where each block is either 1×1 (scalar diagonal entry on row
/// i) or 2×2 (acts on rows i, j).
///
/// 1×1 block: `Block::One { i, a }` — diagonal entry a on row i.
/// 2×2 block: `Block::Two { i, j, a, ap, b }` — acts as
///     [a   b ] on rows (i, j).  (b² = a·a' + 1.)
///     [b   a']
///
/// This representation lets us apply σ_k to a dense matrix in O(dim)
/// per block, rather than O(dim²) per generic sparse-sparse multiply.
#[derive(Clone, Debug)]
pub enum Block {
    One { i: usize, a: f64 },
    Two { i: usize, j: usize, a: f64, ap: f64, b: f64 },
}

/// Apply `v ← σ · v` in-place, where σ is given as a list of 1×1/2×2
/// blocks acting on rows of a dim-vector.
///
/// 1×1 block on row i: `v[i] *= a`.
/// 2×2 block on rows (i, j):
///   [v[i], v[j]] ← [a·v[i] + b·v[j], b·v[i] + a'·v[j]]
fn apply_sigma_left(v: &mut [f64], blocks: &[Block]) {
    for block in blocks {
        match *block {
            Block::One { i, a } => v[i] *= a,
            Block::Two { i, j, a, ap, b } => {
                let vi = v[i];
                let vj = v[j];
                v[i] = a * vi + b * vj;
                v[j] = b * vi + ap * vj;
            }
        }
    }
}

/// Apply `v ← (σ − h·I) · v` in-place (for `σ⁻¹`).
fn apply_sigma_inv_left(v: &mut [f64], blocks: &[Block], h: f64) {
    for block in blocks {
        match *block {
            Block::One { i, a } => v[i] *= a - h,
            Block::Two { i, j, a, ap, b } => {
                let vi = v[i];
                let vj = v[j];
                v[i] = (a - h) * vi + b * vj;
                v[j] = b * vi + (ap - h) * vj;
            }
        }
    }
}

/// Apply `v ← (σ_i + σ_i⁻¹)/2 · v = (σ_i - h/2) · v` in-place.
///
/// **Averaged crossing direct-substitution.** From the Hecke relation
/// `σ_i² = (q - q⁻¹) σ_i + 1`, we have `σ_i⁻¹ = σ_i - h` with
/// `h = q - q⁻¹`. The half-sum is therefore
/// `(σ_i + σ_i⁻¹)/2 = σ_i - h/2`, a single matrix operation.
///
/// Replaces the 2^k sub-word enumeration in `chi_lambda_canonical_h_n_*`
/// for braids with `k` averaged crossings: the matrix product becomes
/// O(n_gens) single-matrix applies instead of `2^k · O(n_gens)`.
/// For ⁴He (k ≈ 20), that's a ~10⁶× speedup.
fn apply_sigma_averaged_left(v: &mut [f64], blocks: &[Block], h: f64) {
    let half_h = 0.5 * h;
    for block in blocks {
        match *block {
            Block::One { i, a } => v[i] *= a - half_h,
            Block::Two { i, j, a, ap, b } => {
                let vi = v[i];
                let vj = v[j];
                v[i] = (a - half_h) * vi + b * vj;
                v[j] = b * vi + (ap - half_h) * vj;
            }
        }
    }
}

/// Build the Hoefsmit seminormal-form generators `σ_1, ..., σ_{n-1}`
/// for partition `shape` at parameter `q`, in block form.
///
/// Returns a `(dim, blocks_per_generator)` pair where
/// `blocks_per_generator[k]` is the list of 1×1 / 2×2 blocks
/// describing σ_{k+1}.  Block form is what `chi_lambda_braid` uses
/// for fast dense matrix multiplication.
pub fn seminormal_block_generators(shape: &[usize], q: f64) -> (usize, Vec<Vec<Block>>) {
    let n: usize = shape.iter().sum();
    let syts = standard_young_tableaux(shape);
    let dim = syts.len();
    let h = q - 1.0 / q;

    // Pre-index SYTs into a HashMap so that swap-partner lookup is O(1)
    // rather than O(dim).  The key is the SYT's cell list as a tuple.
    use std::collections::HashMap;
    let mut syt_index: HashMap<Vec<(usize, usize)>, usize> = HashMap::with_capacity(dim);
    for (idx, syt) in syts.iter().enumerate() {
        syt_index.insert(syt.clone(), idx);
    }

    let mut all_blocks: Vec<Vec<Block>> = Vec::with_capacity(n.saturating_sub(1));

    for k in 1..n {
        let mut blocks: Vec<Block> = Vec::with_capacity(dim);
        let mut processed = vec![false; dim];

        for i in 0..dim {
            if processed[i] {
                continue;
            }
            let cell_k = syts[i][k - 1];
            let cell_k1 = syts[i][k];
            let rho = content(cell_k1.0, cell_k1.1) - content(cell_k.0, cell_k.1);
            let rho_f = rho as f64;
            let a = h / (1.0 - q.powf(-2.0 * rho_f));

            // Build swapped SYT and look up index in O(1).
            let mut swapped = syts[i].clone();
            swapped[k - 1] = cell_k1;
            swapped[k] = cell_k;
            let partner = syt_index.get(&swapped).copied().filter(|&j| j != i);

            match partner {
                None => {
                    // 1×1 block.
                    blocks.push(Block::One { i, a });
                    processed[i] = true;
                }
                Some(j) => {
                    let a_prime = h / (1.0 - q.powf(2.0 * rho_f));
                    let b_sq = a * a_prime + 1.0;
                    let b = b_sq.abs().sqrt();
                    blocks.push(Block::Two {
                        i: i.min(j),
                        j: i.max(j),
                        a: if i < j { a } else { a_prime },
                        ap: if i < j { a_prime } else { a },
                        b,
                    });
                    processed[i] = true;
                    processed[j] = true;
                }
            }
        }

        all_blocks.push(blocks);
    }

    (dim, all_blocks)
}

/// Sparse-matrix form (legacy; kept for reference / testing).  Builds
/// the same generators as `seminormal_block_generators` but as full
/// sparse matrices.  Slower than the block form for repeated
/// multiplication.
pub fn seminormal_matrices(shape: &[usize], q: f64) -> Vec<SparseMatrix> {
    let (dim, all_blocks) = seminormal_block_generators(shape, q);
    all_blocks
        .into_iter()
        .map(|blocks| {
            let mut rows: Vec<Vec<(usize, f64)>> = vec![Vec::new(); dim];
            for block in blocks {
                match block {
                    Block::One { i, a } => rows[i].push((i, a)),
                    Block::Two { i, j, a, ap, b } => {
                        rows[i].push((i, a));
                        rows[i].push((j, b));
                        rows[j].push((i, b));
                        rows[j].push((j, ap));
                    }
                }
            }
            for row in &mut rows {
                row.sort_by_key(|&(j, _)| j);
            }
            rows
        })
        .collect()
}

/// Compute the character `χ_λ(β)` of a braid `β` at parameter `q`,
/// where `β` is given as a sequence of `(sign, generator)` pairs.
/// `sign ∈ {+1, -1}`; `generator` is 1-indexed (`σ_1, ..., σ_{n-1}`).
///
/// Negative generators are handled via the Hecke relation
/// `σ⁻¹ = σ − h` where `h = q − q⁻¹`.
///
/// For very long words this densifies the running product — that is
/// unavoidable since the trace depends on the *entire* product.  At
/// `dim ~ 700` and `word_length ~ 50`, this still beats the Python
/// implementation by a factor of ~50–100×.
/// **Batch character evaluation across many partitions.**
///
/// Evaluates `χ_λ(β)` for every partition `λ` in `shapes` in parallel
/// using rayon internal threads.  Significantly faster than calling
/// `chi_lambda_braid` from Python in a multiprocessing.Pool because:
///   - no Python pickling overhead per partition
///   - rayon work-stealing balances large vs small partitions
///   - Block generators computed once per partition, no IPC roundtrip
///
/// Returns `Vec<f64>` in the same order as input `shapes`.
pub fn chi_lambdas_braid(
    shapes: &[Vec<usize>],
    word: &[(i32, u32)],
    q: f64,
) -> Vec<f64> {
    use rayon::prelude::*;
    shapes
        .par_iter()
        .map(|shape| chi_lambda_braid(shape, word, q))
        .collect()
}

pub fn chi_lambda_braid(shape: &[usize], word: &[(i32, u32)], q: f64) -> f64 {
    let n: usize = shape.iter().sum();
    if n == 0 {
        return 1.0;
    }
    let (dim, all_blocks) = seminormal_block_generators(shape, q);
    if dim == 0 {
        return 0.0;
    }
    if all_blocks.is_empty() {
        // No generators (single-cell partition); χ_(λ)(I) = 1 for empty word.
        return if word.is_empty() { 1.0 } else { 0.0 };
    }
    let h = q - 1.0 / q;

    // Pre-marshal word into block references with sign, so the inner
    // loop is allocation-free.  Invalid generator indices panic loudly
    // (Copilot review #r3142936635): silent dropping was a debugging
    // hazard — caller bugs would silently compute the wrong character.
    let resolved: Vec<(i32, &[Block])> = word
        .iter()
        .map(|&(sign, gen)| {
            assert!(
                gen != 0 && (gen as usize) <= all_blocks.len(),
                "chi_lambda_braid: invalid generator index {} for n = {} \
                 (valid range: 1..={})",
                gen,
                n,
                all_blocks.len()
            );
            let idx = gen as usize - 1;
            (sign, all_blocks[idx].as_slice())
        })
        .collect();

    // Trace = Σ_i e_i^T · M · e_i, where M = σ_{w_1} σ_{w_2} ... σ_{w_n}.
    // We compute each diagonal element by applying M to e_i:
    //   v ← e_i; v ← σ_{w_n} v; ...; v ← σ_{w_1} v; trace_diag += v[i].
    // Memory: O(dim) per partition (was O(dim²) for the dense matrix).
    let mut v = vec![0.0_f64; dim];
    let mut trace = 0.0;
    for i in 0..dim {
        // v = e_i.
        for k in 0..dim {
            v[k] = 0.0;
        }
        v[i] = 1.0;
        // Apply word right-to-left to v:  v ← M · e_i.
        // Sign convention:
        //   sign > 0  → σ_g           (positive crossing)
        //   sign < 0  → σ_g - h·I     (negative crossing, σ_g⁻¹ from Hecke relation)
        //   sign == 0 → σ_g - h/2·I   (averaged crossing, (σ_g + σ_g⁻¹)/2)
        for &(sign, blocks) in resolved.iter().rev() {
            if sign > 0 {
                apply_sigma_left(&mut v, blocks);
            } else if sign < 0 {
                apply_sigma_inv_left(&mut v, blocks, h);
            } else {
                apply_sigma_averaged_left(&mut v, blocks, h);
            }
        }
        trace += v[i];
    }

    trace
}

/// **Cached-seminormal batched chi evaluator** — `χ_{λ_i}(w_j)` for all
/// `(shape, word)` pairs, building `seminormal_block_generators(λ_i, q)`
/// **once per shape** (then reusing across all words).
///
/// For atlases (e.g. cycle-type LP for Jones-Markov y_λ) that evaluate
/// `p(n)` shapes × `p(n)` words at the same q, the naive
/// `chi_lambdas_braid` rebuilds seminormal blocks `p(n)²` times. This
/// function rebuilds them `p(n)` times — order-p(n) speedup for the
/// seminormal-build cost.
///
/// Returns `Vec<Vec<f64>>` where `result[i][j] = χ_{shapes[i]}(words[j])`.
/// Outer Vec is parallel-iter over shapes (rayon); inner is sequential
/// per shape (since they share cached blocks).
///
/// Cost: `p(n)` seminormal builds + `p(n)·|words|·dim_max²` trace ops.
pub fn chi_lambda_matrix(
    shapes: &[Vec<usize>],
    words: &[Vec<(i32, u32)>],
    q: f64,
) -> Vec<Vec<f64>> {
    use rayon::prelude::*;

    let h = q - 1.0 / q;

    shapes
        .par_iter()
        .map(|shape| {
            let n: usize = shape.iter().sum();
            // Build seminormal blocks ONCE per shape — this is the cache.
            let (dim, all_blocks) = seminormal_block_generators(shape, q);

            words
                .iter()
                .map(|word| {
                    // Handle edge cases that match chi_lambda_braid.
                    if n == 0 {
                        return 1.0;
                    }
                    if dim == 0 {
                        return 0.0;
                    }
                    if all_blocks.is_empty() {
                        return if word.is_empty() { 1.0 } else { 0.0 };
                    }
                    // Resolve word against cached blocks.
                    let resolved: Vec<(i32, &[Block])> = word
                        .iter()
                        .map(|&(sign, gen)| {
                            assert!(
                                gen != 0 && (gen as usize) <= all_blocks.len(),
                                "chi_lambda_matrix: invalid generator {} for n={} (valid 1..={})",
                                gen, n, all_blocks.len()
                            );
                            let idx = gen as usize - 1;
                            (sign, all_blocks[idx].as_slice())
                        })
                        .collect();
                    // Trace via per-diagonal-vector application
                    // (matches chi_lambda_braid inner loop exactly).
                    let mut v = vec![0.0_f64; dim];
                    let mut trace = 0.0;
                    for i in 0..dim {
                        for k in 0..dim {
                            v[k] = 0.0;
                        }
                        v[i] = 1.0;
                        for &(sign, blocks) in resolved.iter().rev() {
                            if sign > 0 {
                                apply_sigma_left(&mut v, blocks);
                            } else if sign < 0 {
                                apply_sigma_inv_left(&mut v, blocks, h);
                            } else {
                                apply_sigma_averaged_left(&mut v, blocks, h);
                            }
                        }
                        trace += v[i];
                    }
                    trace
                })
                .collect()
        })
        .collect()
}

/// Apply `v ← (c · σ + d · I) · v` in-place.
///
/// Equivalent to `c * apply_sigma_left(v) + d * v`, computed without
/// the temporary buffer.
fn apply_factor_left(v: &mut [f64], blocks: &[Block], c: f64, d: f64) {
    if c == 0.0 {
        // Pure identity scaling
        if d != 1.0 {
            for x in v.iter_mut() {
                *x *= d;
            }
        }
        return;
    }
    if d == 0.0 {
        // Pure σ scaling
        if c != 1.0 {
            for x in v.iter_mut() {
                *x *= c;
            }
        }
        apply_sigma_left(v, blocks);
        return;
    }
    // General case: v ← c·σ(v) + d·v.
    // Iterate blocks; for each, update v in-place using c and d.
    // Block::One { i, a }: σ acts on v[i] by scalar a, so
    //   new v[i] = c · a · v[i] + d · v[i] = (c·a + d) · v[i]
    // Block::Two { i, j, a, ap, b }: σ on (v[i], v[j]) is
    //   (a·v[i] + b·v[j], b·v[i] + ap·v[j]); adding d·(v[i], v[j])
    //   gives ((c·a + d)·v[i] + c·b·v[j], c·b·v[i] + (c·ap + d)·v[j]).
    // Indices NOT covered by any block are identity for σ; result
    // = c · v[k] + d · v[k] = (c + d) · v[k]. Track which are
    // covered to apply the identity scaling to the rest.
    let n = v.len();
    let mut covered = vec![false; n];
    for block in blocks {
        match *block {
            Block::One { i, a } => {
                v[i] *= c * a + d;
                covered[i] = true;
            }
            Block::Two { i, j, a, ap, b } => {
                let vi = v[i];
                let vj = v[j];
                v[i] = (c * a + d) * vi + (c * b) * vj;
                v[j] = (c * b) * vi + (c * ap + d) * vj;
                covered[i] = true;
                covered[j] = true;
            }
        }
    }
    // Identity action on uncovered indices: σ acts as I → c + d
    let scale = c + d;
    if (scale - 1.0).abs() > f64::EPSILON {
        for k in 0..n {
            if !covered[k] {
                v[k] *= scale;
            }
        }
    }
}

/// **F3.2.ζ — q-character on a sequence of Hecke factors `c·σ + d·I`.**
///
/// Computes `χ_λ(Π_i (c_i · σ_{g_i} + d_i · I))` for a partition
/// `shape ⊢ n` at substrate parameter `q`, where each factor is a
/// linear combination of a Hecke generator and the identity.
///
/// `factors`: list of `(c, d, gen_1based)` triples, applied
/// **left-to-right** (i.e., factor at position 0 is the
/// rightmost in the matrix product).
///
/// Returns `χ_λ(Π) ∈ ℝ`.
///
/// # When to use
///
/// - For QOU atomic-braid characters where each crossing is a
///   `c·σ + d·I` Hecke element (see `mass_endomorphism.proton_cross`
///   / `neutron_cross`).
/// - For per-crossing-coefficient evaluations that the simpler
///   `chi_lambda_braid` (which only takes braid letters
///   `(sign, gen)`) cannot handle.
///
/// # Performance
///
/// Per-basis-vector iterative trace, same complexity as
/// `chi_lambda_braid`: O(dim²·k) per partition where k is the
/// number of factors.  For dim ≤ a few thousand and k ≤ a few
/// hundred, runs in ≪ 1 s in release-optimised Rust.
///
/// # Numerical
///
/// f64 throughout. For arbitrary precision use the `_mpfr` variant
/// (TODO).
/// **Batch `chi_q_atomic` over all partitions of `n_strands`** —
/// returns `Vec<(partition, chi_value)>` for every λ ⊢ n_strands,
/// computed in parallel via rayon.
///
/// F-B fix from `ffi-roundtrip-audit` (2026-05-22): caller-side
/// `for shape in partitions_of(n): chi_q_atomic(shape, factors, q)`
/// is the Python ↔ Rust ping-pong anti-pattern — `p(n)` PyO3 boundary
/// crossings.  This batch entry-point collapses that to a single
/// crossing + Rust-side rayon parallelism.
///
/// Same f64 numerical contract as [`chi_q_atomic`].  For MPFR
/// precision, see [`crate::seminormal_mpfr::chi_q_atomic_all_partitions_mpfr`]
/// (currently not implemented; the F-B fix landed only on the f64
/// side per the existing `compute_atom_chi_rust.py` caller).
pub fn chi_q_atomic_all_partitions(
    n_strands: usize,
    factors: &[(f64, f64, u32)],
    q: f64,
) -> Vec<(Vec<usize>, f64)> {
    use rayon::prelude::*;
    let shapes = partitions_of(n_strands);
    shapes
        .par_iter()
        .map(|shape| {
            let chi = chi_q_atomic(shape, factors, q);
            (shape.clone(), chi)
        })
        .collect()
}

pub fn chi_q_atomic(shape: &[usize], factors: &[(f64, f64, u32)], q: f64) -> f64 {
    let n: usize = shape.iter().sum();
    if n == 0 {
        return 1.0;
    }
    let (dim, all_blocks) = seminormal_block_generators(shape, q);
    if dim == 0 {
        return 0.0;
    }

    // Pre-marshal factors. Validate generator indices.
    let resolved: Vec<(f64, f64, &[Block])> = factors
        .iter()
        .map(|&(c, d, gen)| {
            assert!(
                gen != 0 && (gen as usize) <= all_blocks.len() || all_blocks.is_empty(),
                "chi_q_atomic: invalid generator index {} for n = {} \
                 (valid range: 1..={})",
                gen,
                n,
                all_blocks.len()
            );
            // For shapes with no generators (n = 1), any factor with
            // nontrivial gen would crash above; return placeholder.
            let blocks: &[Block] = if all_blocks.is_empty() {
                &[]
            } else {
                let idx = gen as usize - 1;
                all_blocks[idx].as_slice()
            };
            (c, d, blocks)
        })
        .collect();

    // Trace via per-basis-vector iteration.
    let mut v = vec![0.0_f64; dim];
    let mut trace = 0.0;
    for i in 0..dim {
        for k in 0..dim {
            v[k] = 0.0;
        }
        v[i] = 1.0;
        // Apply factors right-to-left:
        //   v ← (c_1·σ + d_1·I) (c_2·σ + d_2·I) ... (c_k·σ + d_k·I) e_i
        // means we apply factor k first to e_i, then factor k-1, etc.
        for &(c, d, blocks) in resolved.iter().rev() {
            apply_factor_left(&mut v, blocks, c, d);
        }
        trace += v[i];
    }
    trace
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn partitions_of_3() {
        let mut p = partitions_of(3);
        p.sort();
        assert_eq!(p, vec![vec![1, 1, 1], vec![2, 1], vec![3]]);
    }

    #[test]
    fn partitions_of_5_count() {
        assert_eq!(partitions_of(5).len(), 7);
    }

    #[test]
    fn syts_of_2_1() {
        // shape (2,1) has dim 2; standard reps of S_3.
        let syts = standard_young_tableaux(&[2, 1]);
        assert_eq!(syts.len(), 2);
    }

    #[test]
    fn syts_count_5() {
        // Sum of (dim V_λ)² over λ ⊢ n equals n!  =  5! = 120.
        let total: usize = partitions_of(5)
            .iter()
            .map(|p| {
                let d = standard_young_tableaux(p).len();
                d * d
            })
            .sum();
        assert_eq!(total, 120);
    }

    #[test]
    fn trivial_rep_character_is_q_to_word_count() {
        // Trivial rep V_(n): dim 1, all sigma act as q.  So
        // chi_(n)(σ_1) = q, chi_(n)(σ_1²) = q², chi_(n)(σ_1⁻¹) = 1/q
        // (since σ·σ⁻¹ = 1 and σ acts as q on the trivial rep).
        let q = 1.10998;
        let chi_pos = chi_lambda_braid(&[3], &[(1, 1)], q);
        assert!((chi_pos - q).abs() < 1e-10, "chi_(3)(σ₁) = q = {q}; got {chi_pos}");
        let chi_neg = chi_lambda_braid(&[3], &[(-1, 1)], q);
        // σ⁻¹ has eigenvalue 1/q on the trivial rep
        // (since σ acts as q and σ·σ⁻¹ = 1).
        assert!(
            (chi_neg - 1.0 / q).abs() < 1e-10,
            "chi_(3)(σ₁⁻¹) = 1/q; got {chi_neg}"
        );
    }
}
