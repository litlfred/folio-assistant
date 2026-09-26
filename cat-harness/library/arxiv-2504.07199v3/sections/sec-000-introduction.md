---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
Subject classification within library systems in-
volves organizing books and resources based on
their content and subject matter to facilitate easy re-
trieval and access. Automated methods for classify-
ing scientific texts include Springer Nature’s CSO
classifier (Salatino et al., 2019), which uses syn-
tactic and semantic analysis to categorize papers
based on the Computer Science Ontology (CSO)
using abstracts, titles, and keywords. Other ap-
proaches have utilized citation metadata for classifi-
cation (Mahdi and Joorabchi, 2011), while research
like New Mexico State University’s application of
topic modeling on digital news releases (Glowacka-
Musial, 2022) demonstrates the diversity of tech-
niques. Methods range from embeddings (Buscaldi
et al., 2017; Rˇužiˇcka and Sojka, 2021) and deep
learning (Ahanger and Wani, 2022) to citation anal-
ysis (Small et al., 2014) and topic modeling (Bolelli
et al., 2009; Griffiths and Steyvers, 2004). Thus,
while the use of NLP in digital library subject clas-
sification is well-established (Gooding et al., 2019),
the potential for leveraging Large Language Mod-
els (LLMs) for their extensive knowledge represen-
tation remains largely unexplored.
Several open-source toolkits integrate machine
learning (ML) and NLP for automated subject in-
dexing, notably ANNIF (https://annif.org/),
developed by the National Library of Finland, as
a DIY automated subject indexing tool supporting
the training of multiple traditional machine learn-
ing algorithms (Suominen, 2019). ANNIF allows
users to train models on a chosen subject taxonomy
and metadata to generate subject headings for new
documents. It has performed well on scientific pa-
pers and books but struggles with older or diverse
materials like Q&A pairs or Finnish Wikipedia. Eu-
ropean national libraries, including Sweden’s Na-
tional Library, the Leibniz Information Centre for
Economics, and the German National Library, have
adopted ANNIF. Supporting multiple languages
and vocabularies, it offers command-line, web, and
REST API interfaces, demonstrating the adaptabil-
ity required for effective subject classification.
With these insights, as a SemEval 2025 shared
task, we organized Task 5 — LLMs4Subjects — to
explore the untapped potential of LLMs for subject
classification and tagging. The task was defined on
the catalog of the TIB – Leibniz Information Centre
for Science and Technology, Germany’s national
library for science and technology. Its catalog,
TIBKAT, holds 5.7 million records (as of March
2025), including bibliographic data and metadata
from freely available electronic collections. A sub-
set of around 100,000 records is available as open
access, and the task focused on this subset. The
collection includes various record types such as
technical reports, publications, and books, primar-
ily in English and German. Regardless of full-text
language, records are consistently annotated us-
ing subject terms from the Gemeinsame Normdatei
(GND), the integrated authority file and subject tax-
onomy used in the German library system. LLMs
offer promising opportunities for subject classifi-
cation through their ability to process natural lan-
guage at scale and capture the nuances of complex,
interdisciplinary topics. This can significantly im-
prove the accuracy and efficiency of organizing
1
arXiv:2504.07199v3  [cs.CL]  23 May 2025
large collections, enhancing the accessibility and
discoverability of information. The solutions devel-
oped in this task serve as a benchmark for applying
LLMs in digital library systems, fostering innova-
tion and setting new standards in the field. More-
over, the task aligns with the goals of the SemEval
series by evaluating a novel application of computa-
tional semantics essential for effective information
organization and retrieval.
While the shared task focused on practical sys-
tems development, it was also driven by the follow-
ing four research questions. RQ1 Multilingual vs.
Monolingual Models in Subject Tagging: How do
multilingual pre-trained models compare to mono-
lingual models in bilingual subject tagging tasks?,
RQ2 Effect of Training Data Size and Diversity:
How does the size and diversity of training data
affect LLM performance in subject tagging?, RQ3
Role of Augmented Generation: How impactful
are RAG approaches versus finetuning?, and RQ4
Efficiency of Language Models: How effective are
small versus large LMs in performing the task?
A key observation from the systems submitted
to this shared task is that the advantages of LLMs
over traditional machine learning algorithms for
subject indexing remain debatable (Kluge and Käh-
ler, 2024). While the first iteration of this shared
task brings this question to light, to further explore
the possibilities offered by LLMs, we will reorga-
nize the LLMs4Subjects shared task a second time
and this time with a theme to build solutions based
on energy- and compute-efficient LLMs.
2
