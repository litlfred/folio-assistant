---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-014-agent-discovered-helper-lemma
section_title: "Agent-Discovered Helper Lemma"
section_number: null
pages: 10-13
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
This lemma is part of the formalization of Williamson & Yoder (2024), specifically addressing the
lower bound on space distance. The agent introduced this intermediate lemma on its own to complete
the proof of the space distance lower bound in the fault-tolerant quantum computation formalization.
Given a Cheeger-like expansion parameter h(G), a cleaning set of size at most the cleaned operator
weight, and a boundary satisfying the isoperimetric inequality, the lemma establishes:
w′ −|S| + |∂S| ≥min(h(G), 1) · d,
where w′ is the cleaned weight, |S| the cleaning set size, |∂S| the boundary size, and d the code
distance. The proof splits on whether h(G) ≥1, using a calc chain with nlinarith in each
branch.
theorem weight_inequality_core
(hG : R) (hG_nonneg : 0 <= hG)
(d : N) (_hd_pos : 0 < d)
(cleanedWeight : N)
(hCleaned : cleanedWeight >= d)
(cleaningSetSize : N)
(hCleaningBound : cleaningSetSize <= cleanedWeight)
(boundarySize : N)
(hCheeger : (boundarySize : R) >= hG * cleaningSetSize) :
(cleanedWeight : R) - cleaningSetSize + boundarySize
>= minCheegerOne hG * d := by
simp only [minCheegerOne]
by_cases hG_ge_1 : hG >= 1
. -- Case h(G) >= 1: boundarySize >= cleaningSetSize, so result
>= cleanedWeight >= d
10
rw [min_eq_right hG_ge_1]
have hBound : (boundarySize : R) >= cleaningSetSize := by
calc (boundarySize : R) >= hG * cleaningSetSize := hCheeger
_ >= 1 * cleaningSetSize := by nlinarith
_ = cleaningSetSize := one_mul _
have hCleaned’ : (cleanedWeight : R) >= d :=
Nat.cast_le.mpr hCleaned
linarith
. -- Case h(G) < 1
push_neg at hG_ge_1
rw [min_eq_left (le_of_lt hG_ge_1)]
have hClean : (cleanedWeight : R) >= d :=
Nat.cast_le.mpr hCleaned
have hS’ : (cleaningSetSize : R) <= cleanedWeight :=
Nat.cast_le.mpr hCleaningBound
calc (cleanedWeight : R) - cleaningSetSize + boundarySize
>= cleanedWeight - cleaningSetSize
+ hG * cleaningSetSize := by linarith
_ = cleanedWeight
+ (hG - 1) * cleaningSetSize := by ring
_ >= cleanedWeight
+ (hG - 1) * cleanedWeight := by nlinarith
_ = hG * cleanedWeight := by ring
_ >= hG * d := by nlinarith
A.3
AXIOM EXAMPLE: K ¨UNNETH FORMULA
This example is drawn from the formalization of Breuckmann & Eberhardt (2021), where the K¨unneth
formula is essential for calculating the homology of balanced product codes. The K¨unneth formula
is a fundamental result in homological algebra that relates the homology of a tensor product of
two chain complexes to the tensor products of their individual homologies. Given chain complexes
C = (C•, ∂C) and D = (D•, ∂D) over F2, the formula states:
Hn(C ⊗D) ∼=
M
p+q=n
Hp(C) ⊗Hq(D).
Over a field such as F2, all modules are flat, so the Tor correction terms vanish and the K¨unneth map is
an isomorphism. The isomorphism sends a pair of homology classes [z] ∈Hp(C) and [w] ∈Hq(D)
to the class [z ⊗w] ∈Hp+q(C ⊗D). Proving this in Lean 4 requires (i) showing the tensor product
of cycles is a cycle, (ii) showing boundaries are preserved so the map descends to homology, and
(iii) establishing bijectivity. Steps (i)–(iii) involve unfolding the internal colimit structure of Mathlib’s
total complex, which is not yet supported; these are axiomatized. The full formalization is shown
below.
The 4 snippets below correspond to the definition of types, followed by the three proof steps (i)–(iii).
First, we define the source type (direct sum of tensor products of homologies) and the target type
(homology of the tensor product):
variable (C D : F2ChainComplex)
/-- All F2-modules are flat (free modules are flat). -/
instance flat_F2_module (M : Type*) [AddCommGroup M]
[Module F2 M] : Module.Flat F2 M :=
Module.Flat.of_free
/-- Tensor product of homology spaces. -/
noncomputable def HomologyTensor (p q : Z) : Type :=
(C.Homology p) (x)[F2] (D.Homology q)
11
...
/-- Index set: pairs (p,q) with p + q = n. -/
def KunnethIndex (n : Z) : Type :=
{ pq : Z x Z // pq.1 + pq.2 = n }
/-- The direct sum (+)_{p+q=n} H_p(C) (x) H_q(D). -/
noncomputable def KunnethDirectSum (n : Z) : Type :=
Pi_0 (i : KunnethIndex n),
HomologyTensor C D i.val.1 i.val.2
...
/-- Homology of the tensor product complex at degree n. -/
noncomputable abbrev TensorHomology (n : Z) : Type :=
(TensorProductComplex C D).Homology n
Step (i): Constructing the map on cycles. We show that the tensor product of cycles is a cycle,
allowing us to define the cross product on cycles:
/-- Map from C_p (x) D_q to (C (x) D)_{p+q}. -/
noncomputable def tensorInclusion (p q : Z) :
(C.X p) (x)[F2] (D.X q) ->l[F2]
(TensorProductComplex C D).X (p + q) :=
(TensorProductComplex.i C D p q).hom
/-- Axiom: z (x) w is a cycle when both z, w are cycles.
d(z (x) w) = dz (x) w +- z (x) dw = 0. -/
axiom cycle_tensor_cycle_is_cycle’_aux
(C D : F2ChainComplex) (p q : Z)
(z : C.X p) (hz : z in C.Cycles p)
(w : D.X q) (hw : w in D.Cycles q) :
tensorInclusion C D p q (z (xt) w) in
(TensorProductComplex C D).Cycles (p + q)
/-- Map from C.Cycles p (x) D.Cycles q to total cycles. -/
noncomputable def cyclesCrossProduct (p q : Z) :
(C.Cycles p) (x)[F2] (D.Cycles q) ->l[F2]
(TensorProductComplex C D).Cycles (p + q) := by
...
-- bilinear map lifting cycle_tensor_cycle_is_cycle’
Step (ii): Descent to homology. We axiomatize that boundaries are preserved under the cross product,
ensuring the map descends to a well-defined map on homology:
/-- Axiom: boundary (x) cycle is a boundary.
If z = dz’, then z (x) w = d(z’ (x) w) since dw = 0. -/
axiom boundary_tensor_cycle_is_boundary’_aux
(C D : F2ChainComplex) (p q : Z)
(z : C.Cycles p) (hz : z.val in C.Boundaries p)
(w : D.Cycles q) :
(cyclesCrossProduct C D p q (z (xt) w)).val in
(TensorProductComplex C D).Boundaries (p + q)
/-- Axiom: cycle (x) boundary is a boundary.
If w = dw’, then z (x) w = d(z (x) w’) since dz = 0. -/
axiom cycle_tensor_boundary_is_boundary’_aux
(C D : F2ChainComplex) (p q : Z)
(z : C.Cycles p)
12
(w : D.Cycles q) (hw : w.val in D.Boundaries q) :
(cyclesCrossProduct C D p q (z (xt) w)).val in
(TensorProductComplex C D).Boundaries (p + q)
Step (iii): Bijectivity and the Main Theorem. Finally, we construct the K¨unneth map and axiomatize
its bijectivity to establish the isomorphism:
...
/-- Cross product descends to homology: [z] (x) [w] |-> [z (x) w].
-/
noncomputable def kunnethComponentMap (p q : Z) :
HomologyTensor C D p q ->l[F2]
TensorHomology C D (p + q) :=
TensorProduct.lift (kunnethComponentMapAux2 C D p q)
/-- The Kunneth map from (+)_{p+q=n} H_p(C) (x) H_q(D)
to H_n(C (x) D). -/
noncomputable def kunnethMap (n : Z) :
KunnethDirectSum C D n ->l[F2]
TensorHomology C D n := by
refine DFinsupp.lsum N ?_
intro <<p, q>, hpq>
subst hpq
exact kunnethComponentMap C D p q
/-- Axiom: the Kunneth map is injective over F2. -/
axiom kunnethMap_injective_aux
(C D : F2ChainComplex) (n : Z) :
Function.Injective (kunnethMap C D n)
/-- Axiom: the Kunneth map is surjective over F2. -/
axiom kunnethMap_surjective_aux
(C D : F2ChainComplex) (n : Z) :
Function.Surjective (kunnethMap C D n)
/-- Kunneth Formula:
(+)_{p+q=n} H_p(C) (x) H_q(D) ˜= H_n(C (x) D). -/
noncomputable def kunnethEquiv (n : Z) :
KunnethDirectSum C D n ˜=l[F2]
TensorHomology C D n :=
LinearEquiv.ofBijective (kunnethMap C D n)
<kunnethMap_injective C D n,
kunnethMap_surjective C D n>
13
