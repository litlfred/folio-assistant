---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-103-uniform-convergence-implies-population-loss-near
section_title: "Uniform Convergence Implies Population Loss Near-Optimality"
section_number: null
pages: 141-142
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We recall the standard argument below for completeness.
Lemma B.3.2 (Uniform convergence implies near-optimality in population loss). Suppose
ˆα is the minimizer of
1
N
PN
i=1 l(Pi, α) for N large enough to satisfy uniform convergence
with error ϵ and α⋆:= arg minα EP∼D [lT (P, α)] . Then,
|EP∼D [lT (P, ˆα)] −EP∼D [lT (P, α⋆)]| < 2ϵ .
1To reiterate, we now consider D supported over I × Πk , where Πk = {πk} the set of permutations of
[k].
126
Proof. We can see this by adding and subtracting empirical losses:
|EP∼D [lT (P, ˆα)] −EP∼D [lT (P, α⋆)]| =

EP∼D [lT (P, ˆα)] −1
N
N
X
i=1
lT (Pi, ˆα)
(B.5)
+ 1
N
N
X
i=1
lT (Pi, ˆα) −1
N
N
X
i=1
lT (Pi, α⋆)
(B.6)
+ 1
N
N
X
i=1
lT (Pi, α⋆) −EP∼D [lT (P, α⋆)]

(B.7)
≤

EP∼D [lT (P, ˆα)] −1
N
N
X
i=1
lT (Pi, ˆα)

+
(B.8)
+

1
N
N
X
i=1
lT (Pi, α⋆) −EP∼D [lT (P, α⋆)]

(B.9)
≤2ϵ
(B.10)
Note that the term in Eqn. B.6 is negative, since ˆα is the minimizer of the empirical loss,
and the last inequality follows from the uniform convergence guarantee.
B.3.3
