// Compile-time guards on incompatible Clarabel-feature combinations.
//
// The upstream Clarabel-rs SDP path defines `MaybeBlasFloatT: Copy`
// under `cfg(feature = "sdp")` (src/algebra/floats.rs:111).  Neither
// `RationalReal` (bigrational backend) nor `MpfrFloat` (mpfr backend)
// is `Copy` — they wrap heap-allocated arbitrary-precision values.
// Enabling `sdp + bigrational` or `sdp + mpfr` together would
// fail to compile inside Clarabel itself with a generic-bound error.
// Surface the conflict here with a clear message instead of letting
// downstream consumers hit the inscrutable Copy-bound failure.
#[cfg(all(feature = "clarabel-sdp", feature = "clarabel-bigrational"))]
compile_error!(
    "clarabel-sdp and clarabel-bigrational are mutually exclusive: \
     upstream Clarabel-rs requires MaybeBlasFloatT: Copy under cfg(sdp), \
     and BigRational is not Copy.  Pick one feature or the other."
);
#[cfg(all(feature = "clarabel-sdp", feature = "clarabel-mpfr"))]
compile_error!(
    "clarabel-sdp and clarabel-mpfr are mutually exclusive: \
     upstream Clarabel-rs requires MaybeBlasFloatT: Copy under cfg(sdp), \
     and MpfrFloat is not Copy.  Use clarabel-sdp + the f64 path \
     plus per-block MPFR-precision constraint preparation \
     (CLARABEL_PRECISION_PLAN.md §S4-MPFR), or clarabel-mpfr alone \
     for LP/QP/SOCP-only problems."
);
#[cfg(all(feature = "clarabel-bigrational", feature = "clarabel-mpfr"))]
compile_error!(
    "clarabel-bigrational and clarabel-mpfr cannot both be enabled: \
     each provides its own concrete scalar type via the same upstream \
     `T` parameter — pick one backend."
);

// The mpfr feature (default on) controls the transitive rug-dependent
// surface. Two tiers:
//
//   Tier A — `use rug` at module top: dense_la_mpfr, seminormal_mpfr,
//            tr_m_atomic_mpfr, sdp_clarabel_mpfr_prep.
//   Tier B — `use rug` in inner functions: laurent_poly_q,
//            laurent_rational_q, precision_scalar, geck_pfeiffer.
//   Tier C — transitive via Tier A/B imports: laurent_hecke_element
//            (←laurent_rational_q), reduce_laurent (←laurent_rational_q),
//            seminormal_mn (←laurent_poly_q), tr_m_word_lq
//            (←laurent_poly_q), wenzl_lr (←laurent_poly_q +
//            seminormal_mpfr), atomic_reduce_cache (←laurent_hecke_element).
//
// Together this is the "mpfr cone". Disabling `mpfr` carves out the
// pure-Rust canonical surface for WASM: certificate, cross_level_embedding,
// gb_nf_reducer, gram, joint_tower_sdp_certificate, littlewood_richardson,
// rational_round, sdp_verifier, seminormal, sturm_psd, wedderburn_psd
// — ~3 500 LOC of WASM-targetable compute.

pub mod certificate;
pub mod cross_level_embedding;
#[cfg(feature = "mpfr")]
pub mod dense_la_mpfr;
pub mod gb_nf_reducer;
#[cfg(feature = "mpfr")]
pub mod geck_pfeiffer;
pub mod gram;
pub mod joint_tower_sdp_certificate;
#[cfg(feature = "mpfr")]
pub mod laurent_hecke_element;
#[cfg(feature = "mpfr")]
pub mod laurent_poly_q;
#[cfg(feature = "mpfr")]
pub mod laurent_rational_q;
pub mod littlewood_richardson;
#[cfg(feature = "mpfr")]
pub mod precision_scalar;
pub mod rational_round;
#[cfg(feature = "mpfr")]
pub mod reduce_laurent;
// Clarabel-rs SDP backends are opt-in behind the `clarabel-sdp` feature.
// Default builds use only the bisection-based α* verifier (sdp_verifier),
// which works at any d without an external SDP solver.
//
// sdp_clarabel_mpfr_prep additionally requires `mpfr` because it uses
// `rug::Float` at module top — gating it on `clarabel-sdp` alone would
// fail to compile under `--features clarabel-sdp --no-default-features`.
// Per PR #1094 review (Copilot).
#[cfg(all(feature = "clarabel-sdp", feature = "mpfr"))]
pub mod sdp_clarabel_mpfr_prep;
#[cfg(feature = "clarabel-sdp")]
pub mod sdp_dual_certificate;
#[cfg(feature = "clarabel-sdp")]
pub mod sdp_per_block;
#[cfg(feature = "clarabel-sdp")]
pub mod sdp_recover_canonical;
#[cfg(feature = "clarabel-sdp")]
pub mod sdp_solve_canonical_t_w;
#[cfg(feature = "clarabel-sdp")]
pub mod sdp_solver_clarabel;
#[cfg(feature = "clarabel-mpfr")]
pub mod operator_selection_lp;
#[cfg(feature = "clarabel-sdp")]
pub mod operator_selection_sdp;
pub mod sdp_verifier;
pub mod seminormal;
#[cfg(feature = "mpfr")]
pub mod seminormal_mn;
#[cfg(feature = "mpfr")]
pub mod seminormal_mpfr;
#[cfg(feature = "mpfr")]
pub mod matrix_m_mpfr;
#[cfg(feature = "mpfr")]
pub mod atomic_reduce_cache;
pub mod sturm_psd;
#[cfg(feature = "mpfr")]
pub mod tr_m_atomic_mpfr;
#[cfg(feature = "mpfr")]
pub mod tr_m_word_lq;
pub mod wedderburn_psd;
#[cfg(feature = "mpfr")]
pub mod wenzl_lr;
