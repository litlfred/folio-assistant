# hecke-engine-wasm

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

`wasm-bindgen` exports of [`hecke-engine`](../hecke-engine)'s pure-Rust canonical surface — the WASM-targetable subset that doesn't depend on system GMP / MPFR / OpenBLAS / LAPACK / gfortran.

**Tier-2 item 2d** from [workplan v2](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md).

## What this Phase A exposes

| Function | Returns | Status |
|---|---|---|
| `qou_engine_version()` | engine version string | ✅ |
| `qou_quantum_integer(n, q_num, q_den)` | `[n]_q = (q^n − q^{−n})/(q − q^{−1})` as an exact rational `"p/q"` string | ✅ |
| `qou_partitions_of(n)` | JSON array of partitions of `n`, in lex-decreasing-prefix order | ✅ |
| `qou_lr_coefficient(λ, μ, ν)` | Littlewood-Richardson coefficient `c^ν_{λμ}` (wraps `hecke_engine::littlewood_richardson::lr_coefficient`) | ✅ |

Phase B will add:

| Function | Returns | Blocked on |
|---|---|---|
| `qou_canonical_gram_h3(q_num, q_den)` | Gram matrix of H_3(q) at rational q | gram.rs currently uses generic scalar — needs WASM-targeted instantiation |
| `qou_canonical_chi_lambda(braid_word, lambda)` | χ^λ(β) for atomic braid β | needs `wenzl_lr` carved into a rug-free variant |
| `qou_canonical_nf_reduce(element)` | Gröbner-Shirshov normal form | `gb_nf_reducer` exists rug-free; needs API design |

## What this crate does NOT expose

Anything that requires MPFR multi-precision floats (system GMP/MPFR), Clarabel SDP (system OpenBLAS/LAPACK), or other system libraries. The full hecke-engine compute surface — including the canonical `seminormal_mpfr`, `dense_la_mpfr`, `tr_m_atomic_mpfr`, all SDP solver paths — stays in the native `hecke-engine` package for Python / Native consumers (via `pyhecke-native` on PyPI).

## How the feature-gating works

`hecke-engine`'s `Cargo.toml` (this PR):

```toml
[features]
default = ["mpfr"]                # rug stays on by default
mpfr = ["dep:rug"]                # gates the 13-module rug cone
wasm-core = []                    # no-op flag for build-intent clarity
clarabel-sdp = ["dep:clarabel", ...] # opt-in; needs OpenBLAS/LAPACK
```

`hecke-engine`'s `lib.rs` gates the rug cone:

```rust
#[cfg(feature = "mpfr")]
pub mod dense_la_mpfr;
#[cfg(feature = "mpfr")]
pub mod seminormal_mpfr;
// ... 11 more modules in the transitive rug cone
```

`hecke-engine-wasm`'s `Cargo.toml`:

```toml
hecke-engine = { path = "../hecke-engine", default-features = false, features = ["wasm-core"] }
```

This disables `mpfr` + `clarabel-sdp` for the WASM build, leaving exactly the pure-Rust canonical surface (~3 500 LOC across 11 modules: `certificate`, `cross_level_embedding`, `gb_nf_reducer`, `gram`, `joint_tower_sdp_certificate`, `littlewood_richardson`, `rational_round`, `sdp_verifier`, `seminormal`, `sturm_psd`, `wedderburn_psd`).

## Build

```bash
# Install wasm-pack (one-time):
cargo install wasm-pack

# Build the WASM artifact + JS wrapper:
cd tools/hecke-engine-wasm
wasm-pack build --release --target web

# Output: pkg/hecke_engine_wasm.{js,d.ts,_bg.wasm}
```

Verify default `hecke-engine` build still works (no caller breakage):

```bash
cd tools/hecke-engine
cargo check                      # default features: mpfr only (clarabel-sdp opt-in)
cargo check --no-default-features --lib  # WASM-targetable surface only
```

## Use from JavaScript / TypeScript

```ts
import init, {
  qou_quantum_integer,
  qou_partitions_of,
  qou_lr_coefficient,
  qou_engine_version,
} from "@litlfred/hecke-engine-wasm";

await init();

console.log(qou_engine_version());                  // "0.1.0"
console.log(qou_quantum_integer(2, 2, 1));          // "5/2"  ([2]_q at q=2)
console.log(qou_partitions_of(4));                  // "[[4],[3,1],[2,2],[2,1,1],[1,1,1,1]]"
console.log(qou_lr_coefficient("[2,1]", "[2,1]", "[3,2,1]"));  // → c^{(3,2,1)}_{(2,1),(2,1)}
```

## CI

The `.github/workflows/hecke-engine-wasm.yml` workflow:

1. Caches Cargo + wasm-pack
2. Runs `cargo test` on native (verifies pure-Rust correctness)
3. Runs `wasm-pack build --release --target web`
4. Uploads the `pkg/` artifact

Publication to npm as `@litlfred/hecke-engine-wasm` is a follow-up (Phase B); the workflow is `workflow_dispatch`-only until then.

## License

MIT. See [LICENSE](https://github.com/litlfred/qou/blob/main/LICENSE) in the parent repository.
