# HeckeEngine.jl

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

Julia bindings for [`hecke-engine`](../hecke-engine) via the [`hecke-engine-c`](../hecke-engine-c) C ABI. **Tier-3 wrapper** per [workplan v2 §3.6](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md).

## Why Julia

Julia is hot in mathematics:
- **Oscar** — algebraic geometry, group theory
- **Nemo** — number theory, commutative algebra
- **AbstractAlgebra** — generic algebraic structures
- Tens of thousands of mathematicians + a growing CAS-Julia ecosystem

QOU's Iwahori-Hecke H_3(q) Gram + Markov-trace surface is a natural fit.

## How it works

Thin Julia `ccall` shim over the [`hecke-engine-c`](../hecke-engine-c) C ABI:

```
HeckeEngine.jl ──ccall──► hecke-engine-c (cdylib) ──► hecke-engine (Rust)
```

No `jlrs` (Julia-aware Rust crate) dependency — the C ABI is sufficient and avoids a Julia-version-pinned Rust build.

## API (mirrors all sibling wrappers)

| Julia function | Returns |
|---|---|
| `version()` | `String` |
| `markov_z(q)` | `Float64` |
| `hecke_h(q)` | `Float64` |
| `trace_weights(q)` | `Vector{Float64}` (length 6) |
| `gram_matrix(q)` | `Matrix{Float64}` (6×6) |
| `gram_det(q)` | `Float64` |

## Build

```bash
# 1. Build the C ABI library (one-time)
cd ../hecke-engine-c && cargo build --release

# 2. Install + test the Julia package
cd ../hecke-engine-julia
julia --project=. -e 'import Pkg; Pkg.instantiate(); Pkg.test()'
```

## Use from Julia

```julia
using HeckeEngine

q0 = 1.10998  # substrate q_0
println("HeckeEngine $(version())")
println("z = $(markov_z(q0))")

G = gram_matrix(q0)
@assert size(G) == (6, 6)
println("det G = $(gram_det(q0))")

# Compare Julia's LinearAlgebra.det vs the Rust det:
using LinearAlgebra
@assert abs(det(G) - gram_det(q0)) < 1e-12
```

## Library discovery

The Julia side discovers `libhecke_engine_c.{so,dylib,dll}` in order:
1. `HECKE_ENGINE_C_LIB` env var (explicit override)
2. Conventional sibling location: `tools/hecke-engine-c/target/release/`

If neither is found, `using HeckeEngine` errors with a clear message and build instructions.

## Phase B (deferred until Julia-consumer demand)

- Julia General registry submission
- `BinaryBuilder.jl` recipe so users get the cdylib via `Pkg.add("HeckeEngine")` without needing Rust
- Match `pyhecke-native`'s full surface (`chi_lambda_braid`, `lr_coefficient`, `tr_m_atomic_mpfr`)
- Oscar / Nemo integration examples

## License

MIT.
