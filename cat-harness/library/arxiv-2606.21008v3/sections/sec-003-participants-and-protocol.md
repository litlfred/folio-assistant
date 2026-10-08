---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-003-participants-and-protocol
section_title: "Participants and protocol"
section_number: null
pages: 2-2
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Twelve frontier LLMs from Anthropic, Google and OpenAI are the participants (named in §4.4),
each simultaneously generator and evaluator. The roster spans an order of magnitude in scale, three
vendors, and adjacent versions within families. All twelve are called with Temperature 0, reason-
ing disabled, tools disabled, so the one greedy response is the measurement. Each model generates
one portfolio — five archetypal contexts, each a template (typically 5–8 sentences, 6–10 slots; the
prompt fixes only the counts, Appendix B) with a metanym table of five domains, 25 instantia-
tions — then evaluates every other model’s portfolio under the six-axis rubric of Table 1, 1–10, one
anonymised target per call alongside a fixed anchor portfolio pinned at 7 on every axis: a 12×11
evaluator-by-generator matrix (Appendix A). Every official rating pools three full runs of the game
(§4.6); the anchor sweep behind the consistency ratings was run once, on the first run.
3.2
