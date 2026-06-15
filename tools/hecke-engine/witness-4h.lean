/-- F_Pauli for 4H (Z=1, N=3, A=4), exact in t = q^{1/2}.
    Computed by hecke-engine 0.8.0, 0ms.
    F_Pauli(q₀) = 1.0807430094
    Denominator: 2^3. -/
-- Ref: [litlfred2025] https://doi.org/10.xxxx/qou
noncomputable def tr_alt_4h : LaurentPolynomial ℤ :=
  -LaurentPolynomial.T -3 + 3 • LaurentPolynomial.T -2 - 2 - 12 • LaurentPolynomial.T 1 + 9 • LaurentPolynomial.T 2 + 22 • LaurentPolynomial.T 3 - 39 • LaurentPolynomial.T 5 - 23 • LaurentPolynomial.T 6 + 51 • LaurentPolynomial.T 7 + 45 • LaurentPolynomial.T 8 - 35 • LaurentPolynomial.T 9 - 60 • LaurentPolynomial.T 10 + 9 • LaurentPolynomial.T 11 + 56 • LaurentPolynomial.T 12 + 9 • LaurentPolynomial.T 13 - 30 • LaurentPolynomial.T 14 - 10 • LaurentPolynomial.T 15 + 9 • LaurentPolynomial.T 16 + 6 • LaurentPolynomial.T 17 + LaurentPolynomial.T 18

noncomputable def net_4h : LaurentPolynomial ℤ :=
  LaurentPolynomial.T -1 - 4 • LaurentPolynomial.T 1 - LaurentPolynomial.T 2 + 8 • LaurentPolynomial.T 3 + 8 • LaurentPolynomial.T 4 - 14 • LaurentPolynomial.T 5 - 18 • LaurentPolynomial.T 6 + 24 • LaurentPolynomial.T 7 + 23 • LaurentPolynomial.T 8 - 23 • LaurentPolynomial.T 9 - 29 • LaurentPolynomial.T 10 + 18 • LaurentPolynomial.T 11 + 42 • LaurentPolynomial.T 12 - 20 • LaurentPolynomial.T 13 - 36 • LaurentPolynomial.T 14 + 15 • LaurentPolynomial.T 15 + 32 • LaurentPolynomial.T 16 - 13 • LaurentPolynomial.T 17 - 20 • LaurentPolynomial.T 18 + 18 • LaurentPolynomial.T 19 - 7 • LaurentPolynomial.T 20 + 7 • LaurentPolynomial.T 21 - 9 • LaurentPolynomial.T 23 + 9 • LaurentPolynomial.T 24 - 5 • LaurentPolynomial.T 25 + 4 • LaurentPolynomial.T 26 - 3 • LaurentPolynomial.T 27 + LaurentPolynomial.T 28

noncomputable def F_Pauli_4h_denom : ℕ := 8

/-- Observable amplitude: net(0) + net(1) — the optimal basis.
    Degree 0 + 1 content of the Gröbner NF. -/
noncomputable def observable_4h : LaurentPolynomial ℤ :=
  LaurentPolynomial.T -1 - 4 • LaurentPolynomial.T 1 - 3 • LaurentPolynomial.T 2 + 8 • LaurentPolynomial.T 3 + 13 • LaurentPolynomial.T 4 - 9 • LaurentPolynomial.T 5 - 28 • LaurentPolynomial.T 6 + 6 • LaurentPolynomial.T 7 + 34 • LaurentPolynomial.T 8 + 4 • LaurentPolynomial.T 9 - 27 • LaurentPolynomial.T 10 - 17 • LaurentPolynomial.T 11 + 17 • LaurentPolynomial.T 12 + 19 • LaurentPolynomial.T 13 - 5 • LaurentPolynomial.T 14 - 7 • LaurentPolynomial.T 15 - 14 • LaurentPolynomial.T 17 + 2 • LaurentPolynomial.T 18 + 24 • LaurentPolynomial.T 19 - 4 • LaurentPolynomial.T 20 - 11 • LaurentPolynomial.T 21 - 3 • LaurentPolynomial.T 22 + LaurentPolynomial.T 23 + 4 • LaurentPolynomial.T 24 - LaurentPolynomial.T 25

/-- Coral content: Σ_{ℓ≥2} net(ℓ) — the degree ≥ 1 interaction content.
    This is the "M" in the CMB analogy — the multi-body correlations
    that the transfer matrix cannot capture per-generator. -/
noncomputable def coral_4h : LaurentPolynomial ℤ :=
  2 • LaurentPolynomial.T 2 - 5 • LaurentPolynomial.T 4 - 5 • LaurentPolynomial.T 5 + 10 • LaurentPolynomial.T 6 + 18 • LaurentPolynomial.T 7 - 11 • LaurentPolynomial.T 8 - 27 • LaurentPolynomial.T 9 - 2 • LaurentPolynomial.T 10 + 35 • LaurentPolynomial.T 11 + 25 • LaurentPolynomial.T 12 - 39 • LaurentPolynomial.T 13 - 31 • LaurentPolynomial.T 14 + 22 • LaurentPolynomial.T 15 + 32 • LaurentPolynomial.T 16 + LaurentPolynomial.T 17 - 22 • LaurentPolynomial.T 18 - 6 • LaurentPolynomial.T 19 - 3 • LaurentPolynomial.T 20 + 18 • LaurentPolynomial.T 21 + 3 • LaurentPolynomial.T 22 - 10 • LaurentPolynomial.T 23 + 5 • LaurentPolynomial.T 24 - 4 • LaurentPolynomial.T 25 + 4 • LaurentPolynomial.T 26 - 3 • LaurentPolynomial.T 27 + LaurentPolynomial.T 28

