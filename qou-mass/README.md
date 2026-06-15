# qou-mass

> *Part of the [QOU library stack](https://github.com/litlfred/qou/blob/main/docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

> **Quantum Observable Universe — mass-prediction library.**
> Compute |tr_M(β_atom, q₀)|, binding energies, and nucleon masses
> from the canonical-derivation pipeline.

This library is the extracted, distributable form of the mass-prediction
pipeline that lives in the [QOU paper repo](https://github.com/litlfred/qou).
It packages the canonical Markov-trace + Borromean-tower compute paths
into a small Python API so external researchers can run their own
explorations without setting up the full paper repository.

**Status: pre-release `v0.1.0a1`. The API may change before `v0.1.0`.**

## Quickstart

```bash
pip install qou-mass
```

```python
from qou_mass import predict, compute_tr_M

# Binding-energy prediction for ⁴He
result = predict("4He")
print(result.value, result.units, f"({result.ppm_vs_codata} ppm)")
# → 28.295... MeV (236000 ppm — current canonical L1 sits at ~5.9%)

# Raw Markov trace magnitude
compute_tr_M(Z=2, N=2, precision_dps=50)
# → Decimal('0.0553483458766979...')

# Full witness with provenance
result.witness.to_json("4he.witness.json")
```

## Public API

| Function | Returns | Notes |
|---|---|---|
| `predict(atom, observable="binding_energy", ...)` | `Prediction` | Top-level entry point |
| `predict_nucleon(particle, ...)` | `Prediction` | `"p"`, `"n"`, `"mu"` via Borromean tower |
| `compute_tr_M(Z, N, ...)` | `Decimal` | Raw \|tr_M(β_atom, q_0)\| |
| `canonical_braid(Z, N)` | `BraidWord` | Introspection |
| `predict_table(atoms, ...)` | `list[Prediction]` | Batch convenience |

See [`src/qou_mass/api.py`](src/qou_mass/api.py) for full signatures.

## Backends

| Backend | When | Speed |
|---|---|---|
| `python_mpmath` (default) | always available | ⁴He ≈ 10 s, ⁶Li ≈ 17 min |
| `rust` (opt-in) | when `hecke-canonical-chi` binary is on `$PATH` | ⁴He ≈ 0.5 s, ⁶Li ≈ 90 s |

The Rust binary lives in [`tools/hecke-engine/`](https://github.com/litlfred/qou/tree/main/tools/hecke-engine)
in the paper repo. Pre-built artifacts are published on GitHub Releases.

```bash
export QOU_MASS_RUST_BIN=/path/to/hecke-canonical-chi
python -c "from qou_mass import compute_tr_M; print(compute_tr_M(2, 2, backend='rust'))"
```

## What the library predicts

- **Binding energies** (`B_pred`) for D, T, ³He, ⁴He, ⁵Li, ⁶Li — at 0.16–5.87 %
  via the Layer-1 canonical pipeline (`markov_peel + mpmath`).
- **Nucleon masses** (m_p, m_n, m_μ) at **0.25 ppm** via the Borromean tower,
  conditional on `conj:borromean-baryon-mass-formula`.
- **|tr_M(β_atom, q_0)|** at 50 dps for any (Z, N) — the raw Markov-trace
  observable that feeds every downstream prediction.

Heavy isotopes (⁸Be → ⁴⁰Ca) and odd-A neighbours are covered via the
α-cluster recursion and paper-six-term sweep — accessible via
`method="alpha_cluster"` but flagged with deprecation warnings.

## Witness output

Every call with `emit_witness=True` writes a JSON conforming to the
[QOU witness schema](https://github.com/litlfred/qou/tree/main/folio-assistant/schemas)
— full provenance (`engine`, `scriptFile`, `commitSha`, parameters,
upstream sha256 chain).

## License

See [`LICENSE`](https://github.com/litlfred/qou/blob/main/LICENSE) in the
paper repo.

## Citation

If you use `qou-mass` in academic work, please cite the QOU paper:

> Smith, S. Q. *Quantum Observable Universe.* In preparation, 2026.
> https://github.com/litlfred/qou
