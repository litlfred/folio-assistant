---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-037-the-administration-disclosed
section_title: "The administration, disclosed"
section_number: null
pages: 28-29
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
GPQA Diamond (198 questions) was administered 2026-06-13 — two weeks after the generation
run (2026-05-29), so no direction exists for the benchmark’s content to have been shaped by GPQA.
All twelve models were queried through the same gateway and protocol as the council run (Temper-
ature 0, no dedicated reasoning channel, no tools), with the question and four shuffled options only
— no key ever enters a prompt:
Answer the following multiple choice question. The last line of your reply
must be exactly ’Answer: $LETTER’ where $LETTER is one of A, B, C, D.
{question}
A) {A}
B) {B}
C) {C}
D) {D}
Option order is shuffled deterministically per question (seeded by question index, identically for
every model).
The administration was two-stage. “No dedicated reasoning channel” is not deliberation-off: mod-
els write visible derivations of vendor-idiosyncratic length before the answer line, and under the
initial 2,048-token cap the two Gemini seats were massively truncated — the first pass (preserved in
the run’s log) scored gemini-3.1-pro at 82/198 with 103 unparseable responses and gemini-2.5-flash
at 121/198 with 50, voids counted as wrong. The cap was raised to 8,192 and the void responses —
only the void ones — were re-asked; the published records are the patched set (13 residual voids per
Gemini seat, still counted as wrong). Two facts bound the bias: retries targeted only unparseable
responses, never parsed-but-wrong answers; and the retry success rate did not exceed the first pass’s
28
Preprint. arXiv:2606.21008 v3, September 2026.
scored-only accuracy on either seat (gemini-3.1-pro: 78/90 retried items correct, 86.7%, vs 86.3%
on its 95 parseable first-pass responses — above the published 80.81%; gemini-2.5-flash: 22/37,
59%, vs 81.8%). Both stages’ evidence ships with the package.
D.3
