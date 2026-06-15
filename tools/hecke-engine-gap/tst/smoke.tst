#############################################################################
##  smoke.tst — HeckeEngine smoke test.
##
##  Run via: gap -A --quitonbreak tst/smoke.tst
##  (or as part of the standard package test suite).

gap> START_TEST("HeckeEngine smoke");
gap> LoadPackage("HeckeEngine", false);
true
gap> v := QOU_HeckeEngine_Version();;
gap> v <> "";
true
gap> q0 := 1.10998;;
gap> z := QOU_MarkovZ(q0);;
gap> z > 0.0;
true
gap> h := QOU_HeckeH(q0);;
gap> AbsoluteValue(h - (q0 - 1.0/q0)) < 1e-12;
true
gap> w := QOU_TraceWeights(q0);;
gap> Length(w);
6
gap> AbsoluteValue(w[1] - 1.0) < 1e-12;
true
gap> AbsoluteValue(w[2] - z) < 1e-12;
true
gap> G := QOU_GramMatrix(q0);;
gap> Length(G);
6
gap> Length(G[1]);
6
gap> d := QOU_GramDet(q0);;
gap> d <> 0.0;
true

# ── Phase B ──
gap> chi_id := QOU_ChiLambdaBraid([3], [], q0);;
gap> AbsoluteValue(chi_id - 1.0) < 1e-12;
true
gap> chi_empty := QOU_ChiLambdaBraid([], [[1, 1]], q0);;
gap> AbsoluteValue(chi_empty - 1.0) < 1e-12;
true
gap> QOU_LRCoefficient([2], [1], [1]);
1
gap> QOU_LRCoefficient([3], [2], [2]);
0
gap> trace_str := QOU_TraceMpfr([[1, 1]], 3, "1.10998", 20);;
gap> IsString(trace_str) and Length(trace_str) > 0;
true

gap> STOP_TEST("smoke.tst");
