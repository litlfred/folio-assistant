# hecke-engine-r

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

extendr R bindings for [`hecke-engine`](../hecke-engine) — same Rust core, idiomatic R API. **Tier-3 wrapper** per [workplan v2 §3.6](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md). Sibling of:

- [`pyhecke-native`](../pyhecke-native) (PyO3 → Python)
- [`hecke-engine-node`](../hecke-engine-node) (napi-rs → Node.js)
- [`hecke-engine-wasm`](../hecke-engine-wasm) (wasm-bindgen → browser)
- [`hecke-engine-jvm`](../hecke-engine-jvm) (UniFFI → Kotlin/Swift/Java)
- **`hecke-engine-r`** (extendr → R) — this package

All five share the same Rust core (`tools/hecke-engine/`).

## Why extendr

[extendr](https://extendr.github.io/extendr/) is the canonical Rust↔R FFI bridge — `#[extendr]` proc macros generate the R-side glue, including `RMatrix<f64>` ↔ R `matrix` conversion that the H_3(q) Gram surface needs.

## Phase A surface

| R function | Returns |
|---|---|
| `qou_version()` | `character` |
| `qou_markov_z(q)` | `numeric` |
| `qou_hecke_h(q)` | `numeric` |
| `qou_trace_weights(q)` | `numeric` vector (length 6) |
| `qou_gram_matrix(q)` | `numeric` matrix (6×6) |
| `qou_gram_det(q)` | `numeric` |

## Build (R-side)

```r
# Install rextendr from CRAN
install.packages("rextendr")

# From the qou repo root:
library(rextendr)
rextendr::document("tools/hecke-engine-r")
# → builds the Rust cdylib, generates R/extendr-wrappers.R,
#    refreshes NAMESPACE + man/ pages

# Test
devtools::load_all("tools/hecke-engine-r")
q0 <- 1.10998
qou_markov_z(q0)               # 0.499...
G <- qou_gram_matrix(q0)
stopifnot(dim(G) == c(6, 6))
det(G)                          # matches qou_gram_det(q0)
```

## Use from R

```r
library(heckeengine)

q0 <- 1.10998  # substrate q_0
cat("z =", qou_markov_z(q0), "\n")

G <- qou_gram_matrix(q0)
print(G)

# Compare R's base det() with the Rust implementation
stopifnot(abs(det(G) - qou_gram_det(q0)) < 1e-12)
```

## System dependencies

| OS | Install |
|---|---|
| Ubuntu / Debian | `apt-get install libgmp-dev libmpfr-dev` |
| macOS | `brew install gmp mpfr` |
| Windows | Not currently supported (matches `pyhecke-native`'s Windows-skipped baseline) |

Plus a Rust toolchain (1.70+) — Cargo is invoked automatically by `rextendr`.

## CRAN publication (Phase B)

Phase B follow-up:
- `R CMD check --as-cran tools/hecke-engine-r` passes
- `inst/extdata/` carries vendored Cargo dependencies for offline-CRAN install (CRAN's network-access restrictions)
- `.github/workflows/hecke-engine-r-cran.yml` builds + uploads to CRAN

Likely deferred until R-consumer demand surfaces (matches workplan v2 Tier-3 wait-for-demand directive).

## Phase B (matching pyhecke-native's full surface)

Adds `qou_chi_lambda_braid`, `qou_lr_coefficient`, `qou_tr_m_atomic_mpfr` — same as the equivalent Phase B for hecke-engine-node + hecke-engine-jvm.

## License

MIT. See [LICENSE](https://github.com/litlfred/qou/blob/main/LICENSE) in the parent repository.
