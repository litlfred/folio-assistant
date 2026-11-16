---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-011-reproducing-kernel-hilbert-space
section_title: "Reproducing Kernel Hilbert Space"
section_number: null
pages: 16-16
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
As mentioned before, a GP defines a probability distribution on a function space. What exactly
is that function space? Inspecting (4.2), we see that GP(0, 𝑘) describes a set of posterior means
𝑥↦→
𝑛
∑︁
𝑖=1
𝛼𝑖𝑘(𝑥𝑖, 𝑥)
where 𝛼𝑖=

𝑘(𝑋, 𝑋) + 𝜎2
𝑛𝐼
−1
𝑌,
(4.4)
for under all possible dataset D. Note that this set of functions is fully characterized by the choice
of the kernel of a GP. Indeed, (𝑘(𝑥𝑖, ·) ∈R𝑛)𝑛
𝑖=1, seen as vectors, act as a basis of the resulting
functions. These basis vectors vary depending on the evaluation points 𝑋.
We define the reproducing kernel Hilbert space (RKHS) H𝑘of GP(0, 𝑘) to be the completion
of the space of functions above. It is endowed with the inner product
⟨𝑓, 𝑓′⟩=
𝑛
∑︁
𝑖=1
𝑚
∑︁
𝑗=1
𝛼𝑖𝛼′
𝑗𝑘(𝑥𝑖, 𝑥′
𝑗)
(4.5)
for 𝑓= P𝑛
𝑖=1 𝛼𝑖𝑘(𝑥𝑖, ·) and 𝑓′ = P𝑚
𝑗=1 𝛼′
𝑗𝑘(𝑥′
𝑗, ·).
The RKHS inner product induced a norm ∥· ∥𝐻𝑘that tells us about the “complexity” of a
function in 𝐻𝑘. Under this norm, we can define the RKHS ball of radius 𝑟by
H𝑘[𝑏] := { 𝑓∈𝐻𝑘such that ∥𝑓∥𝐻𝑘≤𝑏},
(4.6)
which contains all possible GP posterior means under a kernel 𝑘with “complexity” at most 𝑏.
