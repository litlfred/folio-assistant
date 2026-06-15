# HeckeEngine (GAP package)

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

GAP bindings to the QOU [`hecke-engine`](../hecke-engine) Rust crate via the [`hecke-engine-c`](../hecke-engine-c) C ABI. **Tier-3 wrapper** per [workplan v2 §3.6](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md) + user request.

GAP is the de facto home of computational rep-theory; the [CHEVIE](https://www.math.rwth-aachen.de/~CHEVIE/) package implements Iwahori-Hecke algebras, and QOU's H_3(q) Gram + Markov-trace surface is a natural CHEVIE adjacency.

## How it works

```
HeckeEngine.gi (GAP) ──> InstallGlobalFunction wrappers
       │
       ▼
src/HeckeEngine.c (GAP kernel module) ──ccall──> libhecke_engine_c.so ──> hecke-engine (Rust)
```

GAP loads the kernel module via `LoadKernelExtension("HeckeEngine")` in `init.g`. The kernel module's `Init__Dynamic` entry point registers `_QOU_HECKE_C_*` global functions, which the GAP-side `HeckeEngine.gi` exposes as the public `QOU_*` API.

## Public API (GAP-side)

| GAP function | Returns |
|---|---|
| `QOU_HeckeEngine_Version()` | string |
| `QOU_MarkovZ(q)` | float |
| `QOU_HeckeH(q)` | float |
| `QOU_TraceWeights(q)` | list of 6 floats |
| `QOU_GramMatrix(q)` | 6×6 matrix of floats |
| `QOU_GramDet(q)` | float |

## Build

```bash
# 1. Build the C ABI library (one-time)
cd ../hecke-engine-c && cargo build --release

# 2. Configure + build the GAP kernel extension
#    (requires a GAP installation; <gap-root> is the directory
#    containing `bin/<arch>/gap`.)
cd ../hecke-engine-gap/src
./configure --with-gaproot=$GAPROOT \
            --with-hecke-engine-c=../../hecke-engine-c
make

# 3. Symlink (or copy) into GAP's pkg/ directory
ln -s "$(pwd)/.." "$GAPROOT/pkg/HeckeEngine"

# 4. Test from GAP
gap -A --quitonbreak tst/smoke.tst
```

The `configure` + `Makefile.in` scaffold is the standard GAP-package template — Phase B will add them via `gac` (GAP's auto-configure helper).

## Use from GAP

```gap
LoadPackage("HeckeEngine");

q0 := 1.10998;;
Print("HeckeEngine ", QOU_HeckeEngine_Version(), "\n");
Print("z = ", QOU_MarkovZ(q0), "\n");

G := QOU_GramMatrix(q0);;
Display(G);
Print("det G = ", QOU_GramDet(q0), "\n");
```

## CHEVIE adjacency (planned, Phase B)

Phase B will add a `HeckeEngine` ↔ CHEVIE bridge:

```gap
LoadPackage("chevie");
H := Hecke(CoxeterGroup("A", 2), 1.10998);
# Compare CHEVIE's Markov trace vs QOU's hecke-engine
```

This will validate QOU's substrate-q canonical computation against CHEVIE's symbolic-q computation specialised to q_0.

## Phase B (deferred until GAP-consumer demand)

- `./configure` + `Makefile.in` via `gac` (currently the README shows the manual recipe)
- CHEVIE adjacency tests
- GAP package archive (`HeckeEngine-0.1.0.tar.gz`) for upload to https://gap-packages.github.io/
- Full surface (`chi_lambda_braid`, `lr_coefficient`, `tr_m_atomic_mpfr`)

## Dependencies

- GAP 4.12+ (for `LoadKernelExtension`)
- libhecke_engine_c.{so,dylib,dll} from `../hecke-engine-c/` (Cargo build)
- libgmp + libmpfr (transitive via hecke-engine's `rug`)
- Optional: CHEVIE 2.5+ for adjacency comparisons

## License

MIT.
