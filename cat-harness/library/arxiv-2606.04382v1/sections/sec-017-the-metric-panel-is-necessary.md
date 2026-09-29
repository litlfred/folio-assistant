---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-017-the-metric-panel-is-necessary
section_title: "The metric panel is necessary"
section_number: null
pages: 9-10
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
The fine-tune’s aggregate lead (Table 2) invites a one-
line summary — “the on-device model now wins.”
The panel shows that summary is wrong in two in-
structive ways.
The
ranking
flips
by
metric.
The
fine-tune
leads on exact recall@200 (0.659 vs 0.623) but
text-embedding-3-large
leads
on
concept
re-
call@200 (0.762 vs 0.732, paired p = 0.0001). Which
model is “best” therefore depends entirely on whether
one scores the exact subdivided heading or the under-
lying concept — the same exact-versus-concept axis
that the concordance analysis in Section 3.3 shows
is where catalogers themselves disagree. A paper re-
porting a single match mode would award the title to
whichever it happened to choose.
The ranking flips by language. The fine-tune’s win is
specifically cross-lingual (Table 3). It dominates on
the languages where matching non-English content
to English headings is hardest — Korean (0.668 vs
the hosted 0.517), Arabic (0.689 vs 0.540), Japanese
(0.593 vs 0.537), Chinese (0.618 vs 0.600), German
(0.704 vs 0.651) — confirming that cross-lingual align-
ment, not capacity, was the bottleneck. But on En-
glish (0.696 vs 0.710) and Russian (0.505 vs 0.543)
the hosted text-embedding-3-large still leads. The
aggregate “on-device wins” conceals that the hosted
model remains the better English retriever; the on-
device model wins by closing the cross-lingual gap.
This is the benchmark’s motivating result: the panel,
not any single number, reads the outcome correctly
— and it is the same per-language breakdown that lo-
cated the cross-lingual bottleneck the fine-tune then
fixed.
9
Table 2: First-stage retrieval, dev-2K, exact reachable GT, macro-averaged over the n = 1,483 records with
≥1 exact-reachable gold heading. All systems retrieve from the full ~515K-label vocabulary; the on-device
rows use the deployed 256-d index.
System (L1)
recall@10
recall@50
recall@200
MRR
EmbeddingGemma-300M, fine-tuned (this work)
0.334
0.512
0.659
0.288
text-embedding-3-large (hosted, 3072-d)
0.297
0.480
0.623
0.258
text-embedding-3-small (hosted, 1536-d)
0.232
0.377
0.511
0.190
EmbeddingGemma-300M, stock (256-d)
0.166
0.283
0.407
0.143
Frequency floor
0.035
0.069
0.130
0.035
Table 3: Per-language exact recall@200, dev-2K. The fine-tune’s lead is cross-lingual; the 3,072-d hosted
model retains English and Russian.
Language (𝑛)
freq
stock
te3-large
FT
English (393)
0.087
0.477
0.710
0.696
German (132)
0.111
0.447
0.651
0.704
Russian (112)
0.119
0.260
0.543
0.505
Chinese (114)
0.169
0.346
0.600
0.618
Japanese (99)
0.218
0.313
0.537
0.593
Korean (79)
0.141
0.322
0.517
0.668
Arabic (95)
0.189
0.314
0.540
0.689
5
