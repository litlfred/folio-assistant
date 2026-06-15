// qou_hecke_lr_coefficient.cc — Littlewood-Richardson coefficient c^lambda_{mu nu}.
//
// Usage:
//   c = qou_hecke_lr_coefficient(lambda, mu, nu)
//     lambda, mu, nu : 1xK row vectors of partition parts
//                      (non-negative ints, weakly decreasing).
//   c : scalar int64 (returned as double for Octave-natural use).
//       Returns 0 if |lambda| != |mu| + |nu| or mu is not contained in lambda.
//
// Cf. tools/hecke-engine/src/littlewood_richardson.rs.
#include "mex.h"
#include "hecke_engine.h"
#include <string>
#include <vector>
#include <cstddef>
#include <cstdint>

static std::vector<size_t> to_size_vec(const mxArray* m, const char* name) {
    if (!mxIsDouble(m))
        mexErrMsgTxt((std::string(name) + " must be a double row vector.").c_str());
    const size_t n = mxGetNumberOfElements(m);
    std::vector<size_t> v;
    v.reserve(n);
    const double* p = mxGetPr(m);
    for (size_t i = 0; i < n; ++i) {
        if (p[i] < 0) mexErrMsgTxt((std::string(name) + " parts must be non-negative.").c_str());
        v.push_back(static_cast<size_t>(p[i]));
    }
    return v;
}

void mexFunction(int nlhs, mxArray *plhs[],
                 int nrhs, const mxArray *prhs[]) {
    if (nrhs != 3) mexErrMsgTxt("Usage: c = qou_hecke_lr_coefficient(lambda, mu, nu)");
    if (nlhs > 1)  mexErrMsgTxt("Too many output arguments.");

    auto lam = to_size_vec(prhs[0], "lambda");
    auto mu  = to_size_vec(prhs[1], "mu");
    auto nu  = to_size_vec(prhs[2], "nu");

    const int64_t c = qou_hecke_lr_coefficient(
        lam.data(), lam.size(),
        mu.data(),  mu.size(),
        nu.data(),  nu.size());
    plhs[0] = mxCreateDoubleScalar(static_cast<double>(c));
}
