---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-014-fine-tuning-the-on-device-embedder
section_title: "Fine-tuning the on-device embedder"
section_number: null
pages: 8-9
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
The L1 results below show the stock on-device embed-
der trailing the hosted APIs, and the per-language
panel localizes why: the gap is largest where a multi-
lingual record must be matched to an English head-
ing. We treat that as a hypothesis — that the bottle-
neck is cross-lingual alignment, not model capacity —
and address it directly by fine-tuning the 300M model
to map a record to its English headings.
The recipe is cheap and fully reproducible.
We
build (record, heading) training pairs by taking, for
each development record outside the evaluation sub-
set, its merged-consensus LCSH headings reachable
in the released vocabulary; the record side is the
same title/vernacular/author/abstract text the re-
triever sees at inference.
We adapt the backbone
with a rank-16 LoRA adapter (Hu et al. 2022) un-
der a multiple-negatives ranking objective (Hender-
son et al. 2017), wrapped in a Matryoshka loss (Kusu-
pati et al. 2022) over {768, 512, 256, 128} so the 256-
dimensional truncation the on-device index uses stays
sharp. Training is one epoch on a single commodity
cloud GPU (about fifteen minutes, well under one US
dollar); the adapter is merged into the backbone and
exported to the same on-device ONNX runtime as the
stock model, so the comparison holds the deployment
fixed and varies only the weights.
Leakage control.
Because the fine-tune is trained
on the benchmark’s own corpus, contamination is
the central threat to validity.
Training pairs are
drawn only from development records disjoint from
the evaluation subset, excluded both by record iden-
tifier and by a (title, first-author) key; an audit con-
firms the residual title-and-author overlap between
training and evaluation matches the incidental colli-
sion rate of the held-out test set.
We report only
this leak-free configuration.
All paid calls are me-
tered against a $25-capped, fully cached ledger; the
total spend for the leaderboard reported here was a
few dollars, and the on-device system runs at zero
8
marginal cost.
4
