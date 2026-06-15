// qou_hecke_tr_m_atomic_mpfr.cc — arbitrary-precision Markov trace.
//
// Usage:
//   s = qou_hecke_tr_m_atomic_mpfr(word, n_strands, q_str, dps)
//     word      : Mx2 matrix of (sign, generator) pairs;
//                 column 1 ∈ {-1, +1}, column 2 = 1-based gen index.
//     n_strands : positive int (n in B_n).
//     q_str     : char-row q value as a decimal string (e.g. '1.10998').
//     dps       : positive int decimal digits of precision.
//   s         : char-row decimal string of the trace value.
//
// Errors are surfaced via mexErrMsgTxt with the underlying message.
// Cf. tools/hecke-engine/src/tr_m_atomic_mpfr.rs.
#include "mex.h"
#include "hecke_engine.h"
#include <vector>
#include <string>
#include <cstddef>
#include <cstdint>

void mexFunction(int nlhs, mxArray *plhs[],
                 int nrhs, const mxArray *prhs[]) {
    if (nrhs != 4)
        mexErrMsgTxt("Usage: s = qou_hecke_tr_m_atomic_mpfr(word, n_strands, q_str, dps)");
    if (nlhs > 1) mexErrMsgTxt("Too many output arguments.");

    // word matrix.
    if (!mxIsDouble(prhs[0]))
        mexErrMsgTxt("word must be an Mx2 double matrix.");
    const size_t word_rows = mxGetM(prhs[0]);
    const size_t word_cols = mxGetN(prhs[0]);
    if (word_rows > 0 && word_cols != 2)
        mexErrMsgTxt("word matrix must have 2 columns (sign, gen).");
    std::vector<int8_t>  word_signs;
    std::vector<int32_t> word_gens;
    word_signs.reserve(word_rows);
    word_gens.reserve(word_rows);
    {
        const double* wp = mxGetPr(prhs[0]);
        for (size_t i = 0; i < word_rows; ++i) {
            const double s = wp[i];
            if (s != -1.0 && s != 1.0)
                mexErrMsgTxt("word sign column must be -1 or +1.");
            word_signs.push_back(static_cast<int8_t>(s));
            word_gens.push_back(static_cast<int32_t>(wp[word_rows + i]));
        }
    }

    if (!mxIsDouble(prhs[1]) || mxGetNumberOfElements(prhs[1]) != 1)
        mexErrMsgTxt("n_strands must be a scalar double.");
    const double n_strands_d = mxGetScalar(prhs[1]);
    if (n_strands_d < 1) mexErrMsgTxt("n_strands must be >= 1.");
    const size_t n_strands = static_cast<size_t>(n_strands_d);

    if (!mxIsChar(prhs[2]))
        mexErrMsgTxt("q_str must be a char-row decimal string.");
    char* q_str = mxArrayToString(prhs[2]);
    if (!q_str) mexErrMsgTxt("Failed to read q_str.");

    if (!mxIsDouble(prhs[3]) || mxGetNumberOfElements(prhs[3]) != 1)
        mexErrMsgTxt("dps must be a scalar double.");
    const double dps_d = mxGetScalar(prhs[3]);
    if (dps_d < 1) mexErrMsgTxt("dps must be >= 1.");
    const uint32_t dps = static_cast<uint32_t>(dps_d);

    // Out-buffer sized to comfortably hold dps + sign + exponent + NUL.
    // For dps = 50 digits we need ~70 chars; round up generously.
    std::vector<char> buf(static_cast<size_t>(dps) + 64u);
    const int status = qou_hecke_tr_m_atomic_mpfr(
        word_signs.data(), word_gens.data(), word_rows,
        n_strands,
        q_str,
        dps,
        buf.data(), buf.size());
    mxFree(q_str);

    if (status == 0) {
        plhs[0] = mxCreateString(buf.data());
        return;
    }
    if (status == 2) {
        // Truncated; retry with a bigger buffer.
        buf.assign(buf.size() * 4u, '\0');
        const int s2 = qou_hecke_tr_m_atomic_mpfr(
            word_signs.data(), word_gens.data(), word_rows,
            n_strands, q_str, dps, buf.data(), buf.size());
        if (s2 == 0) { plhs[0] = mxCreateString(buf.data()); return; }
        mexErrMsgTxt(buf.data());
    }
    // status 1 (compute error) or 3 (null arg) -> error message in buf.
    mexErrMsgTxt(buf.data());
}
