/* smoke.c — C smoke test exercising the full hecke-engine-c surface.
 *
 * Build + run from this directory (after `cargo build --release`):
 *   make -C ../ smoke
 *   ./smoke
 *
 * Covers Phase A (markov_z, hecke_h, trace_weights, gram_matrix_flat,
 * gram_det, version) + Phase B (chi_lambda_braid, lr_coefficient,
 * tr_m_atomic_mpfr).
 *
 * Status: prints OK to stdout + returns 0 if every assertion holds,
 * else writes a one-line diagnostic to stderr and returns non-zero.
 * No assert.h — explicit checks so toolchains compiled with -DNDEBUG
 * (release builds) still execute the assertions.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <math.h>

#include "hecke_engine.h"

#define TOL  1e-12
#define EXPECT(cond, fmt, ...) do { \
    if (!(cond)) { \
        fprintf(stderr, "FAIL [%s:%d] " fmt "\n", \
                __FILE__, __LINE__, ##__VA_ARGS__); \
        return 1; \
    } \
} while (0)

int main(void) {
    const double q0 = 1.10998;

    /* 1. version */
    const char* v = qou_hecke_version();
    EXPECT(v && *v, "version string empty");
    printf("hecke-engine %s\n", v);

    /* 2. markov_z positive */
    const double z = qou_hecke_markov_z(q0);
    EXPECT(z > 0.0, "markov_z(q_0) = %g, expected > 0", z);

    /* 3. hecke_h matches q − 1/q */
    const double h = qou_hecke_h(q0);
    const double expected_h = q0 - 1.0 / q0;
    EXPECT(fabs(h - expected_h) < TOL,
           "hecke_h(q_0) = %g, expected %g", h, expected_h);

    /* 4. trace_weights: length 6, w[0] = 1, all finite. */
    double w[6];
    qou_hecke_trace_weights(q0, w);
    EXPECT(fabs(w[0] - 1.0) < TOL, "w[0] = %g, expected 1.0", w[0]);
    for (int i = 0; i < 6; i++) {
        EXPECT(isfinite(w[i]), "w[%d] non-finite", i);
    }

    /* 5. gram_matrix_flat: 36 finite entries. */
    double g[36];
    qou_hecke_gram_matrix_flat(q0, g);
    for (int i = 0; i < 36; i++) {
        EXPECT(isfinite(g[i]), "G[%d] non-finite", i);
    }

    /* 6. gram_det finite + non-zero (indefinite at q_0; sign unconstrained). */
    const double d = qou_hecke_gram_det(q0);
    EXPECT(isfinite(d), "gram_det non-finite");
    EXPECT(fabs(d) > 1e-30, "gram_det too close to zero: %g", d);

    /* ── Phase B ── */

    /* 7. chi_lambda_braid: identity element of shape [3] → 1.0. */
    {
        const size_t shape[1] = {3};
        const double chi = qou_hecke_chi_lambda_braid(
            shape, 1, NULL, NULL, 0, q0);
        EXPECT(fabs(chi - 1.0) < TOL,
               "chi_lambda_braid([3], []) = %g, expected 1.0", chi);
    }

    /* 8. chi_lambda_braid: empty partition → 1.0 by convention. */
    {
        const int32_t  gens[1] = {1};
        const uint32_t exps[1] = {1};
        const double chi = qou_hecke_chi_lambda_braid(
            NULL, 0, gens, exps, 1, q0);
        EXPECT(fabs(chi - 1.0) < TOL,
               "chi_lambda_braid([], [(1,1)]) = %g, expected 1.0", chi);
    }

    /* 9. lr_coefficient: Pieri c^[2]_{[1],[1]} = 1. */
    {
        const size_t lam[1] = {2};
        const size_t mu[1]  = {1};
        const size_t nu[1]  = {1};
        const int64_t c = qou_hecke_lr_coefficient(lam, 1, mu, 1, nu, 1);
        EXPECT(c == 1, "lr_coefficient([2],[1],[1]) = %lld, expected 1",
               (long long)c);
    }

    /* 10. lr_coefficient: size mismatch c^[3]_{[2],[2]} = 0. */
    {
        const size_t lam[1] = {3};
        const size_t mu[1]  = {2};
        const size_t nu[1]  = {2};
        const int64_t c = qou_hecke_lr_coefficient(lam, 1, mu, 1, nu, 1);
        EXPECT(c == 0, "lr_coefficient([3],[2],[2]) = %lld, expected 0",
               (long long)c);
    }

    /* 11. tr_m_atomic_mpfr: 3-strand single positive crossing, 20-dps.
     *     Returns z = 1/(q^{1/2} + q^{-1/2}) at q_0 (canonical Markov trace
     *     of a single Hecke generator on B_3). status=0 + first chars
     *     start with "4.99..." (z ≈ 0.4993). n=3 chosen over n=2 because
     *     B_2 trips an upstream edge case in tr_m_word_lq's recursion. */
    {
        const int8_t   signs[1] = {1};
        const int32_t  gens[1]  = {1};
        char buf[128];
        const int status = qou_hecke_tr_m_atomic_mpfr(
            signs, gens, 1, 3, "1.10998", 20, buf, sizeof(buf));
        EXPECT(status == 0, "tr_m_atomic_mpfr status = %d (buf: %s)",
               status, buf);
        EXPECT(buf[0] != '\0', "tr_m_atomic_mpfr returned empty buf");
        EXPECT(strncmp(buf, "4.99", 4) == 0,
               "tr_m_atomic_mpfr expected to start with '4.99' (≈ z), got '%s'",
               buf);
    }

    printf("OK: 11/11 smoke tests pass (Phase A + Phase B)\n");
    return 0;
}
