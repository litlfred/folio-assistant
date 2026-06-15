dnl configure.ac — autoconf source for GAP HeckeEngine kernel extension.
dnl
dnl Generates the `configure` script that produces src/Makefile from
dnl src/Makefile.in. Mirrors the gap-packages/example template
dnl (https://github.com/gap-packages/example/blob/master/configure.ac).
dnl
dnl Build flow (downstream consumer):
dnl   cd src && ./configure --with-gaproot=$GAPROOT \
dnl                          --with-hecke-engine-c=../../hecke-engine-c
dnl   make

AC_PREREQ([2.69])
AC_INIT([HeckeEngine], [0.1.0], [https://github.com/litlfred/qou/issues])
AC_CONFIG_SRCDIR([HeckeEngine.c])

dnl ── GAP installation root ──
dnl --with-gaproot points at the directory containing bin/<arch>/gap.
AC_ARG_WITH([gaproot],
    [AS_HELP_STRING([--with-gaproot=PATH],
                    [path to a GAP installation (containing bin/<arch>/gap)])],
    [GAPROOT="$withval"],
    [GAPROOT=""])

AS_IF([test "x$GAPROOT" = "x"],
    [AC_MSG_ERROR([--with-gaproot=PATH is required; point at a GAP 4.12+ install root])])

AS_IF([test ! -f "$GAPROOT/sysinfo.gap"],
    [AC_MSG_ERROR([$GAPROOT/sysinfo.gap not found — is $GAPROOT a valid GAP root?])])

dnl Source the GAP arch-specific sysinfo to get GAParch + GAP_CFLAGS.
. "$GAPROOT/sysinfo.gap"
GAP_CFLAGS="$GAC_CFLAGS"
GAP_LDFLAGS="$GAC_LDFLAGS"
GAP_LIBS="$GAC_LIBS"

AC_SUBST([GAPROOT])
AC_SUBST([GAParch])
AC_SUBST([GAP_CFLAGS])
AC_SUBST([GAP_LDFLAGS])
AC_SUBST([GAP_LIBS])

dnl ── hecke-engine-c installation ──
dnl --with-hecke-engine-c points at the crate root (containing
dnl include/hecke_engine.h + target/release/libhecke_engine_c.so).
AC_ARG_WITH([hecke-engine-c],
    [AS_HELP_STRING([--with-hecke-engine-c=PATH],
                    [path to the hecke-engine-c crate root])],
    [HECKE_C_DIR="$withval"],
    [HECKE_C_DIR="../../hecke-engine-c"])

AS_IF([test ! -f "$HECKE_C_DIR/include/hecke_engine.h"],
    [AC_MSG_ERROR([$HECKE_C_DIR/include/hecke_engine.h not found; run `cargo build --release` in the hecke-engine-c crate first])])

HECKE_C_INC="$HECKE_C_DIR/include"
HECKE_C_LIB="$HECKE_C_DIR/target/release"

AC_SUBST([HECKE_C_INC])
AC_SUBST([HECKE_C_LIB])

dnl ── Compiler + tools ──
AC_PROG_CC

dnl ── Emit output files ──
AC_CONFIG_FILES([Makefile])
AC_OUTPUT
