//! Cross-level embedding consistency check (R4 of RUST_INTEGRATION.md).
//!
//! For a tower edge `parent ← {constituent_1, ..., constituent_k}`
//! the canonical embedding
//!
//!     π : H_{n_1}(q_0) ⊗ ... ⊗ H_{n_k}(q_0)  ↪  H_{n_parent}(q_0)
//!
//! must send T_w(constituents) to T_w(parent) inside the relevant
//! cosets.  At the level of Specht modules, restriction
//!
//!     S^λ |_{S_{n_1} × ... × S_{n_k}}  =
//!         ⊕_{μ_1 ⊢ n_1, ..., μ_k ⊢ n_k}  c^λ_{μ_1, ..., μ_k}
//!                                        · S^{μ_1} ⊠ ... ⊠ S^{μ_k}
//!
//! with multi-Littlewood-Richardson multiplicities.  This module
//! computes those multiplicities (via pairwise composition of
//! `lr_coefficient`) and emits the cross-level diagnostic.
//!
//! For Phase R4 PoC we check:
//!   (a) embedding-dimension consistency: n_parent = Σ_i n_i
//!   (b) per-partition restriction: d_λ = Σ_{μ-tuple} c^λ_{μ-tuple} · Π d_{μ_i}
//!
//! Trace-identity verification (check (c) in the design spec) requires
//! already-evaluated parent + constituent Wedderburn data and is left
//! as a separate `verify_trace_identity` function (called when
//! evaluator output for parent + constituents is available).

use crate::joint_tower_sdp_certificate::{CrossLevelEdge, JointTowerSdpCertificate};
use crate::littlewood_richardson::lr_coefficient;
use crate::seminormal::{partitions_of, standard_young_tableaux};

/// Specification for a tower edge.
pub struct TowerEdgeSpec<'a> {
    pub parent_name: &'a str,
    pub parent_n: usize,
    pub constituents: Vec<(&'a str, usize)>,
}

/// Multi-LR coefficient c^λ_{μ_1, ..., μ_k}.
///
/// Computed by left-associative composition of pairwise LR:
///   c^λ_{μ_1, μ_2, ..., μ_k}  =
///       Σ_{ν_2}  c^λ_{ν_2, μ_k}  ·  c^{ν_2}_{μ_1, ..., μ_{k-1}}
///
/// recursive folding from k = 2 outward.
pub fn multi_lr(lambda: &[usize], mus: &[Vec<usize>]) -> i64 {
    if mus.is_empty() {
        return if lambda.iter().all(|&x| x == 0) || lambda.is_empty() {
            1
        } else {
            0
        };
    }
    if mus.len() == 1 {
        return if lambda == mus[0].as_slice() { 1 } else { 0 };
    }
    if mus.len() == 2 {
        return lr_coefficient(lambda, &mus[0], &mus[1]);
    }
    // Fold: combine first k-1 into all possible ν, then LR(ν, μ_k).
    let n_first: usize = mus[..mus.len() - 1].iter().flatten().sum();
    let last_mu = mus.last().unwrap();
    let mut total = 0i64;
    for nu in partitions_of(n_first) {
        let head_count = multi_lr(&nu, &mus[..mus.len() - 1].to_vec());
        if head_count == 0 {
            continue;
        }
        let lr = lr_coefficient(lambda, &nu, last_mu);
        total += head_count * lr;
    }
    total
}

/// Dimension of S^λ = number of standard Young tableaux of shape λ.
fn d_lambda(shape: &[usize]) -> usize {
    if shape.is_empty() {
        return 1;
    }
    standard_young_tableaux(shape).len()
}

/// Enumerate all tuples of partitions (μ_1, ..., μ_k) with μ_i ⊢ n_i.
fn partition_tuples(ns: &[usize]) -> Vec<Vec<Vec<usize>>> {
    if ns.is_empty() {
        return vec![Vec::new()];
    }
    let head = partitions_of(ns[0]);
    let tails = partition_tuples(&ns[1..]);
    let mut out = Vec::new();
    for h in head {
        for t in &tails {
            let mut combined = vec![h.clone()];
            combined.extend(t.iter().cloned());
            out.push(combined);
        }
    }
    out
}

/// Verify cross-level embedding consistency for a tower edge.
///
/// Performs checks (a) and (b); returns one CrossLevelEdge per
/// parent partition λ summarizing the LR-decomposition.
pub fn verify_edge(spec: &TowerEdgeSpec) -> Vec<CrossLevelEdge> {
    let mut out = Vec::new();
    let n_parent = spec.parent_n;
    let n_constituents: usize = spec.constituents.iter().map(|(_, n)| *n).sum();
    // Check (a)
    let dim_match = n_parent == n_constituents;
    if !dim_match {
        out.push(CrossLevelEdge {
            parent: spec.parent_name.to_string(),
            constituent: format!(
                "{:?}",
                spec.constituents.iter().map(|(s, _)| *s).collect::<Vec<_>>()
            ),
            embedding_codomain_n_0: n_parent,
            embedding_domain_n_0: n_constituents,
            embedding_consistent: false,
            diagnostic: format!(
                "(a) DIM MISMATCH: n_parent = {}, Σn_i = {}",
                n_parent, n_constituents
            ),
        });
        return out;
    }

    let constituent_ns: Vec<usize> = spec.constituents.iter().map(|(_, n)| *n).collect();
    // Check (b): per-partition LR sum
    for lambda in partitions_of(n_parent) {
        let dim_lambda = d_lambda(&lambda);
        let mut lr_sum: i64 = 0;
        let mut tuple_terms: Vec<String> = Vec::new();
        for tuple in partition_tuples(&constituent_ns) {
            let c = multi_lr(&lambda, &tuple);
            if c == 0 {
                continue;
            }
            let prod_d: usize = tuple.iter().map(|m| d_lambda(m)).product();
            lr_sum += c * (prod_d as i64);
            tuple_terms.push(format!("{}·{:?}", c, tuple));
        }
        let consistent = lr_sum == dim_lambda as i64;
        let diagnostic = format!(
            "λ={:?}, d_λ={}, Σ c·Πd_μ = {}  [{}]",
            lambda,
            dim_lambda,
            lr_sum,
            tuple_terms.join(" + ")
        );
        out.push(CrossLevelEdge {
            parent: spec.parent_name.to_string(),
            constituent: format!(
                "{:?}",
                spec.constituents.iter().map(|(s, _)| *s).collect::<Vec<_>>()
            ),
            embedding_codomain_n_0: n_parent,
            embedding_domain_n_0: n_constituents,
            embedding_consistent: consistent,
            diagnostic,
        });
    }
    out
}

/// Trace-identity check: for each parent partition λ, verify
///
///     tr(ρ_λ(T_w_parent))  =  Σ_{μ-tuple}  c^λ_{μ-tuple}
///                              · Π_i tr(ρ_{μ_i}(T_w_{c_i}))
///
/// using already-computed Wedderburn data on parent + constituents.
/// Currently a stub — the matrix product → trace requires populating
/// the per-block full matrix (not just eigenvalues).  Included as
/// API placeholder.
pub fn verify_trace_identity(
    _parent_cert: &JointTowerSdpCertificate,
    _constituent_certs: &[&JointTowerSdpCertificate],
) -> Result<Vec<CrossLevelEdge>, String> {
    Err("trace-identity verification deferred (need ρ_λ matrix data, not just eigenvalues)"
        .to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nucleon_from_3_quarks() {
        // n_parent = 3, constituents = 3 × (n=1).
        // Each quark partition is just (1) with d=1.
        // Multi-LR c^λ_{(1)(1)(1)} = number of SYT of shape λ.
        let edges = verify_edge(&TowerEdgeSpec {
            parent_name: "nucleon",
            parent_n: 3,
            constituents: vec![("quark", 1), ("quark", 1), ("quark", 1)],
        });
        // Expect 3 edges (one per partition of 3): (3), (2,1), (1,1,1)
        assert_eq!(edges.len(), 3);
        for e in &edges {
            assert!(
                e.embedding_consistent,
                "edge {:?} inconsistent: {}",
                e.parent, e.diagnostic
            );
        }
    }

    #[test]
    fn helium4_from_4_nucleons() {
        // Tower edge ⁴He ← 4⊗nucleon: each nucleon has n=3, parent n=12.
        // Partitions of 12 are numerous (77); LR multinomial check
        // verifies dim(S^λ) = sum over (μ_1, μ_2, μ_3, μ_4) of
        // products of c^λ_{...} · Π d_{μ_i}.
        let edges = verify_edge(&TowerEdgeSpec {
            parent_name: "4He",
            parent_n: 12,
            constituents: vec![
                ("nucleon", 3),
                ("nucleon", 3),
                ("nucleon", 3),
                ("nucleon", 3),
            ],
        });
        assert_eq!(edges.len(), partitions_of(12).len()); // 77
        // All consistent (LR identity is a theorem).
        for e in &edges {
            assert!(
                e.embedding_consistent,
                "edge for {:?} inconsistent: {}",
                e.parent, e.diagnostic
            );
        }
    }
}
