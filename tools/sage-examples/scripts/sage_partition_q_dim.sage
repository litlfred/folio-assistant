#!/usr/bin/env sage
##
## sage_partition_q_dim.sage — Cross-check pyhecke.q_dimension against
## a Sage-native symbolic computation at q = q_0.
##
## CONVENTION (STRICT).
##   pyhecke uses the *symmetric* quantum integer
##     [n]_q^sym = (q^n - q^{-n}) / (q - q^{-1})
##   (knot-theoretic / Hecke-skein convention). This is NOT Sage's
##   default `sage.combinat.q_analogues.q_int(n, q)`, which returns
##   the *standard* form
##     [n]_q^std = (q^n - 1) / (q - 1) = 1 + q + ... + q^{n-1}.
##
##   We build the symmetric form explicitly in Sage so the comparison
##   is apples-to-apples: each side evaluates the same symbolic formula
##   at q -> q_0.
##
## The q-dimension is
##
##     q-dim(λ) = [n]_q^sym !  /  Π_{(i,j) ∈ λ} [h(i,j)]_q^sym
##
## where h(i,j) is the hook length at cell (i,j).
##
## Run via:   sage sage_partition_q_dim.sage
##

import sys

from pyhecke import q_dimension, partitions_of

try:
    from qou_substrate.constants import Q as Q0
except ImportError:
    from q_parameter import Q as Q0


R.<q_sym> = LaurentPolynomialRing(QQ)


def q_int_sym(n):
    """Symmetric quantum integer [n]_q^sym = (q^n - q^{-n})/(q - q^{-1})."""
    if n == 0:
        return R.zero()
    return sum(q_sym^(n - 1 - 2*k) for k in range(n))


def q_factorial_sym(n):
    """[n]_q^sym! = [1]^sym * [2]^sym * ... * [n]^sym."""
    f = R.one()
    for k in range(1, n + 1):
        f *= q_int_sym(k)
    return f


def sage_q_dim_sym(lam):
    """Mirror of pyhecke.q_dimension using the symmetric convention."""
    P = Partition(list(lam))
    n = sum(P)
    if n == 0:
        return R.one()
    hook_prod = R.one()
    for (i, j) in P.cells():
        hook_prod *= q_int_sym(P.hook_length(i, j))
    return q_factorial_sym(n) / hook_prod


print(f"== q-dimension cross-check (symmetric convention) at q_0 ≈ {float(Q0):.10f} ==")
print()
print(f"  {'λ':<12} {'sage symbolic':>20} {'@ q_0 (Sage)':>16} {'pyhecke @ q_0':>16}  diff")
print("  " + "-" * 80)

mismatches = 0
for n in (1, 2, 3, 4, 5):
    for lam in partitions_of(n):
        sym_expr = sage_q_dim_sym(lam)
        # Evaluate the symbolic expression at the substrate
        sym_val = float(sym_expr.subs(q_sym=Q0))
        qou_val = float(q_dimension(lam))
        diff = abs(sym_val - qou_val)
        flag = "OK" if diff < 1e-9 else "**MISMATCH**"
        if diff >= 1e-9:
            mismatches += 1
        print(f"  λ = {str(lam):<8} {str(sym_expr):>20} {sym_val:>16.9f} {qou_val:>16.9f}  {diff:.2e}  {flag}")
    print()

if mismatches == 0:
    print("OK — all partitions of n=1..5 agree to 1e-9 (both sides")
    print("     evaluate the same symbolic q-dim formula at q_0).")
else:
    print(f"FAIL — {mismatches} mismatches; check convention / substrate q value.")
    sys.exit(1)
