// qou_hecke_chi_lambda_braid.cc — Hecke character chi_lambda(beta) at q.
//
// Usage:
//   chi = qou_hecke_chi_lambda_braid(shape, word, q)
//     shape : 1xK row vector of partition parts (positive ints,
//             weakly decreasing). Empty [] returns 1.
//     word  : Mx2 matrix of (generator, exponent) pairs;
//             column 1 = signed-int generator index,
//             column 2 = non-negative-int exponent. Empty matrix
//             means the identity element.
//     q     : scalar double substrate parameter.
//   chi    : scalar double character value.
//
// Cf. tools/hecke-engine/src/seminormal.rs chi_lambda_braid.
#include "mex.h"
#include "hecke_engine.h"
#include <vector>
#include <cstddef>
#include <cstdint>

void mexFunction(int nlhs, mxArray *plhs[],
                 int nrhs, const mxArray *prhs[]) {
    if (nrhs != 3) mexErrMsgTxt("Usage: chi = qou_hecke_chi_lambda_braid(shape, word, q)");
    if (nlhs > 1)  mexErrMsgTxt("Too many output arguments.");

    // shape: row vector of doubles -> vector<size_t>
    if (!mxIsDouble(prhs[0]))
        mexErrMsgTxt("shape must be a double row vector.");
    const size_t shape_len = mxGetNumberOfElements(prhs[0]);
    std::vector<size_t> shape;
    shape.reserve(shape_len);
    {
        const double* sp = mxGetPr(prhs[0]);
        for (size_t i = 0; i < shape_len; ++i) {
            if (sp[i] < 0) mexErrMsgTxt("shape parts must be non-negative.");
            shape.push_back(static_cast<size_t>(sp[i]));
        }
    }

    // word: Mx2 matrix of (gen, exp).
    if (!mxIsDouble(prhs[1]))
        mexErrMsgTxt("word must be an Mx2 double matrix.");
    const size_t word_rows = mxGetM(prhs[1]);
    const size_t word_cols = mxGetN(prhs[1]);
    if (word_rows > 0 && word_cols != 2)
        mexErrMsgTxt("word matrix must have 2 columns (gen, exp).");
    std::vector<int32_t>  word_gens;
    std::vector<uint32_t> word_exps;
    word_gens.reserve(word_rows);
    word_exps.reserve(word_rows);
    {
        const double* wp = mxGetPr(prhs[1]);
        // Octave matrices are column-major: gen column at wp[0..rows-1],
        // exp column at wp[rows..2*rows-1].
        for (size_t i = 0; i < word_rows; ++i) {
            word_gens.push_back(static_cast<int32_t>(wp[i]));
            const double e = wp[word_rows + i];
            if (e < 0) mexErrMsgTxt("word exponents must be non-negative.");
            word_exps.push_back(static_cast<uint32_t>(e));
        }
    }

    if (!mxIsDouble(prhs[2]) || mxGetNumberOfElements(prhs[2]) != 1)
        mexErrMsgTxt("q must be a scalar double.");
    const double q = mxGetScalar(prhs[2]);

    const double chi = qou_hecke_chi_lambda_braid(
        shape.data(), shape.size(),
        word_gens.data(), word_exps.data(), word_rows,
        q);
    plhs[0] = mxCreateDoubleScalar(chi);
}
