# pyhecke-native

> *Part of the [QOU library stack](../https://github.com/litlfred/qou/blob/main/docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

PyO3 native acceleration layer for `pyhecke`.

Exposes zero-copy Rust implementations of the hottest H_n(q) kernels
as a Python extension module `pyhecke_native`, built via maturin.

## Functions

```python
pyhecke_native.gram_matrix(q: float) -> list[list[float]]
pyhecke_native.gram_determinant(q: float) -> float
pyhecke_native.markov_z(q: float) -> float
pyhecke_native.hecke_h(q: float) -> float
pyhecke_native.trace_weights(q: float) -> list[float]
```

## Build

Requires [maturin](https://www.maturin.rs) and a working Rust toolchain.

```bash
pip install maturin
cd tools/pyhecke-native
maturin develop --release
```

or for a distributable wheel:

```bash
maturin build --release
# produces target/wheels/pyhecke_native-*.whl
```

## Use from pyhecke

`pyhecke.bridge` automatically discovers and uses `pyhecke_native` when
it is importable, and falls back to subprocess dispatch (and then
pure-Python) otherwise. No caller-side changes are needed.

## Why a separate crate?

The pure-Python `pyhecke` package uses hatchling so `pip install -e .`
works with no Rust toolchain. The native acceleration lives in this
sibling crate, which requires maturin and Rust. Users who want speed
opt in; users who only want correctness get the pure-Python path by
default.
