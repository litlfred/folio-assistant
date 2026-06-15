/-- F_Pauli for 3H (Z=1, N=2, A=3), exact in t = q^{1/2}.
    Computed by hecke-engine 0.8.0, 0ms.
    F_Pauli(q₀) = 0.8999470429
    Denominator: 2^2. -/
-- Ref: [litlfred2025] https://doi.org/10.xxxx/qou
noncomputable def tr_alt_3h : LaurentPolynomial ℤ :=
  LaurentPolynomial.T -3 - LaurentPolynomial.T -2 - LaurentPolynomial.T -1 - 2 + 4 • LaurentPolynomial.T 1 + 2 • LaurentPolynomial.T 2 - 3 • LaurentPolynomial.T 3 - 5 • LaurentPolynomial.T 4 + 5 • LaurentPolynomial.T 6 - 3 • LaurentPolynomial.T 8 - LaurentPolynomial.T 9

noncomputable def net_3h : LaurentPolynomial ℤ :=
  -LaurentPolynomial.T -1 + 2 • LaurentPolynomial.T 1 + LaurentPolynomial.T 2 - LaurentPolynomial.T 3 - 3 • LaurentPolynomial.T 4 + 2 • LaurentPolynomial.T 5 + 4 • LaurentPolynomial.T 6 - 4 • LaurentPolynomial.T 8 + LaurentPolynomial.T 9 + 4 • LaurentPolynomial.T 10 - 2 • LaurentPolynomial.T 11 + LaurentPolynomial.T 12 - LaurentPolynomial.T 13 + LaurentPolynomial.T 14

noncomputable def F_Pauli_3h_denom : ℕ := 4

/-- Observable amplitude: net(0) + net(1) — the optimal basis.
    Degree 0 + 1 content of the Gröbner NF. -/
noncomputable def observable_3h : LaurentPolynomial ℤ :=
  -LaurentPolynomial.T -1 + 2 • LaurentPolynomial.T 1 + 2 • LaurentPolynomial.T 2 - LaurentPolynomial.T 3 - 3 • LaurentPolynomial.T 4 + 5 • LaurentPolynomial.T 6 + 2 • LaurentPolynomial.T 7 - 4 • LaurentPolynomial.T 8 - LaurentPolynomial.T 9 + 3 • LaurentPolynomial.T 10 + LaurentPolynomial.T 12 - LaurentPolynomial.T 13

/-- Coral content: Σ_{ℓ≥2} net(ℓ) — the degree ≥ 1 interaction content.
    This is the "M" in the CMB analogy — the multi-body correlations
    that the transfer matrix cannot capture per-generator. -/
noncomputable def coral_3h : LaurentPolynomial ℤ :=
  -LaurentPolynomial.T 2 + 2 • LaurentPolynomial.T 5 - LaurentPolynomial.T 6 - 2 • LaurentPolynomial.T 7 + 2 • LaurentPolynomial.T 9 + LaurentPolynomial.T 10 - 2 • LaurentPolynomial.T 11 + LaurentPolynomial.T 14

