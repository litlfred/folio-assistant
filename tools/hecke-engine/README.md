# hecke-engine

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

Pure-Rust canonical compute core for the QOU paper's Iwahori-Hecke `H_3(q)` Gram + Markov-trace surface. Source of truth for every other crate under `tools/` — `hecke-engine-c`, `hecke-engine-{node,wasm,jvm,r,octave,julia,gap}` all wrap this directly or via the C ABI in `hecke-engine-c/`.

## Public modules

| Module | Purpose |
|---|---|
| `gram` | Gram matrix `G_ij = tr_M(b_i · b_j)` on the 6-element NF basis of `H_3(q)`; scalar primitives `markov_z`, `hecke_h`, `trace_weights`, `gram_matrix`, `det_6x6` |
| `seminormal` | Seminormal block generators + `chi_lambda_braid(shape, word, q)` — Hecke character on a braid word |
| `littlewood_richardson` | `lr_coefficient(λ, μ, ν)` — LR coefficients via skew-tableau enumeration |
| `tr_m_atomic_mpfr` (feature `mpfr`) | Arbitrary-precision Markov trace `tr_M(β)` via the reduce-laurent atomic-state machine |
| `tr_m_word_lq` | Cyclic-cached Markov-trace recursion in `ZHLaurent`; foundation for the mpfr evaluator |
| `littlewood_richardson` | Skew-tableau LR enumeration |
| `wenzl_lr` | Wenzl path-counting + LR decomposition (feature `mpfr`) |
| `cross_level_embedding` | Cross-level Hecke embedding diagnostics |
| `seminormal_mn`, `seminormal_mpfr`, `dense_la_mpfr`, `geck_pfeiffer` (all feature `mpfr`) | Higher-precision variants for production |
| `laurent_hecke_element`, `reduce_laurent`, `atomic_reduce_cache` | State machine + caches for incremental Markov-trace reduction |

## Build features

| Feature | Default? | What it enables |
|---|---|---|
| `mpfr` | yes | `rug` (GMP+MPFR) — required for `tr_m_atomic_mpfr`, `seminormal_mpfr`, `dense_la_mpfr` |
| `wasm-core` | no | Marker for the rug-free subset (used by `hecke-engine-wasm`) |
| `clarabel-sdp` | no | Clarabel-rs LP/QP/SOCP solver (f64 backend; mutually exclusive with `clarabel-mpfr`) |
| `clarabel-bigrational` | no | Clarabel with `BigRational` scalar (exact rational arithmetic) |
| `clarabel-mpfr` | no | Clarabel with `MpfrFloat` scalar (mutually exclusive with `clarabel-sdp` and `clarabel-bigrational`) |

For browser / WASM consumers without GMP, use `default-features = false, features = ["wasm-core"]` — see [`hecke-engine-wasm`](../hecke-engine-wasm/) for the canonical pattern.

## Build

```sh
cargo build --release             # default features (mpfr enabled)
cargo test --release              # 150+ unit tests
cargo build --release \
    --no-default-features \
    --features wasm-core          # rug-free subset
```

`gmp-mpfr-sys` requires system `libgmp-dev` + `libmpfr-dev` (Linux/macOS) or the vendored static-link build path. Run the doctored install if `cargo build` fails on missing headers:

```sh
sudo apt-get install -y libgmp-dev libmpfr-dev m4   # Debian/Ubuntu
brew install gmp mpfr                               # macOS
```

## Conventions

- **Quantum integer:** symmetric form `[n]_q = (q^n − q^{−n}) / (q − q^{−1})` throughout. Sage's default `q_int` uses the standard `(q^n − 1)/(q − 1)` — `tools/sage-examples/scripts/sage_partition_q_dim.sage` documents the bridge.
- **Markov parameter:** `z = 1 / (q^{1/2} + q^{−1/2})` (knot-theoretic / skein convention). NOT the Hecke-character `(q^2 − q + 1)/q`.
- **Braid generator indexing:** 0-based internally (`B_n` has gens `{0, ..., n−2}`). The C ABI passes through this convention; wrappers may surface 1-based generators (Julia, R, GAP) — check each wrapper's README.
- **Out-of-range generators** return a clear `Err`, not a panic. See `tools/hecke-engine/src/tr_m_word_lq.rs:233` for the guard.

## Consumer crates

Downstream wrappers in the workspace (each has its own README):

| Crate | Mechanism | Target |
|---|---|---|
| `hecke-engine-c` | cbindgen | C ABI shared library |
| `hecke-engine-node` | napi-rs | Node.js native module |
| `hecke-engine-wasm` | wasm-bindgen | browser / Pyodide |
| `hecke-engine-jvm` | UniFFI | Kotlin / Swift / Java |
| `hecke-engine-r` | extendr | R package |
| `hecke-engine-octave` | MEX over hecke-engine-c | GNU Octave (MATLAB-compatible) |
| `hecke-engine-julia` | ccall over hecke-engine-c | Julia |
| `hecke-engine-gap` | GAP kernel ext over hecke-engine-c | GAP |
| `pyhecke-native` | PyO3 | Python wheel (PyPI) |

## License

MIT.
