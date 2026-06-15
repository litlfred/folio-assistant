//! `clarabel-confinement-moment-sdp` — JSON CLI for the Lasserre
//! moment-matrix SDP (the canonical QOU dense lift, `prop:confinement-sdp`).
//!
//! One solve per invocation (negligible subprocess cost). `f64` (the PSD
//! cone needs LAPACK).
//!
//! stdin JSON:
//! ```json
//! { "c": [...], "G": [[...]], "n_target": 1.0, "lo": -10.0, "hi": 10.0 }
//! ```
//! (`lo`/`hi` optional, default ±10.)  Numbers are plain JSON f64.
//!
//! stdout JSON: `{ x_star, xtgx, tr_gx, objective, feasible, status }` —
//! matching the fields the cvxpy reference (`sdp_moment_lift.py`) reports.
//!
//! Required features: `clarabel-sdp`.

use hecke_engine::operator_selection_sdp::solve_confinement_moment_sdp;
use serde_json::{json, Value};
use std::io::Read;

fn nums(v: &Value, key: &str) -> Result<Vec<f64>, String> {
    v.get(key)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("field {key:?} must be an array"))?
        .iter()
        .map(|e| e.as_f64().ok_or_else(|| format!("{key} element not a number")))
        .collect()
}

fn matrix(v: &Value, key: &str) -> Result<Vec<Vec<f64>>, String> {
    v.get(key)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("field {key:?} must be a 2-D array"))?
        .iter()
        .enumerate()
        .map(|(i, row)| {
            row.as_array()
                .ok_or_else(|| format!("{key}[{i}] must be an array"))?
                .iter()
                .map(|e| e.as_f64().ok_or_else(|| format!("{key}[{i}] element not a number")))
                .collect::<Result<Vec<f64>, String>>()
        })
        .collect()
}

fn run() -> Result<Value, String> {
    let mut input = String::new();
    std::io::stdin()
        .read_to_string(&mut input)
        .map_err(|e| format!("stdin read failed: {e}"))?;
    let v: Value = serde_json::from_str(&input).map_err(|e| format!("invalid JSON: {e}"))?;

    let c = nums(&v, "c")?;
    let g = matrix(&v, "G")?;
    let n_target = v
        .get("n_target")
        .and_then(Value::as_f64)
        .ok_or("missing/invalid n_target")?;
    let lo = v.get("lo").and_then(Value::as_f64).unwrap_or(-10.0);
    let hi = v.get("hi").and_then(Value::as_f64).unwrap_or(10.0);

    let r = solve_confinement_moment_sdp(&c, &g, n_target, lo, hi);
    Ok(json!({
        "x_star": r.x_star,
        "xtgx": r.xtgx,
        "tr_gx": r.tr_gx,
        "objective": r.objective,
        "feasible": r.feasible,
        "status": r.status,
    }))
}

fn main() {
    match run() {
        Ok(out) => println!("{}", serde_json::to_string(&out).unwrap()),
        Err(e) => {
            eprintln!("clarabel-confinement-moment-sdp error: {e}");
            println!("{}", json!({ "error": e, "feasible": false }));
            std::process::exit(1);
        }
    }
}
