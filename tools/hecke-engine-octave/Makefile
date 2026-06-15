# Octave MEX build for hecke-engine-c bindings.
#
# Assumes hecke-engine-c has been built (cd ../hecke-engine-c && cargo build --release).
# Compiles one MEX file per C-ABI function; mkoctfile links against
# libhecke_engine_c.{so,dylib} + the system libgmp + libmpfr that
# hecke-engine itself needs.

C_LIB_DIR  := ../hecke-engine-c/target/release
C_INC_DIR  := ../hecke-engine-c/include

# Default mkoctfile (Octave's MEX-compatible compiler driver).
MKOCTFILE := mkoctfile

CFLAGS := -I$(C_INC_DIR) -L$(C_LIB_DIR) \
          -lhecke_engine_c -lgmp -lmpfr -lpthread -ldl -lm \
          -Wl,-rpath,'$$ORIGIN/$(C_LIB_DIR)'

MEX_FILES := qou_hecke_version.mex            \
             qou_hecke_markov_z.mex           \
             qou_hecke_h.mex                  \
             qou_hecke_trace_weights.mex      \
             qou_hecke_gram_matrix.mex        \
             qou_hecke_gram_det.mex           \
             qou_hecke_chi_lambda_braid.mex   \
             qou_hecke_lr_coefficient.mex     \
             qou_hecke_tr_m_atomic_mpfr.mex

all: $(MEX_FILES)

%.mex: src/%.cc
	$(MKOCTFILE) --mex $(CFLAGS) -o $@ $<

clean:
	rm -f *.mex *.o

.PHONY: all clean
