---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-061-token-cost-and-time-efficiency
section_title: "Token, Cost, and Time Efficiency"
section_number: null
pages: 33-34
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
This section reports token usage, per-trial cost, and agent wall-clock time for the latest 18-
configuration aggregate, computed directly from the selected public result.json files (HF
main + PR#11 fixed at a26b2100, across v0.1 and v1.1 submissions) over the same healthy-first
three-trial selection used in the main result tables. Each trial records its own token counts and
agent-execution timing; where the provider is priced through our LiteLLM runtime it also records a
33
per-trial cost in USD. Token counts are available for all 18 configurations and LiteLLM cost for 10 of
them (several open-weight and CLI providers are not yet priced in our runtime). We average over
selected trials with recorded usage or cost and suppress any cell backed by fewer than 20 usable trials.
L.1
