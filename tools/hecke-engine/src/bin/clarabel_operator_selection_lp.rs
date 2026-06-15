//! `clarabel-operator-selection-lp` — JSON CLI for the operator-
//! selection LP at MPFR precision.
//!
//! A single solve per invocation (no per-item loop), so the
//! subprocess/FFI boundary cost is negligible — this is the
//! F-D-acceptable regime from `ffi-roundtrip-audit.md`.
//!
//! Reads one JSON object from **stdin**:
//! ```json
//! {
//!   "t":        ["1.0", "0.5", "0.3"],
//!   "G":        [["1.0","0.2","0.1"],["0.2","1.0","0.3"],["0.1","0.3","1.0"]],
//!   "n_target": "1.0",
//!   "m_bound":  "1e6",     // optional (default 1e6)
//!   "dual_tol": "1e-9",    // optional (default 1e-9)
//!   "prec_bits": 167       // optional (default 167 ≈ 50 dps)
//! }
//! ```
//! Numbers MUST be JSON **strings** so the full decimal precision
//! survives the boundary (a JSON number would be truncated to f64).
//!
//! Writes one JSON object to **stdout** with the same field names as
//! `pyhecke.lp_dual_solver.LpDualResult.to_dict()` (f64 summary
//! fields) PLUS full-precision `*_str` decimal-string variants:
//! ```json
//! {
//!   "x_star": [...], "y0_star": ..., "y_star": [...],
//!   "active_set": [...], "primal_obj": ..., "dual_obj": ...,
//!   "duality_gap": ..., "feasible": true, "status": "Solved",
//!   "x_star_str": [...], "y0_star_str": "...", "y_star_str": [...],
//!   "primal_obj_str": "...", "dual_obj_str": "...",
//!   "duality_gap_str": "...", "precision_bits": 167
//! }
//! ```
//!
//! Required features: `clarabel-mpfr`.

use clarabel::algebra::{set_mpfr_default_precision, MpfrFloat};
use hecke_engine::operator_selection_lp::{
    solve_operator_selection_lp, to_f64, DEFAULT_PREC_BITS, T,
};
use serde_json::{json, Value};
use std::io::Read;

/// Parse a decimal string into an `MpfrFloat` at the current default
/// precision via the crate's `Deserialize` impl (which uses
/// `rug::Float::parse` + `with_val(default_prec, …)`).
fn parse_mpfr(s: &str) -> Result<T, String> {
    // `MpfrFloat`'s `Deserialize` wire format is a `(precision, decimal)`
    // tuple; precision `0` means "use the thread-local default", which
    // `run()` sets via `set_mpfr_default_precision` before any parse.
    // `rug::Float::parse` accepts plain decimals and `1e6` / `1e-9` forms.
    serde_json::from_value::<MpfrFloat>(json!([0, s]))
        .map_err(|e| format!("cannot parse MPFR scalar {s:?}: {e}"))
}

/// Pull a scalar field that may be a JSON string or number; require a
/// string for full precision but tolerate a number (f64 fallback).
fn scalar_field(v: &Value, key: &str, default: Option<&str>) -> Result<T, String> {
    match v.get(key) {
        Some(Value::String(s)) => parse_mpfr(s),
        Some(Value::Number(n)) => parse_mpfr(&n.to_string()),
        Some(other) => Err(format!("field {key:?} must be a string/number, got {other}")),
        None => match default {
            Some(d) => parse_mpfr(d),
            None => Err(format!("missing required field {key:?}")),
        },
    }
}

fn vec_field(v: &Value, key: &str) -> Result<Vec<T>, String> {
    let arr = v
        .get(key)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("field {key:?} must be an array"))?;
    arr.iter()
        .map(|e| match e {
            Value::String(s) => parse_mpfr(s),
            Value::Number(n) => parse_mpfr(&n.to_string()),
            other => Err(format!("element of {key:?} must be string/number, got {other}")),
        })
        .collect()
}

fn matrix_field(v: &Value, key: &str) -> Result<Vec<Vec<T>>, String> {
    let arr = v
        .get(key)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("field {key:?} must be a 2-D array"))?;
    arr.iter()
        .enumerate()
        .map(|(i, row)| {
            let r = row
                .as_array()
                .ok_or_else(|| format!("{key}[{i}] must be an array"))?;
            r.iter()
                .map(|e| match e {
                    Value::String(s) => parse_mpfr(s),
                    Value::Number(n) => parse_mpfr(&n.to_string()),
                    other => Err(format!("{key}[{i}] element must be string/number, got {other}")),
                })
                .collect::<Result<Vec<T>, String>>()
        })
        .collect()
}

fn run() -> Result<Value, String> {
    let mut input = String::new();
    std::io::stdin()
        .read_to_string(&mut input)
        .map_err(|e| format!("stdin read failed: {e}"))?;
    let v: Value = serde_json::from_str(&input).map_err(|e| format!("invalid JSON: {e}"))?;

    // Set precision FIRST so subsequent string→MPFR parses use it.
    let prec_bits = v
        .get("prec_bits")
        .and_then(Value::as_u64)
        .map(|x| x as u32)
        .unwrap_or(DEFAULT_PREC_BITS);
    set_mpfr_default_precision(prec_bits);

    let t = vec_field(&v, "t")?;
    let g = matrix_field(&v, "G")?;
    let n_target = scalar_field(&v, "n_target", None)?;
    let m_bound = scalar_field(&v, "m_bound", Some("1e6"))?;
    let dual_tol = scalar_field(&v, "dual_tol", Some("1e-9"))?;

    let r = solve_operator_selection_lp(&t, &g, &n_target, &m_bound, &dual_tol, prec_bits);

    Ok(json!({
        "x_star": r.x_star.iter().map(to_f64).collect::<Vec<f64>>(),
        "y0_star": to_f64(&r.y0_star),
        "y_star": r.y_star.iter().map(to_f64).collect::<Vec<f64>>(),
        "active_set": r.active_set,
        "primal_obj": to_f64(&r.primal_obj),
        "dual_obj": to_f64(&r.dual_obj),
        "duality_gap": to_f64(&r.duality_gap),
        "feasible": r.feasible,
        "status": r.status,
        // Full-precision decimal-string variants (no f64 truncation):
        "x_star_str": r.x_star.iter().map(|x| format!("{x}")).collect::<Vec<String>>(),
        "y0_star_str": format!("{}", r.y0_star),
        "y_star_str": r.y_star.iter().map(|y| format!("{y}")).collect::<Vec<String>>(),
        "primal_obj_str": format!("{}", r.primal_obj),
        "dual_obj_str": format!("{}", r.dual_obj),
        "duality_gap_str": format!("{}", r.duality_gap),
        "precision_bits": prec_bits,
    }))
}

fn main() {
    match run() {
        Ok(out) => {
            println!("{}", serde_json::to_string(&out).unwrap());
        }
        Err(e) => {
            eprintln!("clarabel-operator-selection-lp error: {e}");
            // Emit a machine-readable error object too.
            println!("{}", json!({ "error": e, "feasible": false }));
            std::process::exit(1);
        }
    }
}
