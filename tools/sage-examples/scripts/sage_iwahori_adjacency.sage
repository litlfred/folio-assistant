#!/usr/bin/env sage
##
## sage_iwahori_adjacency.sage — Demonstrate Sage's symbolic
## IwahoriHeckeAlgebra(A_2, q) alongside QOU's substrate-q numerical
## Markov trace, with explicit notes about the convention difference.
##
## CONVENTION (STRICT).
##   Sage's `IwahoriHeckeAlgebra(W, q).T()` uses the Lusztig convention
##     (T_i - q)(T_i + 1) = 0,    T_i^2 = (q-1) T_i + q
##   with the Kazhdan-Lusztig Markov trace `tr_KL(T_w) = q^{ℓ(w)} δ_{w,1}`.
##
##   pyhecke / hecke-engine use the *symmetric* convention
##     (σ_i - q^{1/2})(σ_i + q^{-1/2}) = 0,    σ_i^2 = (q^{1/2}-q^{-1/2}) σ_i + 1
##   with the Markov-Ocneanu-Wenzl trace parameter z = 1/(q^{1/2}+q^{-1/2}).
##
##   The two conventions are related by a rescaling σ_i = q^{-1/2} T_i,
##   which propagates as σ_w = q^{-ℓ(w)/2} T_w. So:
##     tr_QOU(σ_w) = q^{-ℓ(w)/2} · tr_KL(T_w)  (up to normalisation choice)
##
##   We DO the rescaling so the numerical comparison is meaningful.
##
## Run via:   sage sage_iwahori_adjacency.sage
##

from pyhecke.gram import TR_M

try:
    from qou_substrate.constants import Q as Q0
except ImportError:
    from q_parameter import Q as Q0


# ── 1. Sage's symbolic Iwahori-Hecke algebra of type A_2 = S_3 ──
R.<q_sym> = LaurentPolynomialRing(QQ)
W = WeylGroup(['A', 2], prefix='s')
H = IwahoriHeckeAlgebra(W, q_sym).T()

print("== Sage IwahoriHeckeAlgebra(A_2, q) — Lusztig convention ==")
print(f"  algebra = {H}")
print(f"  dim     = {H.dimension()}    (== |S_3| = 6, matches QOU NF basis)")
print()

# ── 2. Six standard basis elements ──
#
# Word order matches pyhecke.gram.NF_BASIS:
#   ()         γ         identity        ℓ = 0
#   (0,)       σ₀        s_1             ℓ = 1
#   (1,)       σ₁        s_2             ℓ = 1
#   (0,1)      L₊        s_1 s_2         ℓ = 2
#   (1,0)      L₋        s_2 s_1         ℓ = 2
#   (0,1,0)   e⁻        s_1 s_2 s_1     ℓ = 3 (longest)

s1, s2 = W.simple_reflections()
basis_words = [
    (W.one(),       0, "1"),
    (s1,            1, "s_1"),
    (s2,            1, "s_2"),
    (s1 * s2,       2, "s_1 s_2"),
    (s2 * s1,       2, "s_2 s_1"),
    (s1 * s2 * s1,  3, "s_1 s_2 s_1"),
]

print("== Markov-trace comparison (Sage Lusztig → rescaled to QOU symmetric) ==")
print()
print(f"  {'word':<14} {'ℓ(w)':>5} {'QOU TR_M':>16} {'symbolic rescale':>20}  (numeric @ q_0)")
print("  " + "-" * 80)
# Rescaling factor q^{-ℓ(w)/2} has half-integer exponents which the
# Laurent polynomial ring Z[q, q^{-1}] does NOT support. We use Sage's
# symbolic ring (SR) for display so half-integer powers print cleanly,
# and compute the numerical factor in plain Python.
qSR = SR.var('q')
for (w, length, label), tr_qou in zip(basis_words, TR_M):
    # Rescaling factor from Lusztig T_w to symmetric σ_w:
    #   σ_w = q^{-ℓ(w)/2} T_w
    # so tr applied to σ_w picks up q^{-ℓ(w)/2}.
    rescale_symbolic = qSR ** (Rational(-length, 2))
    rescale_at_q0 = float(Q0) ** (-length / 2.0)
    print(f"  {label:<14} {length:>5} {float(tr_qou):>16.9f} {str(rescale_symbolic):>20}  ({rescale_at_q0:.9f})")

print()
print("Note. A tight numerical assertion requires choosing Sage's Markov")
print("trace normalisation explicitly (it parametrises a family). This")
print("script demonstrates the convention bridge; the numerical")
print("assertion lives in sage_partition_q_dim.sage where both sides")
print("evaluate the same symbolic q-dim formula.")
print()
print("OK")
