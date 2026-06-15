//! Joint mass-tower SDP — Rust binary.
//!
//! Runs the GB-NF reducer on a registry of confined particles and
//! emits the design-spec joint-tower-SDP certificate as JSON.
//!
//! Output schema matches the Python prototype:
//!   - folio-assistant/computations/joint-tower-sdp-h3.witness.json
//!   - folio-assistant/computations/joint-tower-sdp-h6-h9.witness.json
//!
//! Usage:
//!   cargo run --release --bin joint-tower-sdp [-- --output path.json]
//!
//! See [RUST_INTEGRATION.md](../../RUST_INTEGRATION.md) §"Phase R6".

use chrono::Utc;
use clap::Parser;
use hecke_engine::cross_level_embedding::{verify_edge, TowerEdgeSpec};
use hecke_engine::gb_nf_reducer::{BraidLetter, HeckeElement};
use hecke_engine::joint_tower_sdp_certificate as cert;
use hecke_engine::sdp_verifier::{solve_alpha_psd, solve_alpha_psd_letters};
use hecke_engine::wedderburn_psd::{
    evaluate_all_blocks, evaluate_all_blocks_letters_capped,
};
use std::fs;
use std::path::PathBuf;

#[derive(Parser)]
struct Args {
    /// Output JSON path.
    #[arg(short, long, default_value = "joint-tower-sdp-rust.witness.json")]
    output: PathBuf,

    /// Filter: only run atoms with native strand count <= this.
    #[arg(long)]
    max_n: Option<usize>,

    /// q_0 substrate parameter (numerical) for Wedderburn-block PSD evaluation.
    #[arg(long, default_value_t = 1.1097)]
    q0: f64,

    /// Skip Wedderburn-block PSD evaluation (faster).
    #[arg(long)]
    no_psd: bool,

    /// Maximum partition dimension `d_λ` to include in Wedderburn-block
    /// PSD evaluation. Partitions with `d_λ > max_dim_psd` are skipped
    /// (cost is O(d_λ³ · |braid|); largest ⁴He block has d_(6,3,2,1) ≈ 5775,
    /// making H_12 PSD intractable without this cap). Default 500 covers
    /// all blocks through ³He and most of ⁴He's smaller blocks; raise
    /// for full ⁴He coverage at significant compute cost.
    #[arg(long, default_value_t = 500)]
    max_dim_psd: usize,
}

/// Braid representation: either a simple integer letter sequence
/// (legacy registry entries, σ_i^±1 only) or an extended BraidLetter
/// sequence (atom-canonical: σ_i, σ_i^{-1}, σ_avg).
#[derive(Clone, Debug)]
enum BraidRep {
    Letters(Vec<i32>),
    Extended(Vec<BraidLetter>),
}

impl BraidRep {
    /// Convert to BraidLetter for unified processing.
    fn to_letters(&self) -> Vec<BraidLetter> {
        match self {
            BraidRep::Letters(w) => w
                .iter()
                .filter_map(|&i| {
                    if i > 0 {
                        Some(BraidLetter::Pos(i as usize))
                    } else if i < 0 {
                        Some(BraidLetter::Inv((-i) as usize))
                    } else {
                        None
                    }
                })
                .collect(),
            BraidRep::Extended(w) => w.clone(),
        }
    }

    /// Serialize as i32-style for backward-compatible witness output.
    /// Pos(i) → +i, Inv(i) → -i, Avg(i) → +1000+i (sentinel).
    fn to_i32_for_serialize(&self) -> Vec<i32> {
        match self {
            BraidRep::Letters(w) => w.clone(),
            BraidRep::Extended(w) => w
                .iter()
                .map(|&l| match l {
                    BraidLetter::Pos(i) => i as i32,
                    BraidLetter::Inv(i) => -(i as i32),
                    BraidLetter::Avg(i) => 1000 + (i as i32),
                })
                .collect(),
        }
    }
}

#[derive(Clone, Debug)]
struct RegistryEntry {
    name: &'static str,
    atomic_n_0: usize,
    native_strand_count: usize,
    braid: BraidRep,
    rho_factor: u32,
    methodology: cert::Methodology,
    b_ame_mev: Option<f64>,
}

fn registry() -> Vec<RegistryEntry> {
    use BraidLetter::*;
    vec![
        // ─── ℓ = 0  fundamental ────────────────────────────────
        RegistryEntry {
            name: "quark",
            atomic_n_0: 1,
            native_strand_count: 1,
            braid: BraidRep::Letters(vec![]),
            rho_factor: 0,
            methodology: cert::Methodology::PrincipledGbNf,
            b_ame_mev: None,
        },
        RegistryEntry {
            name: "electron",
            atomic_n_0: 2,
            native_strand_count: 2,
            braid: BraidRep::Letters(vec![1, 1, 1]),
            rho_factor: 1,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(0.51099895),
        },
        // ─── ℓ = 1  nucleon ────────────────────────────────────
        RegistryEntry {
            name: "proton",
            atomic_n_0: 3,
            native_strand_count: 3,
            braid: BraidRep::Letters(vec![1, -2, 1, -2, 1, -2]),
            rho_factor: 1,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(938.272),
        },
        RegistryEntry {
            name: "neutron",
            atomic_n_0: 3,
            native_strand_count: 3,
            braid: BraidRep::Letters(vec![1, -2, 1, -2, 1, -2]),
            rho_factor: 1,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(939.565),
        },
        // ─── ℓ = 2  light atoms (historical knot IDs) ──────────
        RegistryEntry {
            name: "deuteron-2H",
            atomic_n_0: 6,
            native_strand_count: 3, // 6_2 in B_3
            braid: BraidRep::Letters(vec![1, -2, 1, 1, 1, -2]),
            rho_factor: 1,
            methodology: cert::Methodology::ManualHistoricalVolumeMatch,
            b_ame_mev: Some(2.2246),
        },
        RegistryEntry {
            name: "tritium-3H",
            atomic_n_0: 9,
            native_strand_count: 5, // 8_11 in B_5
            braid: BraidRep::Letters(vec![
                -1, 2, -3, 2, 1, -3, -3, 4, -3, -2, -3, -4, -3, 2,
            ]),
            rho_factor: 2,
            methodology: cert::Methodology::ManualHistoricalVolumeMatch,
            b_ame_mev: Some(8.4818),
        },
        RegistryEntry {
            name: "helium3-3He",
            atomic_n_0: 9,
            native_strand_count: 3, // L6a4 in B_3
            braid: BraidRep::Letters(vec![-1, 2, -1, 2, -1, 2]),
            rho_factor: 2,
            methodology: cert::Methodology::ManualHistoricalVolumeMatch,
            b_ame_mev: Some(7.7180),
        },
        // ─── canonical atom-braid recipe — D, T, ³He via atom_braid_word_3A ─
        //
        // These supplement the historical-knot-ID entries above with the
        // CANONICAL atomic-braid recipe (`mass_at_3A_proper.atom_braid_word_3A`)
        // for cross-validation of the "C(3A-2, k) filtration-shape" conjecture
        // — see commit msg of the ⁴He entry. Test predictions:
        //   D (A=2):   23 crossings on B_6,  shape C(4, k),  total 2⁴ = 16
        //   T (A=3):   35 crossings on B_9,  shape C(7, k),  total 2⁷ = 128
        //   ³He (A=3): 35 crossings on B_9,  shape C(7, k),  total 2⁷ = 128
        //   ⁴He (A=4): 47 crossings on B_12, shape C(10, k), total 2¹⁰ = 1024 ✓
        RegistryEntry {
            name: "deuteron-canonical-3A",
            atomic_n_0: 6,
            native_strand_count: 6,
            braid: BraidRep::Extended(vec![
                Pos(1), Pos(1), Pos(1), Pos(1), Avg(1), Pos(1), Pos(1),
                Inv(2), Inv(2), Inv(2), Avg(2),
                Avg(3),
                Pos(4), Pos(4), Pos(4), Avg(4), Avg(4), Pos(4), Pos(4),
                Inv(5), Inv(5), Inv(5), Inv(5),
            ]),
            rho_factor: 1,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(2.2246),
        },
        RegistryEntry {
            name: "tritium-canonical-3A",
            atomic_n_0: 9,
            native_strand_count: 9,
            braid: BraidRep::Extended(vec![
                Pos(1), Pos(1), Pos(1), Pos(1), Avg(1), Pos(1), Pos(1),
                Inv(2), Inv(2), Inv(2), Avg(2),
                Avg(3),
                Pos(4), Pos(4), Pos(4), Avg(4), Avg(4), Pos(4), Pos(4),
                Inv(5), Inv(5), Inv(5), Inv(5),
                Inv(6),
                Pos(7), Pos(7), Pos(7), Avg(7), Avg(7), Pos(7), Pos(7),
                Inv(8), Inv(8), Inv(8), Inv(8),
            ]),
            rho_factor: 2,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(8.4818),
        },
        RegistryEntry {
            name: "helium3-canonical-3A",
            atomic_n_0: 9,
            native_strand_count: 9,
            braid: BraidRep::Extended(vec![
                Pos(1), Pos(1), Pos(1), Pos(1), Avg(1), Pos(1), Pos(1),
                Inv(2), Inv(2), Inv(2), Avg(2),
                Pos(3),
                Pos(4), Pos(4), Pos(4), Pos(4), Avg(4), Pos(4), Pos(4),
                Inv(5), Inv(5), Inv(5), Avg(5),
                Avg(6),
                Pos(7), Pos(7), Pos(7), Avg(7), Avg(7), Pos(7), Pos(7),
                Inv(8), Inv(8), Inv(8), Inv(8),
            ]),
            rho_factor: 2,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(7.7180),
        },
        // ─── ℓ = 3  helium-4 (canonical atom_braid_word_3A(2,2)) ─
        //
        // 47-crossing braid on B_12 from
        // `folio-assistant/computations/mass_at_3A_proper.py::atom_braid_word_3A(2, 2)`:
        // 23 positive (σ_k), 9 averaged (σ_avg_k = σ_k − h/2),
        // 15 negative (σ_k^{-1} = σ_k − h). Native strand count = 12
        // (atomic n_0 = 3·A = 3·4 = 12).
        //
        // This is the FIRST registry entry using BraidRep::Extended
        // to support σ_avg — without the BraidLetter::Avg infrastructure
        // (added to gb_nf_reducer.rs alongside this entry), R5-full SDP
        // certification of ⁴He was blocked because 9 of 47 crossings
        // (19%) couldn't be represented as σ_k^±1 letters alone.
        RegistryEntry {
            name: "helium4-4He",
            atomic_n_0: 12,
            native_strand_count: 12, // B_12: σ_1..σ_11
            braid: BraidRep::Extended(vec![
                Pos(1), Pos(1), Pos(1), Pos(1), Avg(1), Pos(1), Pos(1),
                Inv(2), Inv(2), Inv(2), Avg(2),
                Pos(3),
                Pos(4), Pos(4), Pos(4), Pos(4), Avg(4), Pos(4), Pos(4),
                Inv(5), Inv(5), Inv(5), Avg(5),
                Avg(6),
                Pos(7), Pos(7), Pos(7), Avg(7), Avg(7), Pos(7), Pos(7),
                Inv(8), Inv(8), Inv(8), Inv(8),
                Inv(9),
                Pos(10), Pos(10), Pos(10), Avg(10), Avg(10), Pos(10), Pos(10),
                Inv(11), Inv(11), Inv(11), Inv(11),
            ]),
            rho_factor: 4,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(28.2957),
        },
        // ─── ℓ = 4  lithium-6 (canonical atom_braid_word_3A(3,3)) ─
        //
        // 71-crossing braid on B_18 from
        // `atom_braid_word_3A(3, 3)`:  35 Pos + 23 Inv + 13 Avg
        // crossings, native strand count = 18 (atomic n_0 = 3·A = 3·6).
        //
        // Tests the RECTANGULAR-FORM CONJECTURE from the dominant-
        // partition audit (2026-05-25): if the conjecture holds, the
        // dominant Wedderburn partition forcing α* for ⁶Li should be
        // (6, 6, 6) with transpose (3, 3, 3, 3, 3, 3) = 6 nucleons × 3
        // strands per nucleon (Schur-Weyl rectangular shape).
        //
        // p(18) = 385 partitions; with --max-dim-psd 500 the bulk of
        // large-d_λ blocks are skipped, but the rectangular (6,6,6)
        // has d_λ ~ small enough to be evaluated. If the rectangle
        // conjecture holds the dominant partition (smallest α* / most-
        // negative min_eig) should be the d=… (6,6,6) block.
        RegistryEntry {
            name: "lithium6-canonical-3A",
            atomic_n_0: 18,
            native_strand_count: 18, // B_18: σ_1..σ_17
            braid: BraidRep::Extended(vec![
                Pos(1), Pos(1), Pos(1), Pos(1), Avg(1), Pos(1),
                Pos(1), Inv(2), Inv(2), Inv(2), Avg(2), Pos(3),
                Pos(4), Pos(4), Pos(4), Pos(4), Avg(4), Pos(4),
                Pos(4), Inv(5), Inv(5), Inv(5), Avg(5), Pos(6),
                Pos(7), Pos(7), Pos(7), Pos(7), Avg(7), Pos(7),
                Pos(7), Inv(8), Inv(8), Inv(8), Avg(8), Avg(9),
                Pos(10), Pos(10), Pos(10), Avg(10), Avg(10), Pos(10),
                Pos(10), Inv(11), Inv(11), Inv(11), Inv(11), Inv(12),
                Pos(13), Pos(13), Pos(13), Avg(13), Avg(13), Pos(13),
                Pos(13), Inv(14), Inv(14), Inv(14), Inv(14), Inv(15),
                Pos(16), Pos(16), Pos(16), Avg(16), Avg(16), Pos(16),
                Pos(16), Inv(17), Inv(17), Inv(17), Inv(17),
            ]),
            rho_factor: 6,
            methodology: cert::Methodology::PrincipledDerivation,
            b_ame_mev: Some(31.99405),
        },
    ]
}

fn solve_per_atom(
    entry: &RegistryEntry,
    q0: f64,
    do_psd: bool,
    max_dim_psd: usize,
) -> cert::JointTowerSdpCertificate {
    let n = entry.native_strand_count.max(1);
    let letters = entry.braid.to_letters();
    let e = HeckeElement::reduce_braid_letters(n, &letters);
    let filt = e.filtration_certificate();
    let n_steps = e.jet_log.len() as u64;
    let n_hecke = e
        .jet_log
        .iter()
        .filter(|ev| ev.relation == "hecke-quadratic")
        .count() as u64;

    // Wedderburn-block PSD evaluation: legacy i32 letters use
    // evaluate_all_blocks; Extended (BraidLetter) braids use the
    // new evaluate_all_blocks_letters (R5.7 — handles σ_avg by
    // multiplying by `g - h/2 · I` instead of `g` or `g_inv`).
    let wedderburn = if do_psd && n >= 2 {
        match &entry.braid {
            BraidRep::Letters(w) if !w.is_empty() => {
                // Note: legacy evaluate_all_blocks doesn't yet support max_dim;
                // small atoms (n ≤ 5) only — max-dim filtering not needed
                evaluate_all_blocks(n, w, q0)
            }
            BraidRep::Extended(w) if !w.is_empty() => {
                evaluate_all_blocks_letters_capped(n, w, q0, max_dim_psd)
            }
            _ => Vec::new(),
        }
    } else {
        Vec::new()
    };

    cert::JointTowerSdpCertificate {
        name: entry.name.to_string(),
        atomic_n_0: entry.atomic_n_0,
        native_strand_count: entry.native_strand_count,
        braid_word: entry.braid.to_i32_for_serialize(),
        filtration_certificate: filt,
        jet_log: e.jet_log,
        n_steps,
        n_hecke_relations_fired: n_hecke,
        wedderburn_blocks: wedderburn,
        cross_level_edges: Vec::new(),
        psd_cone_alpha_star: None,
        psd_cone_gap: None,
        rho_factor: entry.rho_factor,
        b_pred_mev: None,
        b_ame_mev: entry.b_ame_mev,
        err_ppb: None,
        methodology: entry.methodology.clone(),
    }
}

/// Tower edges enumerated from the design spec
/// (prop:joint-tower-sdp-confinement §"Output").
fn tower_edges() -> Vec<TowerEdgeSpec<'static>> {
    vec![
        // ── ℓ ≤ 1 ────────────────────────────────────────────────
        TowerEdgeSpec {
            parent_name: "proton",
            parent_n: 3,
            constituents: vec![("quark", 1), ("quark", 1), ("quark", 1)],
        },
        TowerEdgeSpec {
            parent_name: "neutron",
            parent_n: 3,
            constituents: vec![("quark", 1), ("quark", 1), ("quark", 1)],
        },
        // ── ℓ = 2 ────────────────────────────────────────────────
        // Atomic n_0 = 3·A; the parent_n in this verifier matches the
        // *native* H_n of the historical knot braid (B_3 for 6_2,
        // L6a4; B_5 for 8_11).  The full atomic embedding 3⊗nucleon
        // → atomic-n_0 lives at the larger H_{3A} and is wired in
        // when the joint-tower SDP solver lands (R5).
    ]
}

fn main() {
    let args = Args::parse();
    let reg = registry();

    let mut certs: Vec<cert::JointTowerSdpCertificate> = Vec::new();
    let mut max_n_observed = 0usize;
    let mut total_jet = 0u64;
    let mut total_hecke = 0u64;
    let mut max_grade_observed = 0u32;

    println!(
        "══════════════════════════════════════════════════════════════════════"
    );
    println!("  Joint mass-tower SDP — Rust binary (R1+R2+R3+R4+R6)");
    println!(
        "══════════════════════════════════════════════════════════════════════"
    );

    for entry in &reg {
        if let Some(max_n) = args.max_n {
            if entry.native_strand_count > max_n {
                continue;
            }
        }
        println!(
            "\n──── {} (atomic n_0 = {}, native B_{}) ────",
            entry.name, entry.atomic_n_0, entry.native_strand_count
        );
        println!("  braid: {:?}", entry.braid);
        let cert = solve_per_atom(entry, args.q0, !args.no_psd, args.max_dim_psd);
        println!("  filtration shape: {:?}", cert.filtration_certificate.shape);
        println!(
            "  max grade: {}, jet steps: {}, Hecke fires: {}",
            cert.filtration_certificate.max_grade, cert.n_steps, cert.n_hecke_relations_fired
        );
        if !cert.wedderburn_blocks.is_empty() {
            let n_blocks = cert.wedderburn_blocks.len();
            let n_psd = cert
                .wedderburn_blocks
                .iter()
                .filter(|b| b.psd_symmetric_part)
                .count();
            let min_eig = cert
                .wedderburn_blocks
                .iter()
                .map(|b| b.min_eigenvalue)
                .fold(f64::INFINITY, f64::min);
            println!(
                "  Wedderburn blocks: {}/{} PSD, global min eigenvalue {:+.4e}",
                n_psd, n_blocks, min_eig
            );
            for b in &cert.wedderburn_blocks {
                let flag = if b.psd_symmetric_part { "PSD" } else { "NOT PSD" };
                println!(
                    "    λ={:?} (d_λ={}): eigs ∈ [{:+.4e}, {:+.4e}]  {}",
                    b.partition, b.d_lambda, b.min_eigenvalue, b.max_eigenvalue, flag
                );
            }
        }
        max_n_observed = max_n_observed.max(entry.native_strand_count);
        total_jet += cert.n_steps;
        total_hecke += cert.n_hecke_relations_fired;
        max_grade_observed = max_grade_observed.max(cert.filtration_certificate.max_grade);
        certs.push(cert);
    }

    // ─── R5-minimal: PSD-cone α* verifier ─────────────────────────
    if !args.no_psd {
        println!(
            "\n══════════════════════════════════════════════════════════════════════"
        );
        println!("  R5-minimal — PSD-cone α* (bisection on α; equiv. SDP value)");
        println!(
            "══════════════════════════════════════════════════════════════════════"
        );
        for (i, entry) in reg.iter().enumerate() {
            if let Some(max_n) = args.max_n {
                if entry.native_strand_count > max_n {
                    continue;
                }
            }
            let n = entry.native_strand_count.max(1);
            if n < 2 {
                continue;
            }
            // PSD α-solver: dispatch on braid representation.
            // Letters → solve_alpha_psd (existing)
            // Extended → solve_alpha_psd_letters (R5.7-α extension)
            let report = match &entry.braid {
                BraidRep::Letters(w) => solve_alpha_psd(n, w, args.q0),
                BraidRep::Extended(w) => {
                    solve_alpha_psd_letters(n, w, args.q0, args.max_dim_psd)
                }
            };
            println!(
                "  {}: α* = {:.10}, gap = {:.4e}, min_eig at α* = {:+.4e}, iters = {}",
                entry.name,
                report.alpha_star,
                1.0 - report.alpha_star,
                report.min_eigenvalue_at_alpha_star,
                report.iterations
            );
            // attach to cert
            if let Some(c) = certs.get_mut(i) {
                c.psd_cone_alpha_star = Some(report.alpha_star);
                c.psd_cone_gap = Some(1.0 - report.alpha_star);
            }
        }
    }

    // ─── R4: Cross-level edge verification ────────────────────────
    println!(
        "\n══════════════════════════════════════════════════════════════════════"
    );
    println!("  R4 — Cross-level embedding (multi-LR consistency)");
    println!(
        "══════════════════════════════════════════════════════════════════════"
    );
    let edges_by_parent = tower_edges();
    for spec in &edges_by_parent {
        let constituent_names: Vec<&str> = spec.constituents.iter().map(|(s, _)| *s).collect();
        println!(
            "\n──── {} (n_0 = {}) ← {:?} ────",
            spec.parent_name, spec.parent_n, constituent_names
        );
        let edges = verify_edge(spec);
        let n_consistent = edges.iter().filter(|e| e.embedding_consistent).count();
        println!(
            "  {}/{} per-partition LR-decompositions consistent",
            n_consistent,
            edges.len()
        );
        for e in &edges {
            println!("    {}", e.diagnostic);
        }
        // Attach edges to the parent's certificate
        for c in certs.iter_mut() {
            if c.name == spec.parent_name {
                c.cross_level_edges = edges;
                break;
            }
        }
    }

    let witness = cert::JointTowerSdpWitness {
        computation: "joint-tower-sdp-rust".to_string(),
        computed_at: Utc::now().to_rfc3339(),
        description:
            "Rust port of joint-tower SDP certificate emitter. Runs GB-NF reduction \
             on the confined-particle registry, emits design-spec certificate \
             (filtration + jet-order log per atom). Phases R1+R2+R6 of \
             RUST_INTEGRATION.md; R3 (Wedderburn PSD) and R5 (SDP solver) deferred."
                .to_string(),
        design_spec: "prop:joint-tower-sdp-confinement".to_string(),
        consumed_by: "prop:atom-knot-mass-derivation".to_string(),
        phase: "rust-r1-r2-r3-r4-r5min-r6".to_string(),
        engine: cert::EngineMetadata {
            name: "hecke-engine".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            language: "rust".to_string(),
        },
        q_0_numeric: 1.1097,
        per_atom_certificates: certs,
        summary: cert::WitnessSummary {
            n_atoms: reg.len(),
            max_grade_observed,
            total_jet_steps: total_jet,
            total_hecke_relations_fired: total_hecke,
            max_native_strand_count: max_n_observed,
        },
    };

    let json = serde_json::to_string_pretty(&witness).expect("serialize");
    fs::write(&args.output, json).expect("write output");
    println!("\n→ wrote {}", args.output.display());
    println!(
        "  atoms: {}, max grade: {}, total jet steps: {}, total Hecke fires: {}",
        witness.summary.n_atoms,
        witness.summary.max_grade_observed,
        witness.summary.total_jet_steps,
        witness.summary.total_hecke_relations_fired,
    );
}
