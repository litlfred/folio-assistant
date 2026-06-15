/-- F_Pauli for 4He (Z=2, N=2, A=4), exact in t = q^{1/2}.
    ★★ DOUBLY MAGIC.
    Computed by hecke-engine 0.8.0, 0ms.
    F_Pauli(q₀) = 0.8116336086
    Denominator: 2^4. -/
-- Ref: [litlfred2025] https://doi.org/10.xxxx/qou
noncomputable def tr_alt_4he : LaurentPolynomial ℤ :=
  -LaurentPolynomial.T -9 + LaurentPolynomial.T -8 + LaurentPolynomial.T -7 + 4 • LaurentPolynomial.T -6 - 8 • LaurentPolynomial.T -5 - 4 • LaurentPolynomial.T -4 + 2 • LaurentPolynomial.T -3 + 22 • LaurentPolynomial.T -2 - 26 - 16 • LaurentPolynomial.T 1 + 26 • LaurentPolynomial.T 2 + 37 • LaurentPolynomial.T 3 - 15 • LaurentPolynomial.T 4 - 37 • LaurentPolynomial.T 5 - 2 • LaurentPolynomial.T 6 + 31 • LaurentPolynomial.T 7 + 15 • LaurentPolynomial.T 8 - 15 • LaurentPolynomial.T 9 - 10 • LaurentPolynomial.T 10 + 5 • LaurentPolynomial.T 11 + 5 • LaurentPolynomial.T 12 + LaurentPolynomial.T 13

noncomputable def net_4he : LaurentPolynomial ℤ :=
  LaurentPolynomial.T -3 + 2 • LaurentPolynomial.T -2 - LaurentPolynomial.T -1 - 8 - 2 • LaurentPolynomial.T 1 + 16 • LaurentPolynomial.T 2 + 11 • LaurentPolynomial.T 3 - 19 • LaurentPolynomial.T 4 - 23 • LaurentPolynomial.T 5 + 20 • LaurentPolynomial.T 6 + 32 • LaurentPolynomial.T 7 - 8 • LaurentPolynomial.T 8 - 32 • LaurentPolynomial.T 9 + 4 • LaurentPolynomial.T 10 + 26 • LaurentPolynomial.T 11 + 2 • LaurentPolynomial.T 12 - 8 • LaurentPolynomial.T 13 - 6 • LaurentPolynomial.T 14 + 6 • LaurentPolynomial.T 15 + LaurentPolynomial.T 16 + 4 • LaurentPolynomial.T 17 - 7 • LaurentPolynomial.T 19 + 7 • LaurentPolynomial.T 20 - 4 • LaurentPolynomial.T 21 + 4 • LaurentPolynomial.T 22 - 3 • LaurentPolynomial.T 23 + LaurentPolynomial.T 24

noncomputable def F_Pauli_4he_denom : ℕ := 16

/-- Observable amplitude: net(0) + net(1) — the optimal basis.
    Degree 0 + 1 content of the Gröbner NF. -/
noncomputable def observable_4he : LaurentPolynomial ℤ :=
  LaurentPolynomial.T -1 - 3 - 4 • LaurentPolynomial.T 1 + 5 • LaurentPolynomial.T 2 + 11 • LaurentPolynomial.T 3 - 2 • LaurentPolynomial.T 4 - 18 • LaurentPolynomial.T 5 - 2 • LaurentPolynomial.T 6 + 23 • LaurentPolynomial.T 7 + 8 • LaurentPolynomial.T 8 - 24 • LaurentPolynomial.T 9 - 8 • LaurentPolynomial.T 10 + 22 • LaurentPolynomial.T 11 + 6 • LaurentPolynomial.T 12 - 19 • LaurentPolynomial.T 13 - 6 • LaurentPolynomial.T 14 + 14 • LaurentPolynomial.T 15 + 3 • LaurentPolynomial.T 16 - 6 • LaurentPolynomial.T 17 - 5 • LaurentPolynomial.T 18 + LaurentPolynomial.T 19 + 4 • LaurentPolynomial.T 20 - LaurentPolynomial.T 21

/-- Coral content: Σ_{ℓ≥2} net(ℓ) — the degree ≥ 1 interaction content.
    This is the "M" in the CMB analogy — the multi-body correlations
    that the transfer matrix cannot capture per-generator. -/
noncomputable def coral_4he : LaurentPolynomial ℤ :=
  LaurentPolynomial.T -3 + 2 • LaurentPolynomial.T -2 - 2 • LaurentPolynomial.T -1 - 5 + 2 • LaurentPolynomial.T 1 + 11 • LaurentPolynomial.T 2 - 17 • LaurentPolynomial.T 4 - 5 • LaurentPolynomial.T 5 + 22 • LaurentPolynomial.T 6 + 9 • LaurentPolynomial.T 7 - 16 • LaurentPolynomial.T 8 - 8 • LaurentPolynomial.T 9 + 12 • LaurentPolynomial.T 10 + 4 • LaurentPolynomial.T 11 - 4 • LaurentPolynomial.T 12 + 11 • LaurentPolynomial.T 13 - 8 • LaurentPolynomial.T 15 - 2 • LaurentPolynomial.T 16 + 10 • LaurentPolynomial.T 17 + 5 • LaurentPolynomial.T 18 - 8 • LaurentPolynomial.T 19 + 3 • LaurentPolynomial.T 20 - 3 • LaurentPolynomial.T 21 + 4 • LaurentPolynomial.T 22 - 3 • LaurentPolynomial.T 23 + LaurentPolynomial.T 24

