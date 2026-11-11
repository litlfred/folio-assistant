---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-004-the-two-tasks
section_title: "The two tasks"
section_number: null
pages: 3-4
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
A system takes a book’s bibliographic fields and pro-
poses subject headings. We score two tasks that iso-
late different abilities.
Task A — Generation (open vocabulary). Given only
3
the bibliographic fields, the system must produce the
correct headings from the entire vocabulary, with no
hints. This is the realistic, end-to-end task a human
cataloger performs. Output is an unordered set of
headings.
Task B — Retrieval pipeline (retrieve →rerank →se-
lect). Many practical systems work in stages: a fast
first stage retrieves a rough shortlist from the vocabu-
lary, and later stages re-examine it. The benchmark
evaluates this pipeline over the full released vocab-
ulary of ~515K LCSH and LCGFT labels, layer by
layer, so each stage’s contribution is visible:
• L1 — Retrieval. The system embeds the record
and retrieves the top-𝑘headings from the full
vocabulary. Recall@𝑘at L1 is the ceiling for ev-
erything downstream.
• L2 — Cross-encoder rerank and L3 — LLM
rerank reorder L1’s top-𝑁.
• L4 — Selection produces the final assigned set,
scored like Task A.
This supersedes a frozen candidate-pool design. Re-
leasing one fixed per-record pool would bake in an ar-
bitrary retriever’s choices and make L1 — the embed-
ding model, the component most worth measuring —
invisible.
Instead we release the whole vocabulary;
each embedding model retrieves from it directly, and
L2–L4 are reported over a fixed reference retriever
with recall ceilings stated explicitly.
3.2
