"""IsotopeRecord schema + KnotOperatorCatalogue indexing.

Phase 1 of the all-atoms / all-isotopes atlas extension
(`docs/audits/2026-05-18-all-atoms-isotopes-plan.md`).

The schema is a Python dataclass for the registry / probe-side;
mirrored as a content block on the .ts side once the layer-1
canonical pipeline ships.

## Records exposed

  IsotopeRecord — per-(Z, N) atomic identification + braid word +
    canonical |tr_M(q_0)| + prediction + AME residual
  KnotOperatorCatalogue — per-step knot operator (intra-nucleon,
    inter-nucleon, closure, fusion)

## Sources of truth

  - Braid word: `mass_at_3A_proper.atom_braid_word_3A(Z, N)` via
    `canonical_braid_crossings.atom_canonical_crossings(Z, N)`
  - y_λ cache: `y-lambda-at-q0.witness.json` (n ∈ 2..21)
  - χ^λ cache: `chi-{atom}-h{n}-at-q0-50dps.witness.json` per atom
  - Substrate anchors: `q_parameter.Q_50_DIGIT_STR`, `m_e`, ...

Witness output (built by `atom_knot_atlas_registry.py`, follow-up):
  `atom-knot-atlas-registry.witness.json` — per-atom records keyed
  by (Z, N).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class PredictionMethod(str, Enum):
    """How a per-isotope prediction was obtained — per the atlas layer plan."""

    CANONICAL_TRACE = "canonical-trace"            # Layer 1 — Σ y_λ · χ^λ
    ALPHA_CLUSTER = "alpha-cluster"                # Layer 2 — recursive on ⁴He
    HYBRID_VALENCE = "hybrid-valence"              # Layer 3 — α + valence nucleon
    BRANE_TOWER_ASYMPTOTIC = "brane-tower"         # Layer 4 — A > 40
    PREDICTION_ONLY = "prediction-only"            # Layer 5 — no AME measurement
    VOLUME_MATCH_DEPRECATED = "volume-match-deprecated"


class CalibrationSource(str, Enum):
    """The three calibration anchors per `prop:three-calibration-inputs`."""

    CAL_1 = "CAL-1"  # electron mass m_e
    CAL_2 = "CAL-2"  # substrate parameter q_0
    CAL_3 = "CAL-3"  # Q_β(neutron) = m_n - m_p - m_e


class KnotOperatorType(str, Enum):
    """Per-step knot operator class."""

    INTRA_NUCLEON = "intra-nucleon"      # σ_0 g_0 + σ_1 g_1 per nucleon
    INTER_NUCLEON = "inter-nucleon"      # pp / nn / pn at gen 3k+2
    CLOSURE_TOPOLOGY = "closure-topology"  # Markov closure
    FUSION = "fusion"                    # α-α, α-N coupling
    VACUUM = "vacuum"                    # vortex / unknot


class CrossingType(str, Enum):
    """The 3 crossing conventions used in the canonical atomic braid."""

    SIGMA = "sigma"            # positive crossing (c=1, d=0)
    SIGMA_INV = "sigma_inv"    # negative crossing (c=1, d=-h)
    AVERAGED = "averaged"      # half-sum (c=1, d=-h/2)


@dataclass(frozen=True)
class KnotOperatorCatalogue:
    """A single knot operator applied at a definite location in the
    canonical braid word."""

    op_type: KnotOperatorType
    gen_index: int                # 0-based braid-group generator
    crossing_type: Optional[CrossingType] = None
    nucleon_type: Optional[str] = None   # "p" / "n" — for intra blocks
    interface_channel: Optional[str] = None  # "pp" / "nn" / "pn"
    canonical_form_label: Optional[str] = None  # e.g. "trefoil(3_1)"
    witness_ref: Optional[str] = None    # path to provenance witness


@dataclass(frozen=True)
class IsotopeRecord:
    """Canonical record for a single isotope (Z, N)."""

    Z: int
    N: int
    A: int                                            # = Z + N
    n_strands: int                                    # = 3 · A
    spin_J: Optional[float] = None
    parity: Optional[str] = None                      # "+" / "-"

    # Braid identification
    braid_word_canonical: list[tuple[int, str]] = field(default_factory=list)
    markov_closure: Optional[str] = None              # knot/link identifier
    knot_operators: list[KnotOperatorCatalogue] = field(default_factory=list)

    # Trace / prediction
    tr_M_q0_canonical_50dps: Optional[str] = None     # |tr_M(β_atom, q_0)|
    wedderburn_blocks_active: list[tuple[int, ...]] = field(default_factory=list)
    prediction_method: PredictionMethod = PredictionMethod.CANONICAL_TRACE
    calibration_source: CalibrationSource = CalibrationSource.CAL_1
    prediction_MeV_50dps: Optional[str] = None        # binding energy

    # Empirical comparison — UNIFIED semantics per user directive
    # 2026-05-19: prediction_MeV_50dps / B_AME_MeV / err_MeV are
    # polymorphic on `prediction_type`:
    #   - "binding_energy" (D and up): prediction = B_pred,
    #     B_AME_MeV = AME binding energy.
    #   - "mass" (p, n): prediction = Borromean tower nucleon mass,
    #     B_AME_MeV = CODATA nucleon mass (overloaded field).
    # err_MeV = prediction − B_AME_MeV in either case.
    # err_ppm scales the relative error to parts-per-million (useful
    # primarily for the mass case where ppm is the natural unit).
    prediction_type: str = "binding_energy"
    B_AME_MeV: Optional[float] = None
    err_MeV: Optional[float] = None
    err_pct: Optional[float] = None
    err_ppb: Optional[float] = None
    err_ppm: Optional[float] = None

    # Provenance
    derivation_chain_witness: Optional[str] = None
    chi_cache_witness: Optional[str] = None
    y_lambda_cache_witness: str = "y-lambda-at-q0.witness.json"

    def to_dict(self) -> dict:
        """JSON-serialisable form for witness output."""
        return {
            "Z": self.Z, "N": self.N, "A": self.A,
            "n_strands": self.n_strands,
            "spin_J": self.spin_J, "parity": self.parity,
            "braid_word_canonical": list(self.braid_word_canonical),
            "markov_closure": self.markov_closure,
            "knot_operators": [
                {
                    "op_type": k.op_type.value,
                    "gen_index": k.gen_index,
                    "crossing_type": (
                        k.crossing_type.value if k.crossing_type else None
                    ),
                    "nucleon_type": k.nucleon_type,
                    "interface_channel": k.interface_channel,
                    "canonical_form_label": k.canonical_form_label,
                    "witness_ref": k.witness_ref,
                }
                for k in self.knot_operators
            ],
            "tr_M_q0_canonical_50dps": self.tr_M_q0_canonical_50dps,
            "wedderburn_blocks_active": [list(p) for p in self.wedderburn_blocks_active],
            "prediction_method": self.prediction_method.value,
            "calibration_source": self.calibration_source.value,
            "prediction_type": self.prediction_type,
            "prediction_MeV_50dps": self.prediction_MeV_50dps,
            "B_AME_MeV": self.B_AME_MeV,
            "err_MeV": self.err_MeV,
            "err_pct": self.err_pct,
            "err_ppb": self.err_ppb,
            "err_ppm": self.err_ppm,
            "derivation_chain_witness": self.derivation_chain_witness,
            "chi_cache_witness": self.chi_cache_witness,
            "y_lambda_cache_witness": self.y_lambda_cache_witness,
        }


# ─── Knot-operator primitives (the catalogue) ─────────────────────────

CANONICAL_INTRA_PROTON = "proton intra: σ_0 σ_0 σ_0 (trefoil at 3-strand block)"
CANONICAL_INTRA_NEUTRON = "neutron intra: σ_0⁻¹ σ_0⁻¹ σ_0⁻¹ (mirror trefoil)"

CANONICAL_INTERFACE_PP = "pp coupling: σ at gen 3k+2 (positive)"
CANONICAL_INTERFACE_NN = "nn coupling: σ + (-h)·𝟙 at gen 3k+2"
CANONICAL_INTERFACE_PN = "pn coupling: σ + (-h/2)·𝟙 at gen 3k+2 (averaged)"

CANONICAL_CLOSURES = {
    (1, 0): "trefoil 3_1 = T(2,3)",                      # proton/electron
    (0, 1): "trefoil 3_1 = T(2,3)",                      # neutron
    (1, 1): "K_{6_2} (hyperbolic, vol 4.4008)",          # deuteron
    (1, 2): "K_{8_11} (hyperbolic, vol 8.2863)",         # tritium
    (2, 1): "L_{6a4} (link, vol 7.3277)",                # ³He
    (2, 2): "magic A·8G shell (no single knot)",         # ⁴He
}


def build_knot_operator_catalogue(Z: int, N: int) -> list[KnotOperatorCatalogue]:
    """Build a COARSE per-slot knot-operator catalogue for the
    canonical (Z, N) atomic braid.

    **Coarse summary, not the full wire-format word.** Per Copilot review
    on PR #708: `mass_at_3A_proper.atom_braid_word_3A` expands each
    nucleon slot (3k, 3k+1) into a SEQUENCE of (c, d) operations from
    `_PROTON_G0` / `_PROTON_G1` / `_NEUTRON_G0` / `_NEUTRON_G1` —
    typically 11 crossings per nucleon block. This function emits ONE
    entry per slot summarising the slot's dominant crossing type
    (σ for proton, σ⁻¹ for neutron), suitable for the IsotopeRecord
    catalogue overview.

    For the full step-by-step (c, d, gen) word, use
    `atom_canonical_crossings(Z, N)` from `canonical_braid_crossings.py`
    — that is the runtime source of truth and is stored separately on
    the IsotopeRecord as `braid_word_canonical`.

    Layout (per-slot summary):

      For each nucleon k = 0..A-1 (ordering: protons first, then neutrons):
        - intra summary at base 3k    (σ_0)
        - intra summary at base 3k+1  (σ_1)
      For each adjacent pair k, k+1 with k < A-1:
        - interface at gen 3k+2 (pp / nn / pn depending on types)
    """
    A = Z + N
    ordering = ["p"] * Z + ["n"] * N
    ops: list[KnotOperatorCatalogue] = []

    for k, nuc in enumerate(ordering):
        base_g0 = 3 * k
        base_g1 = 3 * k + 1
        ops.append(KnotOperatorCatalogue(
            op_type=KnotOperatorType.INTRA_NUCLEON,
            gen_index=base_g0,
            crossing_type=(
                CrossingType.SIGMA if nuc == "p" else CrossingType.SIGMA_INV
            ),
            nucleon_type=nuc,
            canonical_form_label=(
                CANONICAL_INTRA_PROTON if nuc == "p" else CANONICAL_INTRA_NEUTRON
            ),
        ))
        ops.append(KnotOperatorCatalogue(
            op_type=KnotOperatorType.INTRA_NUCLEON,
            gen_index=base_g1,
            crossing_type=(
                CrossingType.SIGMA if nuc == "p" else CrossingType.SIGMA_INV
            ),
            nucleon_type=nuc,
        ))
        if k < A - 1:
            next_nuc = ordering[k + 1]
            if nuc == "p" and next_nuc == "p":
                channel, ctype, label = "pp", CrossingType.SIGMA, CANONICAL_INTERFACE_PP
            elif nuc == "n" and next_nuc == "n":
                channel, ctype, label = "nn", CrossingType.SIGMA_INV, CANONICAL_INTERFACE_NN
            else:
                channel, ctype, label = "pn", CrossingType.AVERAGED, CANONICAL_INTERFACE_PN
            ops.append(KnotOperatorCatalogue(
                op_type=KnotOperatorType.INTER_NUCLEON,
                gen_index=3 * k + 2,
                crossing_type=ctype,
                interface_channel=channel,
                canonical_form_label=label,
            ))

    # Final closure operator
    closure_label = CANONICAL_CLOSURES.get((Z, N), f"closure(Z={Z}, N={N}) — TBD")
    ops.append(KnotOperatorCatalogue(
        op_type=KnotOperatorType.CLOSURE_TOPOLOGY,
        gen_index=-1,
        canonical_form_label=closure_label,
    ))
    return ops


def main() -> int:
    """Smoke-test: build catalogues for the canonical atoms."""
    print("=" * 80)
    print(f"  IsotopeRecord schema — smoke test")
    print("=" * 80)
    print()

    for Z, N, label in [
        (1, 0, "p"), (0, 1, "n"), (1, 1, "D"),
        (1, 2, "T"), (2, 1, "³He"), (2, 2, "⁴He"),
        (3, 2, "⁵Li"), (3, 3, "⁶Li"),
    ]:
        A = Z + N
        n = 3 * A
        ops = build_knot_operator_catalogue(Z, N)
        record = IsotopeRecord(
            Z=Z, N=N, A=A, n_strands=n,
            knot_operators=ops,
            markov_closure=CANONICAL_CLOSURES.get((Z, N)),
        )
        print(f"  {label:>3}  Z={Z}  N={N}  n={n:>3}  ops={len(ops):>3}  "
              f"closure={record.markov_closure}")
        # Show first 3 + last op
        for op in ops[:3]:
            print(f"      [{op.gen_index:>2}] {op.op_type.value:<18} "
                  f"{(op.crossing_type.value if op.crossing_type else '-'):<10} "
                  f"{op.nucleon_type or op.interface_channel or '-'}")
        if len(ops) > 3:
            print(f"      ... ({len(ops) - 4} more) ...")
            last = ops[-1]
            print(f"      [{last.gen_index:>2}] {last.op_type.value:<18} "
                  f"{last.canonical_form_label}")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
