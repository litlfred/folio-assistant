---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-037-detailed-dataset-comparison-analysis
section_title: "Detailed Dataset Comparison Analysis"
section_number: null
pages: 28-29
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
Table 2 compares FORML4 with existing autoformalization datasets. Here, we provide a detailed
explanation and analysis for each characteristic:
Source Language: FORML4 and MMA use formal language as their source, while others use
natural language. This approach aligns with empirical findings by Jiang et al. (2023a) suggesting that
informalization is generally easier than formalization, potentially leading to higher-quality datasets.
Size: With more than 17k entries, FORML4 is significantly larger than most datasets except MMA
and Lean Workbook. This size allows for more comprehensive training and evaluation of autoformal-
ization models.
Includes Proofs: FORML4 and ProofNet are the only datasets that include proofs along with
statements. This feature is crucial for training process-driven autoformalizers and enables a more
holistic approach to mathematical reasoning.
Uses Lean 4: FORML4, MMA, and Lean Workbook use Lean 4, a modern theorem prover. This
choice ensures compatibility with current formal verification tools and practices.
Construction Method (1) Direction: FORML4 and MMA use informalization, while others use
formalization. The informalization approach may lead to more natural-sounding informal statements
and potentially easier dataset creation. (2) LLM-based: FORML4, MMA, Lean Workbook, and
FIMO use LLMs in their construction, leveraging recent advances in AI to create large-scale datasets
28
Work in progress
efficiently. (3) Human-Verified: All datasets except MMA incorporate human verification, ensuring
higher data quality. FORML4’s rigorous verification process, including task decomposition and data
inspection, sets it apart.
Primary Usage (1) Training: FORML4, MMA, and Lean Workbook are suitable for training, unlike
smaller datasets like ProofNet, Minif2f, and FIMO, which are primarily for benchmarking. (2)
Benchmarking: All datasets can be used for benchmarking, allowing for comprehensive evaluation
of autoformalization models across different dataset characteristics. (3) Process-Driven Feedback:
FORML4 and ProofNet uniquely offer process-driven feedback, crucial for training iterative autofor-
malizers. FORML4’s approach is fully automated, using the formal language compiler to process
proof steps and provide annotated feedback.
M
