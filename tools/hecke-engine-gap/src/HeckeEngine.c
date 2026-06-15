/*
 * HeckeEngine.c — GAP C-extension wrapping hecke-engine-c.
 *
 * Each function is registered with GAP's kernel as `_QOU_HECKE_C_X`
 * (matching the InstallGlobalFunction wiring in lib/HeckeEngine.gi).
 * Each delegates to the corresponding `qou_hecke_*` function exported
 * by libhecke_engine_c.{so,dylib} (built from tools/hecke-engine-c/).
 *
 * Build:
 *   cd src && ./configure --with-gaproot=<gap-installation-root> && make
 *
 * The configure script (provided by GAP's package template, not in
 * this scaffold) writes the Makefile that links against both GAP's
 * kernel and libhecke_engine_c.
 */

#include <stdio.h>
#include "gap_all.h"
#include "hecke_engine.h"    /* from tools/hecke-engine-c/include/ */

/* ── version ── */
static Obj Func_QOU_HECKE_C_VERSION(Obj self) {
    const char* v = qou_hecke_version();
    return MakeString(v);
}

/* ── scalar f64 → f64 helpers ── */
static Obj Func_QOU_HECKE_C_MARKOV_Z(Obj self, Obj q) {
    if (!IS_MACFLOAT(q)) ErrorMayQuit("QOU_MarkovZ: q must be a float", 0, 0);
    return NEW_MACFLOAT(qou_hecke_markov_z(VAL_MACFLOAT(q)));
}

static Obj Func_QOU_HECKE_C_HECKE_H(Obj self, Obj q) {
    if (!IS_MACFLOAT(q)) ErrorMayQuit("QOU_HeckeH: q must be a float", 0, 0);
    return NEW_MACFLOAT(qou_hecke_h(VAL_MACFLOAT(q)));
}

static Obj Func_QOU_HECKE_C_GRAM_DET(Obj self, Obj q) {
    if (!IS_MACFLOAT(q)) ErrorMayQuit("QOU_GramDet: q must be a float", 0, 0);
    return NEW_MACFLOAT(qou_hecke_gram_det(VAL_MACFLOAT(q)));
}

/* ── vector returns (length-6 floats) ── */
static Obj Func_QOU_HECKE_C_TRACE_WEIGHTS(Obj self, Obj q) {
    if (!IS_MACFLOAT(q)) ErrorMayQuit("QOU_TraceWeights: q must be a float", 0, 0);
    double out[6];
    qou_hecke_trace_weights(VAL_MACFLOAT(q), out);

    Obj list = NEW_PLIST(T_PLIST_DENSE_NHOM, 6);
    SET_LEN_PLIST(list, 6);
    for (int i = 0; i < 6; i++) {
        SET_ELM_PLIST(list, i + 1, NEW_MACFLOAT(out[i]));
        CHANGED_BAG(list);
    }
    return list;
}

/* ── 36-float gram-matrix flatten ── */
static Obj Func_QOU_HECKE_C_GRAM_MATRIX_FLAT(Obj self, Obj q) {
    if (!IS_MACFLOAT(q)) ErrorMayQuit("QOU_GramMatrix: q must be a float", 0, 0);
    double out[36];
    qou_hecke_gram_matrix_flat(VAL_MACFLOAT(q), out);

    Obj list = NEW_PLIST(T_PLIST_DENSE_NHOM, 36);
    SET_LEN_PLIST(list, 36);
    for (int i = 0; i < 36; i++) {
        SET_ELM_PLIST(list, i + 1, NEW_MACFLOAT(out[i]));
        CHANGED_BAG(list);
    }
    return list;
}

/* ── Phase B — variable-length-input handlers ── */

/* Helper: GAP plist of small-ints → C size_t array.
 * Caller must free *out_arr with free() if *out_len > 0. */
static int plist_to_size_array(Obj plist, size_t** out_arr, size_t* out_len,
                                const char* fnname) {
    if (!IS_PLIST(plist)) {
        ErrorMayQuit("%s: expected a plain list", (Int)fnname, 0);
        return -1;
    }
    UInt n = LEN_PLIST(plist);
    *out_len = (size_t)n;
    if (n == 0) { *out_arr = NULL; return 0; }
    *out_arr = (size_t*)malloc(n * sizeof(size_t));
    if (*out_arr == NULL) {
        ErrorMayQuit("%s: out of memory", (Int)fnname, 0);
        return -1;
    }
    for (UInt i = 1; i <= n; i++) {
        Obj e = ELM_PLIST(plist, i);
        if (!IS_INTOBJ(e) || INT_INTOBJ(e) < 0) {
            free(*out_arr); *out_arr = NULL;
            ErrorMayQuit("%s: list entries must be non-negative small ints",
                         (Int)fnname, 0);
            return -1;
        }
        (*out_arr)[i - 1] = (size_t)INT_INTOBJ(e);
    }
    return 0;
}

/* Helper: GAP plist of signed small-ints → C int32_t array. */
static int plist_to_i32_array(Obj plist, int32_t** out_arr, size_t* out_len,
                               const char* fnname) {
    if (!IS_PLIST(plist)) {
        ErrorMayQuit("%s: expected a plain list", (Int)fnname, 0);
        return -1;
    }
    UInt n = LEN_PLIST(plist);
    *out_len = (size_t)n;
    if (n == 0) { *out_arr = NULL; return 0; }
    *out_arr = (int32_t*)malloc(n * sizeof(int32_t));
    if (*out_arr == NULL) {
        ErrorMayQuit("%s: out of memory", (Int)fnname, 0);
        return -1;
    }
    for (UInt i = 1; i <= n; i++) {
        Obj e = ELM_PLIST(plist, i);
        if (!IS_INTOBJ(e)) {
            free(*out_arr); *out_arr = NULL;
            ErrorMayQuit("%s: list entries must be small ints", (Int)fnname, 0);
            return -1;
        }
        (*out_arr)[i - 1] = (int32_t)INT_INTOBJ(e);
    }
    return 0;
}

/* QOU_ChiLambdaBraid: chi_lambda(beta) at q.
 * Args: shape (plist of nonneg ints),
 *       word_gens (plist of signed ints),
 *       word_exps (plist of nonneg ints, same length as word_gens),
 *       q (float). */
static Obj Func_QOU_HECKE_C_CHI_LAMBDA_BRAID(Obj self, Obj shape, Obj word_gens,
                                    Obj word_exps, Obj q) {
    if (!IS_MACFLOAT(q)) ErrorMayQuit("QOU_ChiLambdaBraid: q must be a float", 0, 0);
    size_t shape_len, gens_len, exps_len;
    size_t* shape_arr = NULL;
    int32_t* gens_arr = NULL;
    uint32_t* exps_arr = NULL;
    if (plist_to_size_array(shape, &shape_arr, &shape_len,
                             "QOU_ChiLambdaBraid") != 0) return Fail;
    if (plist_to_i32_array(word_gens, &gens_arr, &gens_len,
                            "QOU_ChiLambdaBraid") != 0) {
        free(shape_arr); return Fail;
    }
    /* word_exps: same as size array but cast to uint32. */
    if (!IS_PLIST(word_exps)) {
        free(shape_arr); free(gens_arr);
        ErrorMayQuit("QOU_ChiLambdaBraid: word_exps must be a plain list", 0, 0);
        return Fail;
    }
    exps_len = (size_t)LEN_PLIST(word_exps);
    if (exps_len != gens_len) {
        free(shape_arr); free(gens_arr);
        ErrorMayQuit("QOU_ChiLambdaBraid: word_gens and word_exps must have the same length",
                     0, 0);
        return Fail;
    }
    if (exps_len > 0) {
        exps_arr = (uint32_t*)malloc(exps_len * sizeof(uint32_t));
        if (exps_arr == NULL) {
            free(shape_arr); free(gens_arr);
            ErrorMayQuit("QOU_ChiLambdaBraid: out of memory", 0, 0);
            return Fail;
        }
        for (UInt i = 1; i <= (UInt)exps_len; i++) {
            Obj e = ELM_PLIST(word_exps, i);
            if (!IS_INTOBJ(e) || INT_INTOBJ(e) < 0) {
                free(shape_arr); free(gens_arr); free(exps_arr);
                ErrorMayQuit("QOU_ChiLambdaBraid: word_exps entries must be non-negative small ints",
                             0, 0);
                return Fail;
            }
            exps_arr[i - 1] = (uint32_t)INT_INTOBJ(e);
        }
    }

    double chi = qou_hecke_chi_lambda_braid(
        shape_arr, shape_len,
        gens_arr, exps_arr, gens_len,
        VAL_MACFLOAT(q));

    free(shape_arr); free(gens_arr); free(exps_arr);
    return NEW_MACFLOAT(chi);
}

/* QOU_LRCoefficient: c^lambda_{mu nu}. */
static Obj Func_QOU_HECKE_C_LR_COEFFICIENT(Obj self, Obj lambda, Obj mu, Obj nu) {
    size_t lam_len, mu_len, nu_len;
    size_t* lam_arr = NULL;
    size_t* mu_arr  = NULL;
    size_t* nu_arr  = NULL;
    if (plist_to_size_array(lambda, &lam_arr, &lam_len, "QOU_LRCoefficient") != 0)
        return Fail;
    if (plist_to_size_array(mu, &mu_arr, &mu_len, "QOU_LRCoefficient") != 0) {
        free(lam_arr); return Fail;
    }
    if (plist_to_size_array(nu, &nu_arr, &nu_len, "QOU_LRCoefficient") != 0) {
        free(lam_arr); free(mu_arr); return Fail;
    }
    int64_t c = qou_hecke_lr_coefficient(
        lam_arr, lam_len,
        mu_arr,  mu_len,
        nu_arr,  nu_len);
    free(lam_arr); free(mu_arr); free(nu_arr);
    return ObjInt_Int8(c);
}

/* QOU_TraceMpfr: arbitrary-precision Markov trace. */
static Obj Func_QOU_HECKE_C_TR_M_ATOMIC_MPFR(Obj self, Obj word_signs, Obj word_gens,
                               Obj n_strands, Obj q_str, Obj dps) {
    if (!IS_INTOBJ(n_strands) || INT_INTOBJ(n_strands) < 1)
        ErrorMayQuit("QOU_TraceMpfr: n_strands must be a positive small int", 0, 0);
    if (!IS_STRING(q_str))
        ErrorMayQuit("QOU_TraceMpfr: q_str must be a string", 0, 0);
    if (!IS_INTOBJ(dps) || INT_INTOBJ(dps) < 1)
        ErrorMayQuit("QOU_TraceMpfr: dps must be a positive small int", 0, 0);

    size_t signs_len, gens_len;
    int32_t* gens_arr = NULL;
    int8_t*  signs_arr = NULL;

    /* Read signs into a temporary int32 buffer, then narrow to int8. */
    if (!IS_PLIST(word_signs)) {
        ErrorMayQuit("QOU_TraceMpfr: word_signs must be a plain list", 0, 0);
        return Fail;
    }
    signs_len = (size_t)LEN_PLIST(word_signs);
    if (signs_len > 0) {
        signs_arr = (int8_t*)malloc(signs_len * sizeof(int8_t));
        if (signs_arr == NULL) {
            ErrorMayQuit("QOU_TraceMpfr: out of memory", 0, 0); return Fail;
        }
        for (UInt i = 1; i <= (UInt)signs_len; i++) {
            Obj e = ELM_PLIST(word_signs, i);
            if (!IS_INTOBJ(e)) {
                free(signs_arr);
                ErrorMayQuit("QOU_TraceMpfr: word_signs entries must be small ints",
                             0, 0);
                return Fail;
            }
            Int s = INT_INTOBJ(e);
            if (s != -1 && s != 1) {
                free(signs_arr);
                ErrorMayQuit("QOU_TraceMpfr: word_signs entries must be -1 or +1",
                             0, 0);
                return Fail;
            }
            signs_arr[i - 1] = (int8_t)s;
        }
    }

    if (plist_to_i32_array(word_gens, &gens_arr, &gens_len,
                            "QOU_TraceMpfr") != 0) {
        free(signs_arr); return Fail;
    }
    if (signs_len != gens_len) {
        free(signs_arr); free(gens_arr);
        ErrorMayQuit("QOU_TraceMpfr: word_signs and word_gens must have the same length",
                     0, 0);
        return Fail;
    }

    UInt dps_v = (UInt)INT_INTOBJ(dps);
    size_t buf_len = dps_v + 64;
    char* buf = (char*)malloc(buf_len);
    if (buf == NULL) {
        free(signs_arr); free(gens_arr);
        ErrorMayQuit("QOU_TraceMpfr: out of memory", 0, 0);
        return Fail;
    }

    int status = qou_hecke_tr_m_atomic_mpfr(
        signs_arr, gens_arr, signs_len,
        (size_t)INT_INTOBJ(n_strands),
        CSTR_STRING(q_str),
        (uint32_t)dps_v,
        buf, buf_len);

    if (status == 2) {
        /* Truncated; retry with 4× buffer. */
        free(buf); buf_len *= 4;
        buf = (char*)malloc(buf_len);
        if (buf == NULL) {
            free(signs_arr); free(gens_arr);
            ErrorMayQuit("QOU_TraceMpfr: out of memory on retry", 0, 0);
            return Fail;
        }
        status = qou_hecke_tr_m_atomic_mpfr(
            signs_arr, gens_arr, signs_len,
            (size_t)INT_INTOBJ(n_strands),
            CSTR_STRING(q_str),
            (uint32_t)dps_v,
            buf, buf_len);
    }

    Obj result;
    if (status == 0) {
        result = MakeString(buf);
    } else {
        /* Surface the engine's error message verbatim. */
        char err[512];
        snprintf(err, sizeof(err), "QOU_TraceMpfr: status=%d — %s", status, buf);
        free(signs_arr); free(gens_arr); free(buf);
        ErrorMayQuit("%s", (Int)err, 0);
        return Fail;
    }
    free(signs_arr); free(gens_arr); free(buf);
    return result;
}

/* ── GAP registration table ── */
static StructGVarFunc GVarFuncs[] = {
    GVAR_FUNC(_QOU_HECKE_C_VERSION,           0, ""),
    GVAR_FUNC(_QOU_HECKE_C_MARKOV_Z,          1, "q"),
    GVAR_FUNC(_QOU_HECKE_C_HECKE_H,           1, "q"),
    GVAR_FUNC(_QOU_HECKE_C_TRACE_WEIGHTS,     1, "q"),
    GVAR_FUNC(_QOU_HECKE_C_GRAM_MATRIX_FLAT,  1, "q"),
    GVAR_FUNC(_QOU_HECKE_C_GRAM_DET,          1, "q"),
    GVAR_FUNC(_QOU_HECKE_C_CHI_LAMBDA_BRAID,  4, "shape, word_gens, word_exps, q"),
    GVAR_FUNC(_QOU_HECKE_C_LR_COEFFICIENT,    3, "lambda, mu, nu"),
    GVAR_FUNC(_QOU_HECKE_C_TR_M_ATOMIC_MPFR,  5, "word_signs, word_gens, n_strands, q_str, dps"),
    { 0, 0, 0, 0, 0 }
};

static Int InitKernel(StructInitInfo* module) {
    InitHdlrFuncsFromTable(GVarFuncs);
    return 0;
}

static Int InitLibrary(StructInitInfo* module) {
    InitGVarFuncsFromTable(GVarFuncs);
    return 0;
}

static StructInitInfo module = {
    /* type        = */ MODULE_DYNAMIC,
    /* name        = */ "HeckeEngine",
    /* revision_c  = */ 0,
    /* revision_h  = */ 0,
    /* version     = */ 0,
    /* crc         = */ 0,
    /* initKernel  = */ InitKernel,
    /* initLibrary = */ InitLibrary,
    /* checkInit   = */ 0,
    /* preSave     = */ 0,
    /* postSave    = */ 0,
    /* postRestore = */ 0,
};

StructInitInfo* Init__Dynamic(void) {
    return &module;
}
