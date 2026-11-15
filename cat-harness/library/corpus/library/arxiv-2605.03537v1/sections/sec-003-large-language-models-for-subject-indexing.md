---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-003-large-language-models-for-subject-indexing
section_title: "Large Language Models for Subject Indexing"
section_number: null
pages: 2-2
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
The emergence of generative AI has prompted a distinct line of
investigation. Brzustowicz (2023) conducted early experiments
testing ChatGPT’s ability to generate complete MARC records.
The results showed that ChatGPT could produce records com-
parable to those created by professional catalogers for basic
metadata fields (title, author, publisher), and could even gener-
ate original records for items without existing WorldCat entries.
However, notable discrepancies emerged in the assignment of
subject access points, suggesting that while LLMs internalize
general cataloging patterns from their training data, they lack
the systematic application of LCSH policy rules required for
reliable subject heading construction.
Chow et al. (2024) conducted a more focused experiment,
using ChatGPT to assign LCSH to 30 electronic theses and
dissertations (ETDs). The results were sobering: only approxi-
mately half of the AI-generated headings were both valid LCSH
terms and sufficiently specific. The model frequently struggled
with complex multi-part headings and subdivisions, producing
terms that were not authorized LCSH entries—including single-
word or colloquial topic descriptions. Nonetheless, the authors
noted that the cost was only about $0.25 and three minutes
of processing time for all 30 documents, and that “refining an
existing (even if imperfect) AI suggestion is less daunting than
constructing new subject headings from scratch” (Chow et al.,
2024, p. 582). This framing of AI as a first-draft assistant rather
than a replacement for human judgment recurs throughout the
literature.
Tang & Jiang (2025) synthesized findings across multiple
studies and reported overall poor performance for AI chatbots
on LCSH assignment, with precision or F1 scores far below
professional cataloging levels—one evaluation found only 26–
35% alignment between AI-generated and human-assigned
LCSH. Their proposed solution is a hybrid architecture com-
bining AI-generated candidate terms with automated validation
through the Library of Congress Linked Data Service, using
Model Context Protocol (MCP) integration to verify headings
against authority files in real time. This approach shares concep-
tual ground with the present study’s authority validation skill,
though Tang and Jiang’s system validates at a single step rather
than decomposing the full cataloging workflow into multiple
stages.
The most comprehensive empirical evaluation to date is the
SemEval-2025 LLMs4Subjects shared task (D’Souza et al.,
2025), the first community benchmark specifically designed
to test LLM-based subject indexing. The task challenged 14
teams to assign subjects from the German Integrated Authority
File (GND)—a taxonomy of over 200,000 controlled terms—to
bilingual (English/German) bibliographic records from TIB’s
open-access catalog. Systems were evaluated both quantita-
tively (precision, recall, F1 at multiple cutoffs) and qualitatively
by 17 subject specialists across 28 disciplines. Participating
teams deployed a range of LLM-based strategies, including
retrieval-augmented generation (RAG), knowledge distillation
from GND hierarchies, and multi-stage pipelines with LLM-
driven re-ranking. Yet the top-performing system in the all-
subjects category was Annif (Suominen et al., 2025)—a tra-
ditional XMTC ensemble that used LLMs only for auxiliary
preprocessing (translation and synthetic data generation), not
for the core subject prediction task. A key conclusion of the
shared task was that “the advantages of LLMs over traditional
machine learning algorithms for subject indexing remain debat-
able” (D’Souza et al., 2025, p. 2), with smaller, well-engineered
systems often rivaling large instruction-tuned LLMs. This re-
sult reinforces the pattern observed in the single-prompt studies:
LLMs can identify topically relevant terms, but translating that
capability into accurate, authority-controlled subject assign-
ments remains an open challenge.
1.1.3
