---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-002-automated-subject-indexing
section_title: "Automated subject indexing"
section_number: null
pages: 3-3
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
Automated subject indexing has a long applied his-
tory, surveyed comprehensively by Golub (Golub
2021). The dominant open toolkit is Annif (Suomi-
nen 2019), which combines string-matching and su-
pervised extreme-multi-label learning and underpins
production services at several national libraries; re-
cent work adapts transformer-based extreme-multi-
label classifiers to subject indexing (Bertalis et al.
2024). These systems are typically trained and evalu-
ated against a single institution’s headings, which —
given the consistency results above — conflates gen-
uine error with legitimate cataloger-to-cataloger vari-
ation. A consensus answer key is, in part, a response
to that measurement problem.
2.4
Large language models for subject
cataloging
The newest strand applies LLMs directly. Most rel-
evant, Chow, Kao, and Li (Chow et al. 2024) use
ChatGPT to generate LCSH for electronic theses and
dissertations from titles and abstracts, in this paper’s
target venue, concluding that LLMs can reduce cata-
loging time but that human catalogers remain essen-
tial for validity, exhaustivity, and specificity.
The
German National Library’s DNB-AI system (Kluge
and Kähler 2025) reaches this verdict quantitatively
and qualitatively at once: in SemEval-2025 it ranked
fourth by F1 but first in expert rating — the single
most important prior result for our design, because it
shows numeric and expert rankings diverge. Chow’s
more recent skill-based agentic pipeline decomposes
LCSH assignment into conceptual analysis, quan-
titative filtering, authority validation, and MARC
field synthesis, making explicit the domain procedure
knowledge that subject-indexing systems must opera-
tionalize (Chow 2026). Hybrid embedding-plus-LLM
pipelines are also emerging (Liu et al. 2025). Crit-
ically, each such study uses its own private collec-
tion and its own definition of “correct,” so the results
cannot be compared — precisely the gap a standard
benchmark closes.
2.5
Benchmarks in adjacent vocabu-
laries
No LCSH-specific benchmark exists; the closest are
in adjacent vocabularies. LLMs4Subjects / SemEval-
2025 Task 5 (D’Souza et al.
2025) is the nearest
template — automated subject tagging for a Ger-
man national technical library over the GND taxon-
omy, with bilingual records and a two-track (quanti-
tative + subject-expert) evaluation, later released as
an XMTC dataset (D’Souza et al. 2026); we adopt
its two-track ambition and all-subjects-vs-core split
and extend it from bilingual to broadly multilingual.
BioASQ (Tsatsaronis et al. 2015) is the gold stan-
dard for longevity — an annual, versioned biomedical-
indexing challenge over MeSH with a held-out evalua-
tion server; we borrow its versioning discipline, while
noting MeSH is smaller and more regular than LCSH
and lacks free-floating subdivisions. MultiEURLEX
(Chalkidis et al. 2021) and the broader XMTC lit-
erature establish the metric conventions we adopt
— P@k, R-Precision, and the long-tail-label problem
LCSH’s ~515K labels share — and comparative stud-
ies (Galke et al. 2022) show F1 alone misleads and
must be complemented with rank-aware measures, di-
rectly motivating our panel.
What LCSH adds. None of these vocabularies com-
bines (i) free-floating subdivision construction —
valid headings assembled on the fly rather than stored
as records, the very feature FAST (Chan and O’Neill
2010) simplifies away; (ii) mixed subject-access types
in one record — topical, geographic, name, and
genre/form; and (iii) a cross-lingual, English-target
setting, where content in any language must map
to English headings. These are the distinctive chal-
lenges the benchmark is built to measure.
3
