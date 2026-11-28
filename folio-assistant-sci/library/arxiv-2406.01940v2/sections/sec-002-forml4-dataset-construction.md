---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-002-forml4-dataset-construction
section_title: "FormL4: Dataset Construction"
section_number: null
pages: 3-3
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
The rapid development of Lean 4 (de Moura & Ullrich, 2021) necessitates a benchmark to assess
LLMs’ autoformalization capabilities. Existing datasets (Jiang et al., 2023a; Ying et al., 2024a) aims
to create benchmarks by informalizing formal theorems from existing libraries. However, they rely
on zero-shot instructions to collect natural language statements from GPT-4 without quality checks
or rigorous post-processing. Additionally, it focuses solely on translating theorems, overlooking the
benefits of using proofs as context, which could enhance both the dataset quality and the evaluation
of autoformalization performance.
