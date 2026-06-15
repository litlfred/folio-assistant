//! Littlewood-Richardson coefficients `c^λ_{μν}`.
//!
//! For partitions λ ⊢ n, μ ⊢ p, ν ⊢ q with n = p + q, the LR
//! coefficient `c^λ_{μν}` is the number of LR tableaux of skew shape
//! λ/μ with content ν.  Equivalently, it is the multiplicity of the
//! Specht module `S^λ` in the induced representation
//! `Ind_{S_p × S_q}^{S_n} S^μ ⊠ S^ν`.
//!
//! Used by F4 composer (`chi_via_factorization`) to combine cached
//! sub-character data: for a tensor-product factorization
//! `β = β_1 ⊗ β_2`,
//!
//!   χ_λ(β) = Σ_{μ ⊢ p, ν ⊢ q} c^λ_{μν} · χ_μ(β_1) · χ_ν(β_2)
//!
//! ## Algorithm
//!
//! Enumerate semistandard Young tableaux (SSYT) of skew shape λ/μ
//! with content ν, filter by the **lattice / reverse-reading-word**
//! property: every prefix of the reverse reading word must have
//! more `1`s than `2`s, more `2`s than `3`s, etc.
//!
//! ## References
//!
//! - **Stanley EC2** §7.18 (LR rule).
//! - **Sagan 2001** "The Symmetric Group" §4.9.
//! - **Macdonald 1995** "Symmetric Functions and Hall Polynomials" §I.9.

/// Compute Littlewood-Richardson coefficient `c^λ_{μν}`.
///
/// `lambda`: outer partition λ.
/// `mu`: inner partition μ (must satisfy μ ⊆ λ componentwise).
/// `nu`: content partition ν.
///
/// Returns 0 if `|λ| ≠ |μ| + |ν|` or if `μ ⊄ λ`.
pub fn lr_coefficient(lambda: &[usize], mu: &[usize], nu: &[usize]) -> i64 {
    let n_lambda: usize = lambda.iter().sum();
    let n_mu: usize = mu.iter().sum();
    let n_nu: usize = nu.iter().sum();
    if n_lambda != n_mu + n_nu {
        return 0;
    }
    // μ ⊆ λ check.
    for (i, &m) in mu.iter().enumerate() {
        if i >= lambda.len() || lambda[i] < m {
            return 0;
        }
    }
    // Enumerate SSYT of skew shape λ/μ with content ν, filter by
    // lattice property.  We use a recursive cell-by-cell filling.

    // Cells of λ/μ in standard reading order (top-to-bottom, left-
    // to-right).
    let mut cells: Vec<(usize, usize)> = Vec::new();
    for i in 0..lambda.len() {
        let start = if i < mu.len() { mu[i] } else { 0 };
        for j in start..lambda[i] {
            cells.push((i, j));
        }
    }
    if cells.len() != n_nu {
        return 0;
    }

    // Two-pass approach: enumerate all SSYTs using standard reading
    // order (top-to-bottom, left-to-right) for proper SSYT row/column
    // constraints; at each leaf, build the REVERSE reading word
    // (top-to-bottom, right-to-left within row) and verify ballot.

    let mut filling: Vec<usize> = vec![0; cells.len()];
    let mut remaining: Vec<usize> = nu.to_vec();

    let mut count: i64 = 0;
    enumerate_ssyt_full(
        &cells, lambda, mu, nu,
        &mut filling,
        &mut remaining,
        0,
        &mut count,
    );
    count
}

/// Enumerate SSYTs with content ν (incremental, pruned), and verify
/// the ballot property on the reverse reading word at each leaf.
///
/// Pruning (Gemini #r3143786241 / Copilot #r3144...):  rather than
/// recomputing content at the leaf, we maintain a `remaining[v-1]`
/// counter and skip values that have already been fully placed.
/// Once `cell_idx == cells.len()`, every entry of `remaining` is 0
/// by construction — no separate content check required.
fn enumerate_ssyt_full(
    cells: &[(usize, usize)],
    lambda: &[usize],
    mu: &[usize],
    nu: &[usize],
    filling: &mut [usize],
    remaining: &mut [usize],
    cell_idx: usize,
    count: &mut i64,
) {
    if cell_idx == cells.len() {
        // Build reverse reading word inline + verify ballot.
        // Inline reverse iteration avoids per-row Vec allocation
        // (Gemini #r3143786239); fixed-size stack array for prefix
        // counts avoids per-leaf Vec allocation (Gemini #r3143786240).
        // Bounded by MAX_PARTITION_PARTS ≥ practical n (~24).
        const MAX_PARTITION_PARTS: usize = 32;
        if nu.len() + 2 > MAX_PARTITION_PARTS {
            // Fallback for unexpectedly large nu — shouldn't happen at n ≤ 24.
            // Keep a heap allocation in the cold path.
            let mut prefix_count = vec![0usize; nu.len() + 2];
            return verify_ballot_heap(
                cells, lambda, mu, nu, filling, &mut prefix_count, count
            );
        }
        let mut prefix_count = [0usize; MAX_PARTITION_PARTS];
        let mut cell_ptr = 0usize;
        for i in 0..lambda.len() {
            let start = if i < mu.len() { mu[i] } else { 0 };
            let row_len = lambda[i] - start;
            // Iterate row right-to-left without intermediate Vec.
            for k in (0..row_len).rev() {
                let v = filling[cell_ptr + k];
                prefix_count[v] += 1;
                // Verify ballot: #(k) ≥ #(k+1) for all k after each placement.
                for kk in 1..nu.len() {
                    if prefix_count[kk] < prefix_count[kk + 1] {
                        return;
                    }
                }
            }
            cell_ptr += row_len;
        }
        *count += 1;
        return;
    }
    let (r, c) = cells[cell_idx];
    let max_v = nu.len();
    let mut lb = 1usize;
    // Column-strict: > entry above (if above is in skew).
    if r > 0 && c >= mu_at(mu, r - 1) && c < lambda[r - 1] {
        if let Some(idx) = find_cell_idx(cells, r - 1, c) {
            lb = lb.max(filling[idx] + 1);
        }
    }
    // Row-weak: ≥ entry to the left (if left is in skew).
    if c > mu_at(mu, r) {
        if let Some(idx) = find_cell_idx(cells, r, c - 1) {
            lb = lb.max(filling[idx]);
        }
    }
    for v in lb..=max_v {
        // Content pruning: skip values whose ν-quota is exhausted.
        if remaining[v - 1] == 0 {
            continue;
        }
        filling[cell_idx] = v;
        remaining[v - 1] -= 1;
        enumerate_ssyt_full(cells, lambda, mu, nu, filling, remaining,
                             cell_idx + 1, count);
        remaining[v - 1] += 1;
    }
}

/// Heap-allocated fallback for the ballot verification in
/// `enumerate_ssyt_full` when `nu.len() + 2 > MAX_PARTITION_PARTS`.
/// Functionally identical to the stack-array branch; kept separate so
/// the hot path stays allocation-free.
fn verify_ballot_heap(
    cells: &[(usize, usize)],
    lambda: &[usize],
    mu: &[usize],
    nu: &[usize],
    filling: &[usize],
    prefix_count: &mut [usize],
    count: &mut i64,
) {
    let _ = cells;
    let mut cell_ptr = 0usize;
    for i in 0..lambda.len() {
        let start = if i < mu.len() { mu[i] } else { 0 };
        let row_len = lambda[i] - start;
        for k in (0..row_len).rev() {
            let v = filling[cell_ptr + k];
            prefix_count[v] += 1;
            for kk in 1..nu.len() {
                if prefix_count[kk] < prefix_count[kk + 1] {
                    return;
                }
            }
        }
        cell_ptr += row_len;
    }
    *count += 1;
}

#[inline]
fn mu_at(mu: &[usize], i: usize) -> usize {
    if i < mu.len() { mu[i] } else { 0 }
}

#[inline]
fn find_cell_idx(cells: &[(usize, usize)], r: usize, c: usize) -> Option<usize> {
    cells.iter().position(|&(rr, cc)| rr == r && cc == c)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// LR coefficient of (λ, μ, ν) with μ = ν = ∅ and λ = ∅ is 1.
    #[test]
    fn lr_empty_partitions() {
        assert_eq!(lr_coefficient(&[], &[], &[]), 1);
    }

    /// `s_μ · s_∅ = s_μ`.  So c^μ_{μ, ∅} = 1.
    #[test]
    fn lr_with_empty_nu() {
        assert_eq!(lr_coefficient(&[3], &[3], &[]), 1);
        assert_eq!(lr_coefficient(&[2, 1], &[2, 1], &[]), 1);
    }

    /// `s_(1) · s_(1) = s_(2) + s_(1,1)`.
    /// So c^(2)_{(1),(1)} = c^(1,1)_{(1),(1)} = 1; others = 0.
    #[test]
    fn lr_pieri_simplest() {
        assert_eq!(lr_coefficient(&[2], &[1], &[1]), 1);
        assert_eq!(lr_coefficient(&[1, 1], &[1], &[1]), 1);
        assert_eq!(lr_coefficient(&[3], &[1], &[1]), 0);  // wrong size
    }

    /// `s_(2) · s_(1) = s_(3) + s_(2,1)`.
    /// `s_(1,1) · s_(1) = s_(2,1) + s_(1,1,1)`.
    #[test]
    fn lr_pieri_size_3() {
        assert_eq!(lr_coefficient(&[3], &[2], &[1]), 1);
        assert_eq!(lr_coefficient(&[2, 1], &[2], &[1]), 1);
        assert_eq!(lr_coefficient(&[1, 1, 1], &[2], &[1]), 0);
        assert_eq!(lr_coefficient(&[2, 1], &[1, 1], &[1]), 1);
        assert_eq!(lr_coefficient(&[1, 1, 1], &[1, 1], &[1]), 1);
    }

    /// `s_(2,1) · s_(1) = s_(3,1) + s_(2,2) + s_(2,1,1)`.
    #[test]
    fn lr_pieri_size_4() {
        assert_eq!(lr_coefficient(&[3, 1], &[2, 1], &[1]), 1);
        assert_eq!(lr_coefficient(&[2, 2], &[2, 1], &[1]), 1);
        assert_eq!(lr_coefficient(&[2, 1, 1], &[2, 1], &[1]), 1);
    }

    /// `s_(2) · s_(2) = s_(4) + s_(3,1) + s_(2,2)`.
    /// (Pieri rule: multiplying by s_(2) adds 2 cells in distinct columns.)
    #[test]
    fn lr_pieri_size_4_22() {
        assert_eq!(lr_coefficient(&[4], &[2], &[2]), 1);
        assert_eq!(lr_coefficient(&[3, 1], &[2], &[2]), 1);
        assert_eq!(lr_coefficient(&[2, 2], &[2], &[2]), 1);
        assert_eq!(lr_coefficient(&[2, 1, 1], &[2], &[2]), 0);
    }

    /// Symmetry: `c^λ_{μν} = c^λ_{νμ}`.
    #[test]
    fn lr_symmetry() {
        for (lam, mu, nu) in &[
            (vec![3, 1], vec![2, 1], vec![1]),
            (vec![2, 2], vec![2], vec![2]),
            (vec![3, 2, 1], vec![2, 1], vec![2, 1]),
        ] {
            assert_eq!(
                lr_coefficient(lam, mu, nu),
                lr_coefficient(lam, nu, mu),
                "λ={:?}, μ={:?}, ν={:?}", lam, mu, nu
            );
        }
    }
}
