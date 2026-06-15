//! Joint-tower SDP certificate format.
//!
//! Production-scale Rust analogue of the design-spec certificate
//! emitted by the Python proof-of-concept
//! [`gb_filtration_jet_tracker.py`](../../../folio-assistant/computations/gb_filtration_jet_tracker.py).
//!
//! Schema: matches `gb-filtration-jet-order.witness.json` (Python PoC)
//! and `joint-tower-sdp-h3.witness.json` / `joint-tower-sdp-h6-h9.witness.json`
//! (Python solver outputs).  The Rust extension lets us scale to
//! H_18 (⁶Li), H_21 (⁷Li), and α-cluster atoms (⁸Be → ⁴⁰Ca) where
//! the Python implementation does not.
//!
//! See [RUST_INTEGRATION.md](../../RUST_INTEGRATION.md) §"Phase R1".

use serde::Serialize;
use std::collections::BTreeMap;

/// One reduction event in the jet-order log.  Matches the Python
/// `JetEvent` dataclass.
#[derive(Serialize, Clone, Debug)]
pub struct JetEvent {
    pub step: u64,
    pub multiplier: i32,
    pub predecessor: Vec<usize>,
    pub successor: Vec<usize>,
    pub filtration_before: u32,
    pub filtration_after: u32,
    /// "ascending" | "hecke-quadratic"
    pub relation: String,
    /// SymPy-equivalent coefficient mutation, stored as a string.
    pub coefficient_change: String,
}

/// One basis element T_w with its symbolic-q coefficient at a given
/// filtration grade.
#[derive(Serialize, Clone, Debug)]
pub struct FiltrationTerm {
    /// Permutation tuple (1-based) representing w ∈ S_n.
    pub perm: Vec<usize>,
    /// Canonical reduced word in σ-generators (1-based).
    pub canonical_word: Vec<u32>,
    /// Coefficient as a string (rational function in q for now;
    /// SparsePoly Laurent later).
    pub coefficient_in_q: String,
}

/// Full GB-filtration certificate at one Hecke element.
/// Maps grade → list of (perm, canonical_word, coefficient).
#[derive(Serialize, Clone, Debug, Default)]
pub struct FiltrationCertificate {
    pub by_grade: BTreeMap<u32, Vec<FiltrationTerm>>,
    pub shape: BTreeMap<u32, usize>,
    pub max_grade: u32,
}

/// Per-Wedderburn-block PSD report (R3 — populated by
/// `wedderburn_psd::evaluate`).  Empty when block evaluation
/// is deferred.
#[derive(Serialize, Clone, Debug, Default)]
pub struct WedderburnBlockReport {
    pub partition: Vec<usize>,
    pub d_lambda: usize,
    pub matrix_at_q_0_sym_eigvals: Vec<f64>,
    pub min_eigenvalue: f64,
    pub max_eigenvalue: f64,
    pub psd_symmetric_part: bool,
}

/// Cross-level consistency edge for tower embeddings (R4 —
/// populated by `cross_level_embedding::verify`).
#[derive(Serialize, Clone, Debug)]
pub struct CrossLevelEdge {
    pub parent: String,
    pub constituent: String,
    pub embedding_codomain_n_0: usize,
    pub embedding_domain_n_0: usize,
    pub embedding_consistent: bool,
    pub diagnostic: String,
}

/// Methodology classification matching `methodology-deprecation.witness.json`.
#[derive(Serialize, Clone, Debug)]
pub enum Methodology {
    #[serde(rename = "principled-derivation")]
    PrincipledDerivation,
    #[serde(rename = "principled-gb-nf")]
    PrincipledGbNf,
    #[serde(rename = "manual-historical-volume-match")]
    ManualHistoricalVolumeMatch,
    #[serde(rename = "magic-A-formula")]
    MagicAFormula,
    #[serde(rename = "recursive-on-4He")]
    RecursiveOn4He,
    #[serde(rename = "deprecated-volume-match")]
    DeprecatedVolumeMatch,
}

/// Per-atom output of the joint-tower SDP solver.
#[derive(Serialize, Clone, Debug)]
pub struct JointTowerSdpCertificate {
    pub name: String,
    pub atomic_n_0: usize,
    pub native_strand_count: usize,
    pub braid_word: Vec<i32>,

    pub filtration_certificate: FiltrationCertificate,
    pub jet_log: Vec<JetEvent>,
    pub n_steps: u64,
    pub n_hecke_relations_fired: u64,

    /// R3 output — empty if Wedderburn PSD evaluation is deferred.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub wedderburn_blocks: Vec<WedderburnBlockReport>,

    /// R4 output — empty if cross-level checks not run.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub cross_level_edges: Vec<CrossLevelEdge>,

    /// R5-minimal output: PSD-cone α* and gap.  None if not computed.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub psd_cone_alpha_star: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub psd_cone_gap: Option<f64>,

    pub rho_factor: u32,
    /// MeV (when computed).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b_pred_mev: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b_ame_mev: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub err_ppb: Option<i64>,

    pub methodology: Methodology,
}

/// Top-level witness file: matches the Python output schema.
#[derive(Serialize, Clone, Debug)]
pub struct JointTowerSdpWitness {
    pub computation: String,
    #[serde(rename = "computedAt")]
    pub computed_at: String,
    pub description: String,
    pub design_spec: String,
    pub consumed_by: String,
    pub phase: String,
    pub engine: EngineMetadata,
    pub q_0_numeric: f64,
    pub per_atom_certificates: Vec<JointTowerSdpCertificate>,
    pub summary: WitnessSummary,
}

#[derive(Serialize, Clone, Debug)]
pub struct EngineMetadata {
    pub name: String,
    pub version: String,
    pub language: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct WitnessSummary {
    pub n_atoms: usize,
    pub max_grade_observed: u32,
    pub total_jet_steps: u64,
    pub total_hecke_relations_fired: u64,
    pub max_native_strand_count: usize,
}
