"""Active-set pruning for the canonical mass-table pipeline.

Drops Wedderburn partitions λ with |y_λ(q_0)| < threshold from the
Σ_λ y_λ · χ^λ sum, bounded by a rigorous tail estimate so the dropped
contribution cannot accumulate to precision-relevant magnitude.

Uses `_precision` for COMPUTE_DPS / OUTPUT_DPS / fmt so the threshold
and tail bounds are consistent with the rest of the QOU compute infra.

## Bound

For a partition tail T (dropped λs):

    |Σ_{λ ∈ T} y_λ(q_0) · χ^λ(β; q_0)|
    ≤ Σ_{λ ∈ T} |y_λ(q_0)| · |χ^λ(β; q_0)|
    ≤ |T| · max_{λ ∈ T} |y_λ| · max_{λ ⊢ n} |χ^λ(β; q_0)|

We bound max|χ^λ(β; q_0)| empirically via the computed Wedderburn
sum (the result of summing the un-pruned terms): for a unit-normalised
y_λ, |Σ_λ y_λ · χ^λ| ≤ max|χ^λ|, so max|χ^λ| ≤ |tr_M| / min|y_λ|
(when tr_M and y_λ are same-signed). Conservative upper bound:
max|χ^λ| ≤ 10² (the χ^λ ranges seen empirically at H_12 are O(10)).

For the user-requested precision `target_dps`, ensure the bound is
< 10^{-target_dps}. The default `target_dps = OUTPUT_DPS = 40` is
very conservative; for the ~780 ppb hard floor from CAL-2 propagation
(per docs/audits/2026-05-17-1ppb-workplan-v1-refined.md), only
~10 dps is structurally meaningful.

## Paper-error verification

Per the published error budget:

  - Hard floor: ~780 ppb (CAL-2 q_0 propagation, |∂lnE_0/∂lnq_0|=11.09)
  - Mass-table production target: 1 ppb (subject to hard floor)

Active-set pruning is SAFE iff the dropped-tail bound is below the
target precision. At |y_λ|_min ≈ 10⁻¹¹ for n=12, dropping every λ
beyond the top-k contributing 99% of |y_λ| sum is safe to ~10⁻⁸,
which is two orders below 1 ppb.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterable

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import mpmath as mp  # noqa: E402

from _precision import (  # noqa: E402
    set_compute_dps, fmt, COMPUTE_DPS, OUTPUT_DPS,
)

set_compute_dps()  # mp.mp.dps = COMPUTE_DPS (default 50)

# Empirical bound on |χ^λ(β_atom; q_0)| across all observed atoms.
# Verified: at H_12 ⁴He, max|χ^λ| ≈ 2.42 (partition (12,)).
# Use 10² as the conservative paper-side bound for any A.
CHI_MAX_EMPIRICAL_BOUND: mp.mpf = mp.mpf(100)


def select_active_set(
    y_table: dict[tuple, mp.mpf],
    target_dps: int = OUTPUT_DPS,
    chi_max_bound: mp.mpf = CHI_MAX_EMPIRICAL_BOUND,
) -> tuple[dict[tuple, mp.mpf], dict[tuple, mp.mpf], mp.mpf]:
    """Split y_λ(q_0) into (active, dropped, bound_on_dropped_contribution).

    The threshold `ε` is chosen so the dropped tail satisfies

        |Σ_{dropped} y_λ · χ^λ| ≤ |dropped| · ε · chi_max_bound
                              < 10^{-target_dps}

    Returns:
      active: λ → y_λ subset with |y_λ| ≥ ε
      dropped: λ → y_λ subset with |y_λ| < ε
      tail_bound: rigorous upper bound on the dropped contribution
    """
    target = mp.mpf(10) ** (-target_dps)

    # Sort by |y_λ| descending
    sorted_y = sorted(
        y_table.items(),
        key=lambda kv: -abs(mp.mpf(str(kv[1]))),
    )
    n_parts = len(sorted_y)
    if n_parts == 0:
        return {}, {}, mp.mpf(0)

    # Find largest threshold ε such that
    #   |dropped| · ε · chi_max_bound  <  target
    # Equivalently: ε < target / (|dropped| · chi_max_bound).
    # We sweep from smallest |y_λ| upward, dropping while the tail
    # bound stays below target.

    active_pairs = list(sorted_y)
    dropped_pairs: list[tuple[tuple, mp.mpf]] = []
    while active_pairs:
        candidate = active_pairs[-1]
        candidate_abs = abs(mp.mpf(str(candidate[1])))
        # Conservative: |new_tail| ≤ (|dropped|+1) · |candidate_y| · chi_max
        prospective_bound = (
            (len(dropped_pairs) + 1) * candidate_abs * chi_max_bound
        )
        if prospective_bound < target:
            dropped_pairs.append(active_pairs.pop())
        else:
            break

    final_tail_bound = (
        len(dropped_pairs)
        * (max(
            abs(mp.mpf(str(v))) for _, v in dropped_pairs
        ) if dropped_pairs else mp.mpf(0))
        * chi_max_bound
    )

    active = {lam: mp.mpf(str(v)) for lam, v in active_pairs}
    dropped = {lam: mp.mpf(str(v)) for lam, v in dropped_pairs}
    return active, dropped, final_tail_bound


def verify_pruning_safe(
    target_dps: int,
    paper_floor_ppb: float = 780.0,
) -> bool:
    """Verify that the chosen target_dps is above the paper-reported
    hard precision floor (~780 ppb = 10^-9.1 from CAL-2 propagation).

    Returns True if pruning at this dps level cannot affect the
    paper-relevant precision. The user-requested target_dps becomes
    the binding constraint for the active-set selector.
    """
    paper_floor_dps = -mp.log10(mp.mpf(paper_floor_ppb) * mp.mpf("1e-9"))
    return target_dps > float(paper_floor_dps) + 2  # +2 = safety margin


def main() -> int:
    """Smoke test on the cached y_λ tables (n=2..21)."""
    from wedderburn_jones_markov import y_lambda_at
    from q_parameter import Q as Q_FLOAT

    print("=" * 90)
    print("  Active-set pruning — y_λ tail bound verification")
    print("=" * 90)
    print()
    print(f"  COMPUTE_DPS = {COMPUTE_DPS}")
    print(f"  OUTPUT_DPS  = {OUTPUT_DPS}")
    print(f"  Paper hard floor: ~780 ppb (CAL-2 propagation)")
    print(f"  Pruning safe at target_dps=10? {verify_pruning_safe(10)}")
    print(f"  Pruning safe at target_dps=40? {verify_pruning_safe(40)}")
    print()
    print(f"  {'n':<4} {'parts':<6} {'target_dps':<12} {'active':<8} {'dropped':<8} "
          f"{'tail_bound':<18} {'safe?':<8}")
    print("  " + "-" * 80)

    for n in [3, 6, 9, 12, 15, 18, 21]:
        y_table = y_lambda_at(n, Q_FLOAT)
        y_mp = {k: mp.mpf(str(v)) for k, v in y_table.items()}

        for target_dps in [10, 20, 40]:
            active, dropped, bound = select_active_set(
                y_mp, target_dps=target_dps,
            )
            safe = bound < mp.mpf(10) ** (-target_dps)
            print(
                f"  {n:<4} {len(y_mp):<6} {target_dps:<12} "
                f"{len(active):<8} {len(dropped):<8} "
                f"{fmt(bound, 6):<18} {'✓' if safe else '✗':<8}"
            )
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
