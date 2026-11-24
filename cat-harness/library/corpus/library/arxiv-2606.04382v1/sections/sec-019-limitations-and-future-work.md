---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-019-limitations-and-future-work
section_title: "Limitations and future work"
section_number: null
pages: 11-11
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
Consensus is record-level, not heading-level. A book
qualifies on agency-independent agreement, but the
default merged key still includes single-source head-
ings; we release the unanimous view for studies that
need heading-level agreement, and report which view
a result uses.
The neural leaderboard is on a 2K subset. The small-
est languages (Hindi, with a handful of evaluation
records, Turkish, Hebrew) are individually noisy and
should be read as indicative; the held-out test set
(3,353 records) is the basis for the eventual full-scale
evaluation. Scaling the neural runs to full develop-
ment is planned.
The fine-tune result is preliminary, and we frame it
as such. It is reported on the development evalua-
tion subset, not the held-out test set, and at first
stage only — we have not run cross-encoder rerank,
LLM rerank, and selection on top of the fine-tuned
retriever’s pool, nor fine-tuned for the full Task-A
generation objective, nor confirmed the result on the
held-out test.
The fine-tune is also trained on the
benchmark’s own development population; we guard
this with the leakage protocol of Section 3.11.1 (train-
ing records disjoint from the evaluation subset by
identifier and by a title–author key, with residual
overlap at the held-out test’s incidental-collision rate
of ~0.1%), and an earlier full-development variant
overlapping the evaluation subset inflated recall@200
by only ~+0.03 — but the clean, held-out-test con-
firmation is the one that would make this a settled
result, and it remains future work. The benchmark
contribution does not depend on it.
Contamination control is a convenience, not a guar-
antee. As Section 3.9 states, hashed answers over a
finite public vocabulary are dictionary-attackable; a
private evaluation server is future work.
Vocabulary and cataloging-practice cutoff.
LCSH-
Bench v1.0 is fixed to a mid-2026 snapshot of the
LCSH and LCGFT vocabularies and to the cata-
loging conventions then in force; both evolve. The
Library of Congress’s 2026 revisions to free-floating
form subdivisions (the $v subfield) and the ongo-
ing migration of genre/form terms into LCGFT will,
over time, change the exact subdivided strings the
benchmark scores — affecting expression-level (exact)
match more than concept-level (root) match, which
is one further reason we report both.
The bench-
mark is versioned and dated so results stay compara-
ble within a version, and refreshed vocabulary snap-
shots can ship as point updates. Subject-cataloging
methods are likewise moving quickly — for example
agentic LLM pipelines for LCSH assignment (Chow
2026) — which a standing, versioned benchmark is
meant to track rather than pre-empt.
Deferred components. The qualitative expert track,
an
open-vocabulary
LLM-generation
sweep,
the
rerank/selection layers on the full subset, and a pri-
vate evaluation server are all future work.
7
