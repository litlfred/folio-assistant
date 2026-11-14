---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-027-generation-and-evaluation-prompts
section_title: "Generation and evaluation prompts"
section_number: null
pages: 19-19
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
The verbatim prompts used in the canonical run of §4 of the main text. All are run with Temperature
= 0, reasoning disabled, and tools disabled.
• B.1 is the generation prompt: each model produces its five-archetype portfolio from it.
• B.2 is the evaluation prompt, shown in its calibrated/anchored form — the version used
for the anchored re-evaluation and the official council ratings (§4.2–§4.4) and in the steady-
state protocol (§4.3). It scores one Target submission against a fixed Reference submission
pinned at {ANCHOR_SCORE} on every criterion.
The bootstrap’s initial all-against-all selection (§4.1) uses the un-anchored form of the same prompt
— identical six criteria and JSON schema, with the calibration machinery removed. The exact
passages that are absent in the un-anchored bootstrap pass are listed in the Bootstrap note after B.2,
so both forms are fully specified from the single prompt below.
Template variables appear in braces:
{SUBMISSIONS}, {REFERENCE_SUBMISSION},
{TARGET_SUBMISSION}, and {ANCHOR_SCORE} (swept across {5, 6, 7, 8}; fixed at 7 for
the official ratings).
B.1
