---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-033-generation-settings
section_title: "Generation Settings"
section_number: null
pages: 26-27
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
In this section, we specify the settings used for model generation to ensure reproducibility across all
experiments, including baseline models and variations enhanced with verifiers.
For the generation of results using the "greedy" strategy, we set the temperature parameter to 0.0 and
0.7 for the "pass@k" strategy. To present unbiased results for "pass@k", we follow the calculation
26
Work in progress
method outlined in (Chen et al., 2021). Specifically, we generate n = 20 samples for each instance,
evaluate the number of correct samples passing unit tests, and then calculate the unbiased estimator
for pass@k.
It’s important to note that all generation scripts are based on the vLLM framework (Kwon et al.,
2023) for efficient inference of LLMs.
I.3
