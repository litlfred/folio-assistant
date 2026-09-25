---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-017-55-ablation-study
section_title: "Ablation Study"
section_number: 5.5
pages: 8-8
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
We ablate components of Doc-Researcher, and validate different
architectural design as follows:
Hybrid Retrieval Necessity. Within our deep parsing frame-
work, hybrid retrieval (42.4-50.6%) outperforms text-only (39.2-
45.6%) by 3-5%. This shows that even with high-quality textual
transcriptions in both coarse and fine-grained level, some visual se-
mantics is lost. In comparison, visual encoders that directly encode
using chunk image, can capture irreplaceable semantics. This vali-
dates our hybrid retrieval design over single-modality approaches.
Adaptive Planning Impact. Removing the Planner causes the
accuracy drop of 6-8%. Without it, the system defaults to uniform
chunk retrieval across given noisy document sets. In this setting,
the system loses capabilities as follows: (1) strategic document
filtering (critical for M4DocBench’s 12.7-document average for
each question), and (2) query-adaptive granularity selection. This
confirms that multi-granular representations require intelligent
selection to be effective.
Effect of Iterative Search. Figure 3 demonstrates how iterative
refinement progressively improves retrieval and answer quality.
Document-level recall jumps from 62-65% (turn 1) to 75-82% (turn
3), then plateaus at approximately 82-83% by turn 5, indicating
that the search-refine loop effectively identifies relevant documents
within 2-3 iterations. Accuracy exhibits substantial gains: Qwen3-
32B improves by 7.2%, Qwen3-235B by 9.7%, and DeepSeek-R1 by
11.1% from turn 1 to turn 5. However, the steepest improvements
occur between turns 1-3, after which gains diminish despite accu-
mulating additional chunks (from 7-10 at turn 1 to 14-17 at turn
5), suggesting increasing redundancy. Notably, stronger models
achieve higher accuracy with fewer chunks (DeepSeek-R1: 14.1 vs
Qwen3-32B: 17.2 at turn 5), indicating more efficient evidence selec-
tion. Fine-grained layout recall follows similar patterns, improving
from 24-26% to 40-45%. These results validate our iterative search
design while suggesting that 3 iterations offer an optimal balance
between retrieval quality and computational efficiency.
5.6
