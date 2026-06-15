#!/usr/bin/env python3
"""
hecke_surface.py — Vanilla-Python demo of QOU's canonical H_3(q) surface
at the substrate q_0. Runs under stock CPython OR `sage -python`.

Usage:
    python3 hecke_surface.py            # CPython 3.11+
    sage -python hecke_surface.py       # inside a SageMath install

Demonstrates:
    * Markov-Ocneanu-Wenzl z = 1 / (q^{1/2} + q^{-1/2}) at q_0
      (the knot-theoretic / skein convention used by hecke-engine —
       NOT the Hecke-character convention z_chev = (q^2 - q + 1)/q)
    * H_3(q) Hecke generator-eigenvalue gap h = q - q^{-1} at q_0
    * 6-vector Markov trace weights [1, z, z, z^2, z^2, h*z^2 + z]
      (entry 5 is the longest element e^- = sigma_0 sigma_1 sigma_0,
       which by cyclicity + Hecke relation evaluates to h*z^2 + z,
       NOT z^3 — see docs/audits/2026-05-19-trm5-markov-bug.md)
    * 6x6 Gram matrix G(q_0) (indefinite at the substrate)
    * Wedderburn weights for partitions of n = 1, 2, 3

Output is plain Python floats — no Sage features used here, so the same
script also stands as a smoke test for the pyhecke install. See
sage_iwahori_adjacency.sage for Sage-native cross-checks.
"""

from __future__ import annotations

import sys

try:
    from pyhecke import (
        q_dimension,
        wedderburn_weight,
        partitions_of,
        TR_M,
    )
    from pyhecke.gram import G as gram_matrix_at_q0, nf_tr
    # Use the canonical substrate q from qou-substrate (via the
    # q_parameter shim) so the assertion below stays tight; avoid
    # hardcoding a truncated decimal.
    try:
        from qou_substrate.constants import Q as Q0  # type: ignore[import-not-found]
    except ImportError:
        from q_parameter import Q as Q0  # type: ignore[import-not-found]
except ImportError as e:
    sys.stderr.write(
        f"error: pyhecke not installed: {e}\n"
        "Install: pip install pyhecke   (or: sage -pip install pyhecke)\n"
    )
    sys.exit(1)


def markov_z(q: float) -> float:
    """z = 1 / (q^{1/2} + q^{-1/2}) — knot-theoretic Markov parameter."""
    return 1.0 / (q ** 0.5 + (1.0 / q) ** 0.5)


def hecke_h(q: float) -> float:
    """h = q - 1/q — generator-eigenvalue gap of H_n(q)."""
    return q - 1.0 / q


def trace_weights(q: float) -> list[float]:
    """[1, z, z, z^2, z^2, h*z^2 + z] on the 6-element NF basis.

    Index 5 (longest element e^- = sigma_0 sigma_1 sigma_0) evaluates
    to h*z^2 + z by cyclicity + sigma_0^2 = h*sigma_0 + 1, not z^3.
    See docs/audits/2026-05-19-trm5-markov-bug.md.
    """
    z = markov_z(q)
    h = hecke_h(q)
    return [1.0, z, z, z * z, z * z, h * z * z + z]


def main() -> int:
    print(f"== QOU hecke_surface @ q_0 = {Q0} ==")
    print()

    z = markov_z(Q0)
    h = hecke_h(Q0)
    print(f"  Markov-z(q_0)  = {z:.12f}")
    print(f"  Hecke-h(q_0)   = {h:.12f}")
    print()

    w = trace_weights(Q0)
    print(f"  Trace weights (length {len(w)}):")
    for i, wi in enumerate(w):
        print(f"    w[{i}] = {wi:.12f}")
    print()

    print("  Gram matrix G(q_0) (6x6):")
    G = gram_matrix_at_q0
    for row in G:
        print("    " + "  ".join(f"{x:+.6f}" for x in row))
    print()

    # Partition cross-check: just emit n=1,2,3 with q-dim and Wedderburn weight.
    # q_dimension / wedderburn_weight evaluate at the global substrate q_0
    # automatically — no explicit q argument needed.
    print("  Partition data:")
    for n in (1, 2, 3):
        print(f"    n = {n}:")
        for lam in partitions_of(n):
            qd = q_dimension(lam)
            ww = wedderburn_weight(lam)
            print(f"      λ = {lam}  q-dim = {qd:.9f}  w_λ = {ww:.9f}")
    print()

    # Trace weights cross-check: TR_M is the canonical 6-vector of
    # Markov-trace weights on the NF basis. TR_M[i] equals the i-th
    # entry of `trace_weights(q_0)` above.
    print(f"  TR_M[1] = {TR_M[1]:.12f}  (== z above)")
    assert abs(TR_M[1] - z) < 1e-9, "TR_M disagrees with markov_z"

    # nf_tr on a unit vector e_1 = (0,1,0,0,0,0) recovers TR_M[1]
    e1 = [0.0, 1.0, 0.0, 0.0, 0.0, 0.0]
    print(f"  nf_tr(e_1) = {nf_tr(e1):.12f}")

    print()
    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
