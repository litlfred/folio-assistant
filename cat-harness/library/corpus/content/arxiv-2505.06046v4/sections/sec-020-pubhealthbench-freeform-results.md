---
doc_id: arxiv-2505.06046v4
doc_title: "Healthy LLMs? Benchmarking LLM Knowledge of UK Government Public Health Information"
section_id: sec-020-pubhealthbench-freeform-results
section_title: "PubHealthBench-FreeForm results"
section_number: null
pages: 8-8
source_pdf: arxiv-2505.06046v4.pdf
source_sha256: 6d70ff446a42c7dc
toc_source: outline
---
The free form response setup is substantially more challenging for a few reasons: (1) it requires
recalling the correct guidance information without any hints from MCQA options, (2) it introduces
the possibility of LLMs hallucinating additional information that may be inconsistent with the source
text, and (3) the correct answer cannot be inferred via elimination of the other answer options. As a
result, all models achieve substantially lower scores in the free form setting by up to 60 percentage
points (ppts). The best performing model (o1) scores 74% (Table 4) and also sees the smallest
decline from its MCQA performance at -17ppts (Table 5). We provide comparable results using
three additional judge models in Appendix A.7, finding a high level of agreement across judges.
Notably there is also significant variation across models with some smaller LLMs (e.g Phi-4-14B)
showing over 45ppt declines from MCQA accuracy, while other similarly sized models (e.g Gemma-
3-12B) see drops of comparable magnitude to SOTA proprietary LLMs. Also, importantly, as ob-
served in the MCQA setting, LLMs consistently show more accurate knowledge of guidance in-
tended for the general public compared to clinical or professional guidance.
6
