// qou_hecke_trace_weights.cc — 1x6 NF-basis trace weights.
#include "mex.h"
#include "hecke_engine.h"

void mexFunction(int nlhs, mxArray *plhs[],
                 int nrhs, const mxArray *prhs[]) {
    if (nrhs != 1) mexErrMsgTxt("Usage: w = qou_hecke_trace_weights(q)");
    if (nlhs > 1) mexErrMsgTxt("Too many output arguments.");
    if (!mxIsDouble(prhs[0]) || mxGetNumberOfElements(prhs[0]) != 1)
        mexErrMsgTxt("q must be a scalar double.");
    double q = mxGetScalar(prhs[0]);
    plhs[0] = mxCreateDoubleMatrix(1, 6, mxREAL);
    qou_hecke_trace_weights(q, mxGetPr(plhs[0]));
}
