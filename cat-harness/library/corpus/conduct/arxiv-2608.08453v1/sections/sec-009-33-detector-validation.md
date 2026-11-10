---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-009-33-detector-validation
section_title: "Detector Validation"
section_number: 3.3
pages: 4-4
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
We validate detectors with mutation-style SKILL.md fixtures
and threshold sensitivity checks. Each of the 31 detectors
has a positive fixture that isolates the target defect and a
paired negative fixture; all detectors fire only on the posi-
tive case. For numeric thresholds (description length, body
length, inline-code ratio, code-block count, monolithic-body
length), lenient, baseline, and strict settings on a determin-
istic 10,000-skill sample preserve the headline result: 88.8–
94.6% of skills contain at least one detected defect, and the
top three categories remain R1 Routing, R2 Body, and R3
Resources.
3.4
Routing Stress Test
We also run a deterministic retrieval stress test over 20,000
skills. We build a BM25 index over frontmatter descriptions
only and ask whether metadata-derived or name/path-derived
queries retrieve the source skill. This is not an end-to-end
agent benchmark, and we do not claim BM25 mirrors pro-
duction routing: shipped harnesses such as Claude Code
and Cursor use LLM-as-selector over the full description set
rather than lexical scoring. We choose lexical retrieval delib-
erately as a lower-bound probe: it is the simplest mechanism
for which a routing-defective description (missing, too short,
missing trigger language, or non-functional) can plausibly
degrade discovery. A more semantic retriever (embedding
reranker or LLM selector) may compress or shift the gap,
particularly when descriptions are phrased differently than
queries; we treat the BM25 result as evidence that routing-
metadata defects have at least the magnitude observed here
at the discovery stage, and we flag the semantic-retrieval
condition as future work in Section 6.
4
