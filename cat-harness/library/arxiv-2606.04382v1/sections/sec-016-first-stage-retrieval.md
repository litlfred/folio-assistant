---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-016-first-stage-retrieval
section_title: "First-stage retrieval"
section_number: null
pages: 9-9
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
Table 2 reports first-stage retrieval over the full vo-
cabulary on the reachable-GT subset.
Two find-
ings stand out.
First, among the off-the-shelf sys-
tems the hosted embedders out-retrieve the stock
on-device model at every depth, and dimension
helps:
text-embedding-3-large (3,072-d) leads
text-embedding-3-small (1,536-d), which leads the
stock 256-d on-device model. On its own this would
read as the expected “bigger hosted API beats the
small local model” story.
Second, that ordering reverses under fine-tuning
— on this development subset.
The fine-tuned
300M on-device embedder described in Section 3.11.1
reaches exact recall@200 0.659, ahead of the 3,072-
dimensional text-embedding-3-large (0.623) and
well ahead of
text-embedding-3-small (0.511);
the lead is small but significant under a paired
approximate-randomisation test (Δ@200 +0.036, p =
0.0004; 95% CIs [0.637, 0.679] vs [0.601, 0.643]). We
report it as a development-subset, first-stage result
pending held-out-test confirmation (see Section 6).
Against its own stock backbone at the identical 256-
dimensional deployment, the fine-tune lifts exact re-
call@200 from 0.407 to 0.659 (+62%), isolating the
gain to the weights. A 300M model running entirely
on-device thus out-retrieves a hosted commercial em-
bedder of twelve times its dimension, after a fine-tune
costing well under a dollar.
The win, however, is not uniform — and reading it
correctly requires the panel in Section 4.3. It is con-
centrated exactly where the fine-tune was meant to
help: cross-lingual records.
4.2
Generation and selection
Open-vocabulary generation and final-cut selection
are scored as sets (Task A). The general-purpose
LLM reaches the best set scores of any system —
generation F1 (exact) 0.161 and (concept) 0.384; se-
lection over a retrieved pool 0.118 and 0.318 — with
a large exact-versus-concept gap that recurs across
every system, the signature of the granularity-not-
topic disagreement quantified in Section 3.3. These
are a different task from first-stage retrieval (a short
final set rather than a 200-deep ranking) and are not
directly comparable to Table 2; we report them to
anchor the open-vocabulary end of the panel.
4.3
