# sage-examples — SageMath integration for QOU's hecke-engine

> *Part of the [QOU library stack](../../docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

[SageMath](https://www.sagemath.org/) ships with a CPython interpreter,
so the existing `pyhecke` package installs and runs natively:

```sh
sage -pip install pyhecke
```

**No bindings layer needed.** This directory is examples, not a wrapper
package. It demonstrates the canonical surface from a Sage REPL /
notebook and shows two cross-checks against Sage's own representation-
theory infrastructure (Iwahori-Hecke algebra, Specht modules, symmetric
functions).

## What's in here

| Path | Purpose |
|---|---|
| `scripts/hecke_surface.py` | Vanilla-Python demo of the canonical surface at `q_0` — runs in stock Python OR `sage -python` |
| `scripts/sage_iwahori_adjacency.sage` | Sage-native: compare QOU's substrate-`q` Markov trace vs Sage's `IwahoriHeckeAlgebra(A2, q)` specialised to `q_0` |
| `scripts/sage_partition_q_dim.sage` | Sage-native: cross-check `pyhecke.q_dimension` against `SymmetricFunctions(Z[q])` q-analogue computations |
| `notebooks/hecke_surface_demo.ipynb` | Jupyter-notebook walkthrough (open via `sage -n jupyter`) |

## Why Sage?

- **Symbolic Iwahori-Hecke algebra in core Sage.** `IwahoriHeckeAlgebra(W, q)` builds H_n(q) symbolically over `Z[q, q^{-1}]`; QOU evaluates the same algebra at the substrate `q_0`. Comparing the two at common test points validates both implementations.
- **Symmetric functions / partitions / Young tableaux** all native — no extra installs needed for Wedderburn cross-checks.
- **Jupyter-notebook ecosystem** for interactive exposition.

## Install

```sh
# 1. Pick up the pyhecke wheel from PyPI (or from a local build)
sage -pip install pyhecke

# 2. Run a vanilla-Python script (no Sage features used)
sage -python scripts/hecke_surface.py

# 3. Run a Sage-native script
sage scripts/sage_iwahori_adjacency.sage

# 4. Launch the notebook
sage -n jupyter notebooks/hecke_surface_demo.ipynb
```

## Why not a `sage-hecke` package?

Sage's package mechanism (`sage --pip`) is the same Python wheel install
used everywhere else; there is no value in republishing `pyhecke` under
a `sage-*` name. Authors who want to use the engine inside a `.sage`
file just do `from pyhecke import …` and call `q_dimension`,
`wedderburn_weight`, `partitions_of`, etc. directly.

The right packaging story for Sage-specific *adjacency* work (e.g. a
`sage.combinat.hecke_qou` module that exposes QOU's numerical
specialisation as a method on `IwahoriHeckeAlgebra`) is upstream
contribution into Sage itself, not a fork. This is Phase B work; the
scripts here are the prototype evidence.

## Phase B (deferred until Sage-consumer demand)

- Submit a `sage.combinat.hecke_qou` patch upstream (depends on `pyhecke` being on PyPI).
- Wrap `pyhecke.lp_dual_solver.solve_operator_selection_lp` with Sage's `MixedIntegerLinearProgram` interface for symbolic shadow-price reasoning.
- Hook `pyhecke.tower.tr_M_atomic_mpfr` into Sage's `RealField(prec=…)` so the precision metadata round-trips.

## Dependencies

- SageMath 10.0+ (Python 3.11+)
- `pyhecke` (from PyPI, or `pip install -e ../pyhecke/python/`)
- Optional: `qou-substrate`, `witness-schema` for the witness-validation demos

## License

MIT.
