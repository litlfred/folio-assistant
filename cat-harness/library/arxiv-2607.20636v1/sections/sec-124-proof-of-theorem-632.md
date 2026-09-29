---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-124-proof-of-theorem-632
section_title: "Proof of Theorem 6.3.2"
section_number: null
pages: 170-170
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Proof. We apply Wald’s first equation to upper bound the amount of time for which the
subsidy must be released. This time, we imagine that we must move from a state where
there are two more choices for B than A to a state where there are two more choices
for A than B.
This reduces to the problem of a random walk with probability p of
moving right hitting 2 when starting from -2 (with no left stopping point). Let N be the
stopping time at which this event occurs. Using Wald’s equation, we have E[SN] = 4 and
E[X1] = p · 1 + (1 −p) · −1 = 2p −1. Then, E[N] = E[SN]
E[X1] =
4
2p−1. The corresponding
subsidy calculation considers the worst-case scenario where each round necessitates the
maximum subsidy R, leading to:
E[Total subsidy] = R × E(N) = R ×
4
2p −1.
C.6
