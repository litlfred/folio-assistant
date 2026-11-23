---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-019-generation-rating
section_title: "Generation rating"
section_number: null
pages: 14-14
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
(A12).
A.1
GENERATION RATING
Evaluator t’s overall score of submission s averages within each axis, then across axes:
ot,s =
1
|X|
X
x∈X
1
|Ux|
X
u∈Ux
rt,s,x,u(θ∗),
(A2)
and the six-axis generation rating is the leave-self-out mean over the council C,
Gs =
1
|C \ {s}|
X
t∈C, t̸=s
ot,s.
(A3)
Intervals: 95% percentile bootstrap over the per-(submission, archetype) units; a gap Gs −Gs′ is
resolvable when the paired bootstrap puts its interval clear of 0. The official leaderboard’s G is the
split form (A13), G = 1
2(GF + GC), not (A3).
A.2
