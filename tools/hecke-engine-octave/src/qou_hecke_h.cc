// qou_hecke_h.cc — h = q - q^{-1}.
#include "mex.h"
#include "hecke_engine.h"

void mexFunction(int nlhs, mxArray *plhs[],
                 int nrhs, const mxArray *prhs[]) {
    if (nrhs != 1) mexErrMsgTxt("Usage: h = qou_hecke_h(q)");
    if (nlhs > 1) mexErrMsgTxt("Too many output arguments.");
    if (!mxIsDouble(prhs[0]) || mxGetNumberOfElements(prhs[0]) != 1)
        mexErrMsgTxt("q must be a scalar double.");
    double q = mxGetScalar(prhs[0]);
    plhs[0] = mxCreateDoubleScalar(qou_hecke_h(q));
}
