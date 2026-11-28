---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-013-6-related-work
section_title: "Related Work"
section_number: 6
pages: 4-4
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Building on agentic frameworks like ReAct (Yao et al.,
2023), recent work equips LLMs to operate on real
repositories. SWE-agent (Yang et al., 2024a;b) introduces
an agent–computer interface for browsing, editing, and
executing code.
Code benchmarks have moved from
self-contained problems (Chen et al., 2021; Austin et al.,
2021; Hendrycks et al., 2021) to repository-level evaluation.
SWE-bench (Jimenez et al., 2024) pioneered repository-
scale issue resolution against hidden tests with a curated
subset (OpenAI, 2024). FrugalGPT (Chen et al., 2024a)
introduced cost-aware cascades, and RouteLLM (Ong
et al., 2025) formalized binary routing from preference
data for Pareto cost–quality gains. All the existing methods
condition on the prompt alone; SWE-Router differs by
conditioning on the partial agent trajectory. We provide
more related works in Section D.
