# pyhecke

> *Part of the [QOU library stack](../https://github.com/litlfred/qou/blob/main/docs/ARCHITECTURE.md#two-axes-of-organisation-domain-vs-workflow). See the two-axis explanation for how this package fits relative to the in-repo `folio-assistant/computations/` clusters.*

Hecke algebra + Gram matrix + tower binding infrastructure for the QOU
paper pipeline. Carve-out of the 3425-line
`folio-assistant/computations/hecke_core.py` into a proper package.

## Scope (M1)

Pure-Python re-exports plus JSON Schema validation. No PyO3, no Rust
bindings yet — those arrive in M3. Subprocess dispatch to the existing
Rust `tools/hecke-engine/` binaries stays intact.

## Modules

| Module | Purpose |
|--------|---------|
| `pyhecke.gram` | Gram matrix `G`, inverse `G_INV`, NF multiplication |
| `pyhecke.wedderburn` | Partition utilities, q-dimension, Wedderburn weights |
| `pyhecke.partition` | Young partitions, q-hook, LP shadow prices |
| `pyhecke.trace` | Markov trace (numeric + mpmath arbitrary precision) |
| `pyhecke.tower` | Φ_q tower, symbolic V̂, CRT reconstruction stubs |
| `pyhecke.certificate` | Load + validate `certificate-*.json` |
| `pyhecke.bridge` | Subprocess dispatch to Rust `hecke-engine` binaries |
| `pyhecke.schema` | JSON Schema validators (cert + witness) |
| `pyhecke.crt` | CRT polynomial reconstruction (Track A) |

## Install

```bash
cd tools/pyhecke
pip install -e .[test]
pytest
```

## Legacy compatibility

`folio-assistant/computations/pyhecke.py` is a re-export shim so existing
scripts using `sys.path.insert(…)` keep working unchanged.

## Milestones

- **M1** (this release): carve-out + schemas + Python-only CI.
- **M2**: migrate 18 Gram sites + Track B `undo_to_quark(level)` +
  PyO3 accelerator + unified `hecke` CLI.
- **M3**: Track C multi-level SDP (levels 4-7) + Rust `gram.rs` +
  regenerate 51 certificates + publish wheels.

See `INFRASTRUCTURE-AUDIT.md` and the top-level plan file for the
three-track alignment (A = symbolic/CRT, B = undo_to_quark, C =
multi-level SDP).
