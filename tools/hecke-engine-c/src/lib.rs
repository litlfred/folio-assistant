//! hecke-engine-c — C-ABI bindings for hecke-engine.
//!
//! Tier-3 wrapper per workplan v2 §3.6. Sibling of pyhecke-native,
//! hecke-engine-{node,wasm,jvm,r}. The C ABI is the universal
//! lowest-common-denominator — consumed by:
//!   - Octave (via MEX shim)
//!   - Native iOS / Android (via Bridging-Header / JNI)
//!   - Embedded Lua / Tcl / Guile / etc.
//!   - R via `.Call()` (independent of extendr; alternative path)
//!
//! All exported functions use `#[no_mangle] extern "C"` so cbindgen
//! emits them into `include/hecke_engine.h` with C-compatible
//! signatures. The header is committed for downstream-consumer
//! convenience but regenerates cleanly on every `cargo build`.
//!
//! Memory ownership: arrays returned to C consumers (gram-matrix
//! flatten + trace-weights vector) are caller-allocated. The
//! consumer passes in a `double*` of the right size, we fill it.
//! No malloc/free across the FFI boundary — keeps the ABI safe
//! for any C-callable runtime.

use hecke_engine::gram;
use hecke_engine::seminormal;
use hecke_engine::littlewood_richardson;
use hecke_engine::tr_m_atomic_mpfr as trmpfr;

/// Engine version as a null-terminated C string.
///
/// The returned pointer points into a static buffer; the caller
/// must NOT free it. Valid for the lifetime of the process.
#[no_mangle]
pub extern "C" fn qou_hecke_version() -> *const std::os::raw::c_char {
    // env!() expands to a 'static &str; the null-terminated form is
    // built once and leaked (it's tiny + lives for the process).
    static VERSION: std::sync::OnceLock<std::ffi::CString> = std::sync::OnceLock::new();
    let s = VERSION.get_or_init(|| {
        std::ffi::CString::new(env!("CARGO_PKG_VERSION")).unwrap()
    });
    s.as_ptr()
}

/// Markov parameter z = 1 / (q^{1/2} + q^{-1/2}).
#[no_mangle]
pub extern "C" fn qou_hecke_markov_z(q: f64) -> f64 {
    gram::markov_z(q)
}

/// Hecke relation coefficient h = q - q^{-1}.
#[no_mangle]
pub extern "C" fn qou_hecke_h(q: f64) -> f64 {
    gram::hecke_h(q)
}

/// Markov-trace weights on the NF basis.
///
/// `out` must point to at least 6 contiguous `double`s. Fills:
///   out[0..6] = [1, z, z, z^2, z^2, z^3]
/// where z = qou_hecke_markov_z(q).
#[no_mangle]
pub extern "C" fn qou_hecke_trace_weights(q: f64, out: *mut f64) {
    if out.is_null() { return; }
    let w = gram::trace_weights(q);
    unsafe {
        std::ptr::copy_nonoverlapping(w.as_ptr(), out, 6);
    }
}

/// Gram matrix G_ij = tr_M(b_i * b_j), row-major.
///
/// `out` must point to at least 36 contiguous `double`s. Fills:
///   out[i*6 + j] = G[i][j]   for i, j in 0..6
#[no_mangle]
pub extern "C" fn qou_hecke_gram_matrix_flat(q: f64, out: *mut f64) {
    if out.is_null() { return; }
    let m = gram::gram_matrix(q);
    let mut k = 0usize;
    for row in m.iter() {
        for &v in row.iter() {
            unsafe { *out.add(k) = v; }
            k += 1;
        }
    }
}

/// Gram determinant.
#[no_mangle]
pub extern "C" fn qou_hecke_gram_det(q: f64) -> f64 {
    gram::det_6x6(&gram::gram_matrix(q))
}

// ─────────────────────────────────────────────────────────────────
// Phase B — full surface: chi_lambda_braid, lr_coefficient,
// tr_m_atomic_mpfr.
//
// Variable-length slice convention: caller passes (pointer, length)
// pairs. Pair-of-int inputs (braid words) use parallel arrays for
// each tuple field so the C signature stays simple. The mpfr trace
// returns a string via a caller-allocated out-buffer + status code
// so we never malloc across the FFI boundary.
// ─────────────────────────────────────────────────────────────────

/// Hecke character χ_λ(β) of partition λ on braid word β at q.
///
/// `shape`: pointer to `shape_len` `size_t` entries describing the
/// partition λ in weakly-decreasing order. Empty (`shape_len == 0`)
/// returns 1.0 (the trivial-character convention from the Rust API).
///
/// `word_gens`, `word_exps`: parallel arrays of length `word_len`.
/// Entry `i` is the braid letter `(word_gens[i], word_exps[i])`,
/// matching the Rust `&[(i32, u32)]` tuple shape.
///
/// Returns 0.0 if any input pointer is null with non-zero length.
#[no_mangle]
pub extern "C" fn qou_hecke_chi_lambda_braid(
    shape: *const usize,
    shape_len: usize,
    word_gens: *const i32,
    word_exps: *const u32,
    word_len: usize,
    q: f64,
) -> f64 {
    if shape_len > 0 && shape.is_null() { return 0.0; }
    if word_len > 0 && (word_gens.is_null() || word_exps.is_null()) {
        return 0.0;
    }
    let shape_slice: &[usize] = unsafe {
        std::slice::from_raw_parts(
            if shape_len == 0 { std::ptr::NonNull::<usize>::dangling().as_ptr() } else { shape },
            shape_len,
        )
    };
    let mut word_vec: Vec<(i32, u32)> = Vec::with_capacity(word_len);
    for i in 0..word_len {
        unsafe {
            word_vec.push((*word_gens.add(i), *word_exps.add(i)));
        }
    }
    seminormal::chi_lambda_braid(shape_slice, &word_vec, q)
}

/// Littlewood–Richardson coefficient c^λ_{μν}.
///
/// All three partitions are pointer + length pairs. Returns 0 if
/// `|λ| ≠ |μ| + |ν|` or if `μ ⊄ λ` (consistent with the Rust API).
/// Returns 0 if any non-empty input pointer is null.
#[no_mangle]
pub extern "C" fn qou_hecke_lr_coefficient(
    lambda: *const usize,
    lambda_len: usize,
    mu: *const usize,
    mu_len: usize,
    nu: *const usize,
    nu_len: usize,
) -> i64 {
    if lambda_len > 0 && lambda.is_null() { return 0; }
    if mu_len > 0 && mu.is_null() { return 0; }
    if nu_len > 0 && nu.is_null() { return 0; }
    let lam: &[usize] = unsafe {
        std::slice::from_raw_parts(
            if lambda_len == 0 { std::ptr::NonNull::<usize>::dangling().as_ptr() } else { lambda },
            lambda_len,
        )
    };
    let m: &[usize] = unsafe {
        std::slice::from_raw_parts(
            if mu_len == 0 { std::ptr::NonNull::<usize>::dangling().as_ptr() } else { mu },
            mu_len,
        )
    };
    let n: &[usize] = unsafe {
        std::slice::from_raw_parts(
            if nu_len == 0 { std::ptr::NonNull::<usize>::dangling().as_ptr() } else { nu },
            nu_len,
        )
    };
    littlewood_richardson::lr_coefficient(lam, m, n)
}

/// Arbitrary-precision Markov trace tr_M(β) at q via atomic mpfr.
///
/// Input braid word as parallel arrays of length `word_len`:
///   `word_signs[i]` ∈ {−1, +1} sign of letter i
///   `word_gens[i]`  generator index (1-based, matching the Rust API)
///
/// `n_strands`: braid strand count (n in B_n).
/// `q_str`: q as a null-terminated decimal string (e.g. "1.10998")
///          for arbitrary-precision parsing.
/// `dps`: decimal digits of precision (e.g. 50).
///
/// On success: returns 0, writes a null-terminated decimal string
/// representation of the trace into `out_buf[0..out_buf_len]`.
/// On error: returns non-zero, writes the error message (truncated
/// if needed) into `out_buf`.
/// Truncation: if `out_buf_len` is too small for the full string
/// plus the terminating NUL, returns 2 and writes `out_buf_len - 1`
/// bytes plus a NUL.
///
/// Returns 3 if any required pointer is null or `out_buf_len == 0`.
#[no_mangle]
pub extern "C" fn qou_hecke_tr_m_atomic_mpfr(
    word_signs: *const i8,
    word_gens: *const i32,
    word_len: usize,
    n_strands: usize,
    q_str: *const std::os::raw::c_char,
    dps: u32,
    out_buf: *mut std::os::raw::c_char,
    out_buf_len: usize,
) -> std::os::raw::c_int {
    if out_buf.is_null() || out_buf_len == 0 { return 3; }
    if q_str.is_null() { return 3; }
    if word_len > 0 && (word_signs.is_null() || word_gens.is_null()) {
        return 3;
    }
    let mut word_vec: Vec<(i8, i32)> = Vec::with_capacity(word_len);
    for i in 0..word_len {
        unsafe {
            word_vec.push((*word_signs.add(i), *word_gens.add(i)));
        }
    }
    let q_borrowed = unsafe { std::ffi::CStr::from_ptr(q_str) };
    let q_rust = match q_borrowed.to_str() {
        Ok(s) => s,
        Err(_) => { write_to_out_buf(out_buf, out_buf_len, "invalid utf-8 in q_str"); return 1; }
    };
    match trmpfr::tr_m_atomic_mpfr(&word_vec, n_strands, q_rust, dps) {
        Ok(s) => write_to_out_buf(out_buf, out_buf_len, &s),
        Err(e) => {
            write_to_out_buf(out_buf, out_buf_len, &e);
            1
        }
    }
}

/// Helper: write a Rust &str into a caller-allocated C buffer with
/// NUL termination. Returns 0 if the whole string fit, 2 if it was
/// truncated to `out_buf_len - 1` bytes.
fn write_to_out_buf(out_buf: *mut std::os::raw::c_char, out_buf_len: usize, s: &str)
    -> std::os::raw::c_int
{
    if out_buf.is_null() || out_buf_len == 0 { return 3; }
    let bytes = s.as_bytes();
    let copy_len = bytes.len().min(out_buf_len - 1);
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), out_buf as *mut u8, copy_len);
        *out_buf.add(copy_len) = 0;
    }
    if copy_len < bytes.len() { 2 } else { 0 }
}
