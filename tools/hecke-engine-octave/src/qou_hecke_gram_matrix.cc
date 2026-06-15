// qou_hecke_gram_matrix.cc — 6x6 Gram matrix.
//
// hecke-engine-c emits the Gram row-major; Octave / MATLAB are
// column-major, so we transpose during the copy.
#include "mex.h"
#include "hecke_engine.h"

void mexFunction(int nlhs, mxArray *plhs[],
                 int nrhs, const mxArray *prhs[]) {
    if (nrhs != 1) mexErrMsgTxt("Usage: G = qou_hecke_gram_matrix(q)");
    if (nlhs > 1) mexErrMsgTxt("Too many output arguments.");
    if (!mxIsDouble(prhs[0]) || mxGetNumberOfElements(prhs[0]) != 1)
        mexErrMsgTxt("q must be a scalar double.");
    double q = mxGetScalar(prhs[0]);

    double row_major[36];
    qou_hecke_gram_matrix_flat(q, row_major);

    plhs[0] = mxCreateDoubleMatrix(6, 6, mxREAL);
    double* col_major = mxGetPr(plhs[0]);
    for (int i = 0; i < 6; i++)
        for (int j = 0; j < 6; j++)
            col_major[j * 6 + i] = row_major[i * 6 + j];
}
