---
doc_id: arxiv-2510.19207v2
doc_title: "Defending Against Prompt Injection with DataFilter"
section_id: sec-018-results-overview
section_title: "Results Overview"
section_number: null
pages: 8-8
source_pdf: arxiv-2510.19207v2.pdf
source_sha256: cdfa941ee76d59d0
toc_source: outline
---
Across all benchmarks, DataFilter consistently achieves
strong security while preserving utility, validating the design
goals from Section IV. First, DataFilter substantially reduces
attack success rates (ASR) to near zero in both instruction-
following (SEP) and agentic settings (AgentDojo, InjecAgent),
outperforming all other baselines in most cases, see Fig-
ure 1. Second, unlike detection-based defenses that sacrifice
usability due to high false positives, DataFilter maintains
utility within 1–2 percentage points of the undefended model
on AlpacaEval2 and AgentDojo. Third, because DataFil-
ter is model-agnostic, it protects both proprietary commer-
cial LLMs (e.g., gpt-4o) and open-weight backends (e.g.,
Llama-3.1-8B-Instruct), offering broad applicability.
Together, these results demonstrate that DataFilter overcomes
the classic trade-off faced by prior defenses: it simultane-
ously provides strong, generalizable security and preserves
system utility, all without requiring access to backend
model weights. The results support our goal of developing
DataFilter in Table I.
