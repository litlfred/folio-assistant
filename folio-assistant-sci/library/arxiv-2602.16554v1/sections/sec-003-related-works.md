---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-003-related-works
section_title: "Related Works"
section_number: null
pages: 2-2
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
LLM-based autoformalization and automated theorem provers demonstrated promising capabilities
on competition-level problems (Wu et al., 2022; Jiang et al., 2022). Subsequent work improved
upon these foundations by addressing proof detail expansion (Tarrach et al., 2024) and faithfulness
verification (Li et al., 2024; Liu et al., 2025; Peng et al., 2025). Extensions to domain-specific
applications include Euclidean geometry (Murphy et al., 2024), biomedical text (Zhang et al., 2025),
and physics (Zhang et al., 2026).
Recent work has shifted toward agentic systems that couple frontier LLMs with tool integration for
interactive theorem proving. Breen et al. (2025) demonstrated Ax-Prover, an MCP-based multi-agent
system using Claude Sonnet that outperforms specialized provers on out-of-domain benchmarks.
Xu & Odersky (2026) demonstrated “agentic proof automation” by mechanizing System Capless
(14,000+ lines of Lean 4) with 87% task success rate across 189 annotated tasks; their workflow is
human-guided, with humans providing definitions, theorems, and proof strategies while agents handle
mechanical proof engineering. Liu et al. (2026) proposed Numina-Lean-Agent, combining Claude
Code with MCP-based Lean tools including Lean-LSP-MCP for goal querying and theorem search;
it solved all 12 Putnam 2025 problems without model training and formalized the Brascamp–Lieb
theorem (8,000+ lines), though again requiring substantial human guidance.
Architecturally, MerLean closely resembles both systems—sharing the paradigm of agentic interaction
with Lean 4 in a generate-check-refine loop, frontier LLMs as the reasoning backbone, and the
ambition of formalizing research-level mathematics. The primary feature is that MerLean achieves
full-paper and fully automated end-to-end formalization without human guidance on the domain we
tested.
3
FRAMEWORK
MerLean is a bidirectional autoformalization framework comprising two complementary pipelines:
autoformalization translates mathematical research papers from LATEX into verified Lean 4 libraries
