---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-137-proof-of-lemma-734
section_title: "Proof of Lemma 7.3.4"
section_number: null
pages: 182-182
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Proof. As before, we compute the competitive ratio in two cases: one in which the stable
arm played the whole time would be optimal and one in which the striving arm pays off
as soon as the agent switches for good. Since the agent is alternating between αγ := γ+1
2
time on f1 and 1 −αγ time on f2 , we must account for this in the computation:
αγ · s −(1 −αγ)s + T −s
T
=
αγ · s −(1 −αγ)s + T −s
1
2(T −s)2 + αγ · s −(1 −αγ)s .
Solving, we get:
s2 −2sT + T 2 + s(2αγ −1) −2T = 0
(D.5)
s = T −α + 1
2 −1
2
q
(2αγ −1)2 + 4T(3 −2α)
(D.6)
= T −γ
2 −
p
γ2 + 4T(2 −γ)
2
.
(D.7)
We can plug this back in to get the competitive ratio:
(2αγ −1)s + T −s
T
= γ + γ(1 −γ)
2T
+ (1 −γ)
p
γ2 + 4T(2 −γ)
2T
.
Finally, the amount of time spent exploring on the striving arm is 1 −αγ fraction of
the total time pre-switch, which is:
1 −γ
2
·
 
T −γ
2 −
p
γ2 + 4T(2 −γ)
2
!
.
D.4
