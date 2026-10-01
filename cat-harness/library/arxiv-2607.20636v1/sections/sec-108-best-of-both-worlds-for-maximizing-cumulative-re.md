---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-108-best-of-both-worlds-for-maximizing-cumulative-re
section_title: "Best-of-both-worlds for Maximizing Cumulative Reward"
section_number: null
pages: 151-151
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In this section, we consider the problem of getting the best policy regret possible if it is
sublinear and reverting to optimal competitive ratio if it is not. In the main body, we
considered a similar formulation for best-arm identification. Here, we instead hybridize
between an algorithm known to get good policy regret on good instances from [MTPR22]
and an algorithm known to get optimal competitive ratio on worst-case instances from
[BR25].
We take a data-driven approach to identifying exactly how to hybridize, i.e.,
exactly when to switch from the policy-regret-optimizing algorithm to the competitive-
ratio-optimizing algorithm.
We note that as a result of this approach, we do not get
per-instance worst-case guarantees. This is an interesting direction for future work.
B.4.1
