% smoke.m — Octave smoke test for hecke-engine MEX bindings.
%
% Run from this directory:
%   octave --eval "addpath('..'); smoke"
%
% Mirrors test/smoke.test.js from hecke-engine-node + the Rust
% unit tests in hecke-engine-jvm.

q0 = 1.10998;  % substrate q_0

% 1. version
v = qou_hecke_version();
printf("hecke-engine %s\n", v);
assert(!isempty(v));

% 2. markov z (positive)
z = qou_hecke_markov_z(q0);
printf("z(q_0) = %.6f\n", z);
assert(z > 0, "markov_z must be positive");

% 3. hecke h (formula)
h = qou_hecke_h(q0);
expected = q0 - 1 / q0;
assert(abs(h - expected) < 1e-12, sprintf("h mismatch: got %.6f, expected %.6f", h, expected));

% 4. trace weights (length 6, [1, z, z, z^2, z^2, z^3])
w = qou_hecke_trace_weights(q0);
assert(numel(w) == 6, "trace_weights must have 6 elements");
assert(abs(w(1) - 1.0) < 1e-12);
assert(abs(w(2) - z) < 1e-12);
assert(abs(w(6) - z * z * z) < 1e-12);

% 5. Gram matrix (6x6)
G = qou_hecke_gram_matrix(q0);
assert(size(G, 1) == 6 && size(G, 2) == 6, "Gram must be 6x6");

% 6. Gram det (non-zero + finite; Gram at q_0 is indefinite so sign isn't constrained)
d = qou_hecke_gram_det(q0);
assert(isfinite(d), "gram_det non-finite");
assert(abs(d) > 1e-30, "gram_det too close to zero");

% ── Phase B ──

% 7. chi_lambda_braid: identity element of shape [3] gives 1.0 (trivial-character convention).
chi_id = qou_hecke_chi_lambda_braid([3], zeros(0, 2), q0);
assert(abs(chi_id - 1.0) < 1e-12, sprintf("chi_lambda_braid identity: got %.6f, expected 1.0", chi_id));

% 8. chi_lambda_braid: empty partition → 1.0 by convention.
chi_empty = qou_hecke_chi_lambda_braid([], [1 1], q0);
assert(abs(chi_empty - 1.0) < 1e-12, "chi_lambda_braid empty shape must return 1.0");

% 9. lr_coefficient: Pieri c^[2]_{[1],[1]} = 1.
c1 = qou_hecke_lr_coefficient([2], [1], [1]);
assert(c1 == 1, sprintf("lr_coefficient([2],[1],[1]): got %d, expected 1", c1));

% 10. lr_coefficient: size mismatch c^[3]_{[2],[2]} = 0.
c0 = qou_hecke_lr_coefficient([3], [2], [2]);
assert(c0 == 0, sprintf("lr_coefficient([3],[2],[2]): got %d, expected 0", c0));

% 11. tr_m_atomic_mpfr: single positive crossing on 3 strands at 20-dps
%     returns a non-empty decimal string starting with "4.99" (≈ z).
%     n=3 (not n=2) — B_2 trips an upstream edge case in tr_m_word_lq.
trace_str = qou_hecke_tr_m_atomic_mpfr([1 1], 3, "1.10998", 20);
assert(ischar(trace_str) && !isempty(trace_str), "tr_m_atomic_mpfr must return a non-empty string");
assert(strncmp(trace_str, "4.99", 4), sprintf("tr_m_atomic_mpfr expected '4.99...', got '%s'", trace_str));

printf("OK: 11/11 smoke tests pass (Phase A + Phase B)\n");
