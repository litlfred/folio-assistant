# hecke-engine-node

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

napi-rs Node.js native bindings for [`hecke-engine`](../hecke-engine) — Gram + Markov-trace primitives for the Iwahori-Hecke algebra H_n(q). **Tier-3 sibling** of [`pyhecke-native`](../pyhecke-native) (PyO3 → Python) and [`hecke-engine-wasm`](../hecke-engine-wasm) (wasm-bindgen → browser).

## Why three bindings?

Per [workplan v2 §3.6](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md):

| Consumer | Binding | When to use |
|---|---|---|
| **CPython** (incl. Pyodide) | `pyhecke-native` (PyO3) | Production Python compute; full mpfr cone |
| **Browser / Deno / Bun** | `hecke-engine-wasm` (wasm-bindgen) | Pure-Rust canonical surface only; no system deps |
| **Node.js** (this) | `hecke-engine-node` (napi-rs) | Server-side Node with full mpfr cone; ~5× faster than WASM for the same surface |

All three share the same Rust core (`tools/hecke-engine/`); only the binding glue differs.

## Phase A scope

Mirrors `pyhecke-native`'s top-level surface:

| Function | Returns | Notes |
|---|---|---|
| `markovZ(q)` | `number` | Markov parameter `z = 1/(q^{1/2}+q^{-1/2})` |
| `heckeH(q)` | `number` | Hecke relation coefficient `h = q − q⁻¹` |
| `traceWeights(q)` | `number[6]` | Markov-trace weights on the NF basis |
| `gramMatrix(q)` | `number[6][6]` | Gram matrix `G_ij = tr_M(b_i · b_j)` |
| `gramDet(q)` | `number` | Gram determinant |
| `version()` | `string` | Package version |

Phase B adds the higher-level `chiLambdaBraid` + `lrCoefficient` + `trMAtomicMpfr` paths matching pyhecke-native's full surface.

## Build

```bash
cd tools/hecke-engine-node
npm install                    # installs @napi-rs/cli
npm run build                  # napi build → hecke-engine-node.<platform>.node + index.js + index.d.ts
npm test                       # node --test test/
```

For prebuilt artifacts across platforms (linux-x64-gnu, darwin-arm64, win32-x64-msvc, …), the `napi` block in `package.json` lists the supported triples. Phase B will add a `.github/workflows/hecke-engine-node-prebuilt.yml` that cross-compiles + uploads to npm via the `@napi-rs` prebuilt scheme.

## Use from Node.js

```js
const { markovZ, gramMatrix, gramDet } = require("@litlfred/hecke-engine-node");

const q0 = 1.10998;  // substrate q_0
console.log(`z(q_0) = ${markovZ(q0)}`);
console.log(`det G(q_0) = ${gramDet(q0)}`);

const G = gramMatrix(q0);
for (const row of G) {
  console.log(row.map(x => x.toFixed(6)).join("  "));
}
```

## Why napi-rs over native N-API?

- Type-safe Rust → JS bindings via `#[napi]` proc macros (no manual N-API plumbing)
- Auto-generated TypeScript declarations (`index.d.ts`)
- Prebuilt-artifact distribution support via `@napi-rs/cli`
- Same pattern as widely-used Rust→Node crates (`@swc/core`, `next-swc`, etc.)

## Sibling work

- [`pyhecke-native`](../pyhecke-native) — PyO3 Python binding (production today)
- [`hecke-engine-wasm`](../hecke-engine-wasm) — wasm-bindgen browser binding (PR #1094 in flight)
- [`witness-schema`](../witness-schema) — cross-language witness JSON schema (PR #1078, merged)

## License

MIT. See [LICENSE](https://github.com/litlfred/qou/blob/main/LICENSE) in the parent repository.
