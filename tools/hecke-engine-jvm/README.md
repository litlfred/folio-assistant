# hecke-engine-jvm

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

UniFFI bindings for [`hecke-engine`](../hecke-engine) — same Rust core, consumed from **Kotlin / Java / Swift** (and Ruby / Python if you want them later).

**Tier-3 wrapper** per [workplan v2 §3.6](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md). Sibling of:

- [`pyhecke-native`](../pyhecke-native) (PyO3 → Python; production on PyPI)
- [`hecke-engine-node`](../hecke-engine-node) (napi-rs → Node.js; PR #1106 merged)
- [`hecke-engine-wasm`](../hecke-engine-wasm) (wasm-bindgen → browser; PR #1094 merged)

All four wrappers share the same Rust core (`tools/hecke-engine/`).

## Why UniFFI?

[Mozilla UniFFI](https://mozilla.github.io/uniffi-rs/) generates idiomatic bindings for multiple languages from ONE `.udl` interface file:

| Target | Use case |
|---|---|
| **Kotlin** | Android apps, server-side Kotlin (Ktor, Spring) |
| **Java** | Legacy JVM enterprise consumers (via the Kotlin output's Java interop) |
| **Swift** | iOS / iPadOS / macOS apps, server-side Swift (Vapor) |
| **Ruby / Python** | Bonus — auto-generatable from the same .udl |

Same template as Firefox uses for their cross-platform Rust components.

## Phase A surface

Mirrors `pyhecke-native` + `hecke-engine-node`:

| Function | Returns | Notes |
|---|---|---|
| `version()` | `String` | Package version |
| `markov_z(q)` | `Double` | Markov parameter `z = 1/(q^{1/2}+q^{-1/2})` |
| `hecke_h(q)` | `Double` | Hecke relation coefficient `h = q − q⁻¹` |
| `trace_weights(q)` | `List<Double>` (6 elements) | Markov-trace weights on NF basis |
| `gram_matrix_flat(q)` | `List<Double>` (36 elements, row-major) | Gram matrix — UniFFI doesn't support `[[f64; 6]; 6]` natively; consumers reshape |
| `gram_det(q)` | `Double` | Gram determinant |

Phase B adds `chi_lambda_braid` + `lr_coefficient` + `tr_m_atomic_mpfr` matching pyhecke-native's full surface.

## Build

```bash
cd tools/hecke-engine-jvm
cargo build --release

# Generate Kotlin bindings:
cargo run --bin uniffi-bindgen generate \
    --library target/release/libhecke_engine_jvm.so \
    --language kotlin --out-dir bindings/kotlin/

# Generate Swift bindings:
cargo run --bin uniffi-bindgen generate \
    --library target/release/libhecke_engine_jvm.so \
    --language swift --out-dir bindings/swift/
```

## Use from Kotlin

```kotlin
import org.litlfred.qou.hecke_engine.*

val q = 1.10998  // substrate q_0
println("z = ${markovZ(q)}")
println("Gram det = ${gramDet(q)}")

val flat = gramMatrixFlat(q)
require(flat.size == 36)
// Reshape to 6×6:
val g = Array(6) { i -> DoubleArray(6) { j -> flat[i * 6 + j] } }
```

## Use from Swift

```swift
import HeckeEngineJVM

let q = 1.10998
print("z = \(markovZ(q: q))")
print("Gram det = \(gramDet(q: q))")

let flat = gramMatrixFlat(q: q)
precondition(flat.count == 36)
// Reshape to 6×6:
let g = (0..<6).map { i in (0..<6).map { j in flat[i * 6 + j] } }
```

## Native tests

```bash
cargo test
```

6 Rust unit tests mirror the JS smoke tests in [`hecke-engine-node`](../hecke-engine-node/test/smoke.test.js).

## Phase B (follow-up)

- Add the higher-level `chi_lambda_braid` + `lr_coefficient` + `tr_m_atomic_mpfr` paths matching pyhecke-native's full surface
- Add `.github/workflows/hecke-engine-jvm-bindings.yml` that generates + commits the Kotlin / Swift bindings on every release-please tag
- Maven Central publish for the Kotlin artifact
- Swift Package Manager publish (via tagged release)

## License

MIT. See [LICENSE](https://github.com/litlfred/qou/blob/main/LICENSE) in the parent repository.
