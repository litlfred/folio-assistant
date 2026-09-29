---
doc_id: arxiv-2504.21474v1
doc_title: "Homa at SemEval-2025 Task 5: Aligning Librarian Records with OntoAligner for Subject Tagging"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: 2504.21474v1.pdf
source_sha256: 68a09fcd43927e7a
toc_source: outline
---
Libraries are the heart of every society and a cor-
nerstone of education, serving as repositories of
human knowledge and cultural heritage. As infor-
mation landscapes evolve, these institutions must
adapt to the growing volume and complexity of
digital resources. Therefore, technological innova-
tion in both traditional libraries and modern digital
library systems is essential to optimize workflows,
enhance accessibility, and improve resource orga-
nization. With the rapid advancement of artificial
intelligence (AI), particularly through Large Lan-
guage Models (LLMs) (Chang et al., 2024), there
is an increasing need to integrate these technolo-
gies into library systems (Cox and Tzoc, 2023).
LLMs offer capabilities in natural language un-
derstanding (NLU), knowledge retrieval, and auto-
mated categorization, making them valuable tools
for subject tagging, metadata enrichment, and se-
mantic search (Kasneci et al., 2023). By leveraging
LLMs, libraries can enhance cataloging efficiency,
improve interoperability with controlled vocabu-
laries such as the Gemeinsame Normdatei (GND)
(German National Library, 2025) librarian collec-
tions, and enable more precise and context-aware
information retrieval.
Despite these advantages, integrating AI-driven
solutions into library workflows presents chal-
lenges, including model interpretability, bias in
automated tagging, and multilingual processing.
Addressing these issues requires developing robust
frameworks that balance AI-powered automation
with human oversight. LLMs4Subjects (D’Souza
et al., 2025a) is the first shared task of its kind
organized within SemEval-2025, challenging the
research community to develop cutting-edge LLM-
based solutions for subject tagging of technical
records from Leibniz University’s Technical Li-
brary (TIBKAT). The participants are tasked with
leveraging LLMs to tag technical records using the
GND taxonomy. The bilingual nature of the task
is designed to address the needs of library systems
that often involve multi-lingual records. Given
these motivations, the LLMs4Subjects shared task
consist of the following two tasks: Task 1 – Learn-
ing the GND Taxonomy – Incorporating the GND
subjects taxonomy, used by Technische Informa-
tionsbibliothek (TIB) experts for indexing, into
LLMs for subject tagging to enable LLMs to un-
derstand and utilize the taxonomy for subject clas-
sification effectively. Task 2 – Aligning Subject
Tagging to TIBKAT – Given a librarian record,
a developed system should recommend GND sub-
jects based on semantic relationships in titles and
abstracts.
Ontologies are a key building block for many
applications in the semantic web. Hence, ontology
alignment, the process of identifying correspon-
dences between entities in different ontologies, is a
arXiv:2504.21474v1  [cs.CL]  30 Apr 2025
critical task in knowledge engineering. To this end,
OntoAligner (Babaei Giglou et al., 2025; Giglou
et al., 2025a) is a comprehensive modular and ro-
bust Python toolkit for ontology alignment built to
make ontology alignment easy to use for everyone.
Inspired by this vision, we adapted its technique for
