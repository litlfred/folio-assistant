---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-027-algorithm-family
section_title: "Algorithm Family"
section_number: null
pages: 47-47
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Each algorithm in the family, PTRRα for fixed α, is a slightly modified version of Algo-
rithm 1 in [BR25]. While playing arm i, we keep pulling it as long as fi(ti) ≥m

ti
τ
α
,
where τ is an internal horizon parameter (set to T −k when T is known), m is an ap-
proximation of the maximum final pull, and ti denotes the number of pulls of i so far.
When the inequality first fails, we abandon i and move to a uniformly random new arm,
repeating until time T. In this section, we focus on the cumulative reward R accumulated
by the algorithm. We will study the estimated best arm ˆi in Section 4.4.
Algorithm 4 PTRRα
1: estimated max final pull m, internal horizon τ
2: t ←0, R ←0, S ←{1, . . . , k}
3: while t < T do
4:
sample i uniformly from S
5:
S ←S \ {i}, ti ←0
6:
while fi(ti) ≥m

ti
τ
α
do
7:
pull arm i
8:
ti ←ti + 1, t ←t + 1, R ←R + fi(ti)
9:
end while
10: end while
11: return R,ˆi ←argmaxifi(ti)
Definition 4.3.1. Define the family of algorithms PTRR as {PTRRα : α ∈(0, 1]}, where
PTRRα (α-Power-Thresholded Round Robin) is Algorithm 4.
4.3.2
