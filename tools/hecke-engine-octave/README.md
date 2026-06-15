# hecke-engine-octave

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

GNU Octave bindings for [`hecke-engine`](../hecke-engine) — the open-source MATLAB equivalent. **Tier-3 wrapper** per [workplan v2 §3.6](../../docs/workplans/2026-05-24-library-reuse-production-readiness.md).

## How it works

This package is a **thin Octave MEX shim** over the [`hecke-engine-c`](../hecke-engine-c) C ABI. The Rust core stays in `hecke-engine`; cbindgen exposes the C ABI; this directory wires `.cc` MEX files to Octave's `mkoctfile` toolchain.

**No Rust required to consume** — Octave users only need:
- GNU Octave 8.x+ with `mkoctfile`
- The prebuilt `libhecke_engine_c.so` (or `.dylib`) from `hecke-engine-c/target/release/`
- The `hecke_engine.h` header from `hecke-engine-c/include/`

## API (mirrors all sibling wrappers)

| Octave function | Returns |
|---|---|
| `qou_hecke_version()` | char (version string) |
| `qou_hecke_markov_z(q)` | double |
| `qou_hecke_h(q)` | double |
| `qou_hecke_trace_weights(q)` | 1×6 double row vector |
| `qou_hecke_gram_matrix(q)` | 6×6 double matrix |
| `qou_hecke_gram_det(q)` | double |

## Build

```bash
# 1. Build the C ABI library (one-time)
cd ../hecke-engine-c
cargo build --release

# 2. Compile the MEX shims
cd ../hecke-engine-octave
make
# → produces qou_hecke_*.mex (or .oct) for each Octave function

# 3. Add this directory to Octave's path
echo 'addpath("/abs/path/to/tools/hecke-engine-octave")' >> ~/.octaverc
```

## Use from Octave

```octave
q0 = 1.10998;  % substrate q_0

printf("hecke-engine %s\n", qou_hecke_version());
printf("z = %.6f\n", qou_hecke_markov_z(q0));

w = qou_hecke_trace_weights(q0);
printf("weights = "); disp(w);

G = qou_hecke_gram_matrix(q0);
disp("Gram matrix:"); disp(G);

assert(abs(det(G) - qou_hecke_gram_det(q0)) < 1e-12);
```

## MATLAB compatibility

The `.cc` MEX files use the standard MATLAB MEX API (which Octave is bug-for-bug compatible with), so the same files compile in MATLAB via `mex` — **the open-source build path validates the closed-source MATLAB path for free**. We just don't test against MATLAB in CI (per workplan v2 "open-source only" directive).

## Phase B (deferred until Octave-consumer demand)

- `.github/workflows/hecke-engine-octave.yml` builds the MEX files on Linux + macOS runners and uploads them as a release artefact
- Octave Forge package submission
- Auto-discovery of `libhecke_engine_c.so` location (LD_LIBRARY_PATH / DYLD_LIBRARY_PATH handling)

## License

MIT.
