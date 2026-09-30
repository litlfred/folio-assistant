---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
When a research library acquires a book, a profes-
sional cataloger reads it and attaches a small set
of standardised labels describing what it is about.
For English-language cataloging worldwide these la-
bels are drawn from the Library of Congress Subject
Headings (LCSH) (Library of Congress, n.d.), a con-
trolled vocabulary of roughly half a million autho-
rised headings, many further refined by subdivisions
(e.g. Sociology--Research). Subject access of this kind
is what lets a reader find everything a collection holds
on a topic, independent of the words an author chose.
Assigning it well is slow, expert work, and there is sus-
tained interest in whether software — increasingly,
large language models — can assist.
That interest is not matched by a way to mea-
sure it.
Unlike the German GND (through the
LLMs4Subjects shared task (D’Souza et al. 2025)),
the biomedical MeSH vocabulary (through BioASQ
(Tsatsaronis et al. 2015)), or EU EuroVoc (through
MultiEURLEX (Chalkidis et al. 2021)), LCSH has
no standard, public, versioned benchmark. Research
groups evaluate on private collections with private
notions of correctness, so their numbers cannot be
compared, and progress cannot be tracked.
We close that gap with LCSHBench v1.0. Our con-
tributions are:
1. A
consensus-grounded,
multilingual
dataset
(22,346 books, 15 languages) admitted on agree-
ment among independent professional catalogers
across three openly licensed research-library cat-
alogs. Admission is record-level (≥2 independent
agencies); the default scoring key is the union of
their headings (generous, and therefore includ-
ing single-source headings — about 46% of dev
assertions), with strict unanimous and raw per-
catalog views also released so a study can choose
its own bar.
2. An empirical justification for consensus.
On
1
arXiv:2606.04382v1  [cs.DL]  3 Jun 2026
465,187 works cataloged by all three libraries, we
quantify inter-cataloger agreement and show it
has an objective concept-level core and a sub-
jective expression-level surface described in Sec-
tion 3.3, directly motivating both the consensus
target and the exact-versus-concept metric dis-
tinction.
3. Two precisely specified tasks — open-vocabulary
generation, and a retrieval pipeline evaluated
over the full vocabulary rather than a frozen can-
didate pool — with a public scorer and submis-
sion format.
4. A metric panel, not a headline F1 — set and rank
metrics under exact and concept match, sliced by
language and heading type — together with the
empirical demonstration that the panel is neces-
sary: the ranking of systems flips depending on
which metric and which language one examines.
5. A demonstration that the benchmark is action-
able.
The panel localizes cross-lingual align-
ment as the first-stage retrieval bottleneck; a
sub-dollar low-rank fine-tune of a 300M on-
device embedder — trained on records held
strictly disjoint from the evaluation subset —
then out-retrieves a hosted commercial embed-
der of much larger dimension on first-stage
development-subset recall, with the panel reveal-
ing the gain is specifically cross-lingual. We offer
this as evidence the exam guides improvement,
not as a final result: held-out-test and end-to-
end evaluation are future work.
The dataset, scorer, baselines, random seeds, and
cleaning rules are released together, so any reported
result reproduces exactly.
2
