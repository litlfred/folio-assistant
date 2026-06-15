# tests/smoke.R — heckeengine smoke test.
#
# Run via: Rscript tests/smoke.R
# (or as part of R CMD check.)

library(heckeengine)

q0 <- 1.10998  # substrate q_0

# 1. version
v <- qou_version()
stopifnot(nchar(v) > 0)

# 2. markov_z (positive)
z <- qou_markov_z(q0)
stopifnot(z > 0)

# 3. hecke_h matches formula
h <- qou_hecke_h(q0)
stopifnot(abs(h - (q0 - 1 / q0)) < 1e-12)

# 4. trace_weights (length 6, first element identically 1)
w <- qou_trace_weights(q0)
stopifnot(length(w) == 6)
stopifnot(abs(w[1] - 1.0) < 1e-12)
stopifnot(all(is.finite(w)))

# 5. Gram matrix (6x6 + finite)
G <- qou_gram_matrix(q0)
stopifnot(identical(dim(G), c(6L, 6L)))
stopifnot(all(is.finite(G)))

# 6. Gram det (finite + non-zero; indefinite at q_0 so sign unconstrained)
d <- qou_gram_det(q0)
stopifnot(is.finite(d))
stopifnot(abs(d) > 1e-30)

# ── Phase B ──

# 7. chi_lambda_braid: identity element of shape [3] returns 1.0.
chi_id <- qou_chi_lambda_braid(c(3L), integer(0), integer(0), q0)
stopifnot(abs(chi_id - 1.0) < 1e-12)

# 8. chi_lambda_braid: empty partition returns 1.0.
chi_empty <- qou_chi_lambda_braid(integer(0), c(1L), c(1L), q0)
stopifnot(abs(chi_empty - 1.0) < 1e-12)

# 9. lr_coefficient: Pieri c^[2]_{[1],[1]} = 1.
stopifnot(qou_lr_coefficient(c(2L), c(1L), c(1L)) == 1)

# 10. lr_coefficient: size mismatch returns 0.
stopifnot(qou_lr_coefficient(c(3L), c(2L), c(2L)) == 0)

# 11. tr_m_atomic_mpfr: 3-strand single positive crossing returns z ≈ 0.4993.
#     n=3 (not n=2) — B_2 trips an upstream edge case in tr_m_word_lq.
trace_str <- qou_tr_m_atomic_mpfr(c(1L), c(1L), 3L, "1.10998", 20L)
stopifnot(is.character(trace_str))
stopifnot(nchar(trace_str) > 0)
stopifnot(startsWith(trace_str, "4.99"))

cat("OK: 11/11 heckeengine smoke tests pass (Phase A + Phase B)\n")
