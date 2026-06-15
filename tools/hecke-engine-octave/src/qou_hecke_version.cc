// qou_hecke_version.cc — Octave MEX wrapper for qou_hecke_version().
//
// Returns a character string with the engine version.
//
// Build via Makefile in parent directory.
#include "mex.h"
#include "hecke_engine.h"

void mexFunction(int nlhs, mxArray *plhs[],
                 int nrhs, const mxArray *prhs[]) {
    (void)nrhs; (void)prhs;
    if (nlhs > 1) mexErrMsgTxt("Too many output arguments.");
    const char* v = qou_hecke_version();
    plhs[0] = mxCreateString(v);
}
