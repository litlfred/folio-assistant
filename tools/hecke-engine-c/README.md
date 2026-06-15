# hecke-engine-c

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

C-ABI bindings for [`hecke-engine`](../hecke-engine) via [cbindgen](https://github.com/mozilla/cbindgen). The universal lowest-common-denominator wrapper — consumed by anything that can call a C function.

**Tier-3 wrapper** per [workplan v2 §3.6](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md). Sibling of:

- `pyhecke-native` (PyO3 → Python)
- `hecke-engine-node` (napi-rs → Node.js)
- `hecke-engine-wasm` (wasm-bindgen → browser)
- `hecke-engine-jvm` (UniFFI → Kotlin/Swift/Java)
- `hecke-engine-r` (extendr → R)
- **`hecke-engine-c`** (cbindgen → C ABI) — this package

## What it's good for

Anything that can call a C function and load a `.so` / `.dylib` / `.dll`:

- **Octave** (via MEX shim — see `tools/hecke-engine-octave/`)
- **Native iOS / Android** (via Bridging-Header / JNI)
- **Embedded Lua / Tcl / Guile / Scheme**
- **R via `.Call()`** (independent of extendr; alternative path)
- **Mathematica's LibraryLink** (closed-source consumer, but ABI is open)
- **GAP's C-extension API** (used by `tools/hecke-engine-gap/`)

## API

| C symbol | Returns |
|---|---|
| `const char* qou_hecke_version()` | Null-terminated version string (static; do NOT free) |
| `double qou_hecke_markov_z(double q)` | Markov parameter z |
| `double qou_hecke_h(double q)` | Hecke coefficient h |
| `void qou_hecke_trace_weights(double q, double* out)` | Fills `out[0..6]` with NF-basis weights |
| `void qou_hecke_gram_matrix_flat(double q, double* out)` | Fills `out[0..36]` row-major with the 6×6 Gram |
| `double qou_hecke_gram_det(double q)` | Gram determinant |

**Memory ownership**: arrays are caller-allocated. The consumer passes a `double*` of the right size; we fill it. No `malloc`/`free` across the FFI boundary — safe for any C-callable runtime.

## Build

```bash
cd tools/hecke-engine-c
cargo build --release

# Outputs:
#   target/release/libhecke_engine_c.{so,dylib,dll}   - the cdylib
#   target/release/libhecke_engine_c.a                - the staticlib
#   include/hecke_engine.h                            - cbindgen-generated header
```

The header regenerates on every `cargo build` via [`build.rs`](build.rs).

## Use from C

```c
#include "hecke_engine.h"
#include <stdio.h>

int main(void) {
    double q0 = 1.10998;
    printf("hecke-engine %s\n", qou_hecke_version());
    printf("z(q_0) = %.6f\n", qou_hecke_markov_z(q0));

    double w[6];
    qou_hecke_trace_weights(q0, w);
    printf("weights = [%.4f, %.4f, %.4f, %.4f, %.4f, %.4f]\n",
           w[0], w[1], w[2], w[3], w[4], w[5]);

    double G[36];
    qou_hecke_gram_matrix_flat(q0, G);
    printf("G[0][0] = %.6f\n", G[0]);
    printf("det G   = %.6e\n", qou_hecke_gram_det(q0));
    return 0;
}
```

Compile + link:

```bash
gcc -I tools/hecke-engine-c/include \
    -L tools/hecke-engine-c/target/release \
    -lhecke_engine_c -lgmp -lmpfr -lpthread -ldl -lm \
    -o demo demo.c
./demo
```

## License

MIT. See [LICENSE](https://github.com/litlfred/qou/blob/main/LICENSE).
