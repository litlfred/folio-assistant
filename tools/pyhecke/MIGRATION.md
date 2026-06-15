# pyhecke migration guide

After M2b (commit `f091636`), `pyhecke.gram` owns the authoritative
definitions of the Gram matrix, NF basis, Wedderburn weights, and
NF multiplication for H₃(q). This document lists the 17 scripts
under `folio-assistant/computations/` that still carry local copies
of those primitives, and shows the precise import swap for each.

**When to run each migration:** only after CI (`.github/workflows/
pyhecke.yml` + the witness-diff gate described below) is
functional, so witness-JSON outputs can be diffed before/after to
prove no numerical regression.

## Import swap template

Every migration follows the same pattern:

```diff
-z = 1.0 / (q0**0.5 + q0**(-0.5))
-NF_BASIS = [(), (0,), (1,), (0, 1), (1, 0), (0, 1, 0)]
-NF_NAMES = ["γ", "σ₀", "σ₁", "L₊", "L₋", "e⁻"]
-TR_M_BASIS = [1.0, z, z, z**2, z**2, z**3]
+from pyhecke.gram import z, NF_BASIS, NF_NAMES, TR_M as TR_M_BASIS
```

and for Hecke multiplication + reduction:

```diff
-def hecke_mul(t1, t2): ...
-def reduce_nf(terms): ...
+from pyhecke.gram import _hm_dict as hecke_mul, _reduce_nf as reduce_nf
```

## Per-script migration

| # | Script | Local duplicates | Imports to add | Risk |
|:--:|:--|:--|:--|:--:|
| 1 | `gram-matrix-dual.py` | `z`, `NF_BASIS`, `NF_NAMES`, `TR_M_BASIS`, `hecke_mul`, `reduce_nf`, local `G` fill | `z`, `NF_BASIS`, `NF_NAMES`, `TR_M`, `G`, `_hm_dict`, `_reduce_nf` | low |
| 2 | `atom_mass_gram_full.py` | imports `alpha_em` from `hecke_core` only | rewrite to `from pyhecke.gram import G, G_INV` + keep `alpha_em` import | low |
| 3 | `atom_mass_functionals.py` | none (no Gram code) | none — skip | n/a |
| 4 | `atom_mass_combined.py` | none | none — skip | n/a |
| 5 | `atom_mass_integrated.py` | `z`, `TR_M_3 = [1.0, z, z, z**2, z**2, z**3]` | `z`, `TR_M as TR_M_3` | low |
| 6 | `atom_frobenius_volume.py` | uses snappy volumes only; not a Gram site | none — remove from list | n/a |
| 7 | `atom_vol_hecke_unified.py` | uses snappy volumes only | none — remove from list | n/a |
| 8 | `confinement-lp.py` | local `G_build()` via subprocess to Rust | replace with `from pyhecke.gram import G` | medium |
| 9 | `nuclear-binding-lp.py` | local `G_build()` via subprocess | replace with `from pyhecke.gram import G` | medium |
| 10 | `qvalue-garside-gram.py` | local Garside-ordered Gram | add `from pyhecke.gram import G` as reference; keep Garside variant separate | medium |
| 11 | `hecke_startup_cache.py` | imports from `hecke_core` (works post-inversion) | change `from hecke_core import G, G_INV, W_SYM, W_STD, W_ALT, z, hm, hm_exact, TR_M, NF_BASIS, NF_NAMES` → `from pyhecke.gram import ...` | low |
| 12 | `sdp_cross_channel.py` | imports from `hecke_core` | change selected lines to `from pyhecke.gram import partitions_of, partition_dimension` (if those moved) or keep — not Gram critical | low |
| 13 | `toffoli-lp-stability.py` | local 6×6 Gram built from trace weights | `from pyhecke.gram import G, G_INV, TR_M` | low |
| 14 | `sigma_shell_characterization.py` | imports from `mass_endomorphism` | no Gram change needed; partition LP stays local | n/a |
| 15 | `multi_level_sdp.py` | imports from `mass_endomorphism` | no Gram change needed | n/a |
| 16 | `misdp_cross_channel.py` | imports from `mass_endomorphism` | no Gram change needed | n/a |
| 17 | `sdp_on_shadows.py` | imports from `sigma_shell_characterization` | no Gram change needed | n/a |

### Added from post-rebase upstream (main)

| # | Script | Local duplicates | Imports to add | Risk |
|:--:|:--|:--|:--|:--:|
| 18 | `atom-stability-check.py` | local 6×6 `G = np.zeros((6, 6))` fill | `from pyhecke.gram import G, TR_M` | low |
| 19 | `ch-bond-lp.py` | local Gram build | `from pyhecke.gram import G, G_INV` | medium |
| 20 | `confinement-operator-selection.py` | local Gram | `from pyhecke.gram import G` | low |
| 21 | `four-term-photon-to-atoms.py` | local Gram | `from pyhecke.gram import G` | medium |
| 22 | `knot-ops-on-6he.py` | local Gram | `from pyhecke.gram import G, TR_M` | low |
| 23 | `molecular-frobenius-lp.py` | local Gram via LP basis | `from pyhecke.gram import G, G_INV` | medium |
| 24 | `pn_alpha_lp_dual.py` | local Gram | `from pyhecke.gram import G, G_INV` | medium |
| 25 | `tbeta-dual-action.py` | local Gram | `from pyhecke.gram import G, TR_M` | low |
| 26 | `tower-qvalues.py` | local Gram | `from pyhecke.gram import G, TR_M` | medium |

**Net scope:** 14 real migration sites across the 26 surveyed
(`atom_mass_functionals`, `atom_mass_combined`, `atom_frobenius_volume`,
`atom_vol_hecke_unified`, `sigma_shell_characterization`,
`multi_level_sdp`, `misdp_cross_channel`, `sdp_on_shadows` remain
struck). Low-risk = 6, medium-risk = 8.

## Verification protocol (per site)

For every migrated script:

```bash
# 1. Capture baseline witness
cp folio-assistant/computations/${script_base}.witness.json /tmp/baseline.json

# 2. Apply the migration edit.

# 3. Re-run the script
cd folio-assistant/computations && python3 ${script}

# 4. Diff the witness (ignoring timestamp + duration fields)
diff <(jq 'del(.computedAt, .durationMs, .commitSha, .scriptCommitSha, .scriptHash)' /tmp/baseline.json) \
     <(jq 'del(.computedAt, .durationMs, .commitSha, .scriptCommitSha, .scriptHash)' \
          folio-assistant/computations/${script_base}.witness.json)
# Empty diff = migration safe.
```

## Rollback

Every migration is a single import change. Revert is:

```bash
git checkout HEAD~1 -- folio-assistant/computations/<script>
```

## Phasing

- **Phase 1** (next clean session + CI budget): migrate the 3 zero-
  risk sites — `hecke_startup_cache.py`, `atom_mass_integrated.py`,
  `toffoli-lp-stability.py`.
- **Phase 2**: migrate `gram-matrix-dual.py`, `atom_mass_gram_full.py`.
- **Phase 3**: migrate the LP/SDP sites (8, 9, 10). These are
  medium-risk because they subprocess to Rust; any mismatch between
  Python Gram and Rust Gram surfaces as a witness diff.

## Reasoning for deferring execution

CI billing is currently out, so witness-diff verification isn't
available. Doing 9 edits blind would be an unconfirmed cosmetic
swap with non-zero regression risk. The M2b inversion already
captures the architectural value (single source of truth); the
bulk-site migration is hygiene and can safely wait.
