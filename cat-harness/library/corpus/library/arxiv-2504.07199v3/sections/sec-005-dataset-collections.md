---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-005-dataset-collections
section_title: "Dataset Collections"
section_number: null
pages: 3-3
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
4.1
Dataset Collections
all-subjects.5
This dataset comprises the full
TIBKAT open-source collection, with predefined
splits: 81,937 records for training and 13,666 for
development. A detailed dataset overview is avail-
5https://github.com/jd-coderepos/
llms4subjects/tree/main/shared-task-datasets/
TIBKAT/all-subjects
able in the shared task repository. Participants also
received the accompanying GND subject taxon-
omy,6 which included 204,739 subjects, with cover-
age and distribution frequencies published online.
Due to the large dataset size (>100,000 records),
participants could opt for a smaller subset focused
on TIB’s core subject classification.
tib-core.7 This subset includes only records an-
notated with at least one GND subject from the
so-called TIB core domains. It contains 41,902
training and 6,980 development records across 14
domains: Architecture (arc), Civil Engineering
(bau), Mining (ber), Chemistry (che), Chemical
Engineering (cet), Electrical Engineering (elt), Ma-
terials Science (fer), Information Technology (inf),
Mathematics (mat), Mechanical Engineering (mas),
Medical Technology (med), Physics (phy), Engi-
neering (tec), and Traffic Engineering (ver). A
refined GND subject taxonomy8 with 79,427 sub-
jects accompanied this dataset, along with subject
coverage and frequency distributions.
Participants could choose between the all-
subjects dataset for comprehensive indexing, the
tib-core dataset for a more focused classification
task, or even attempt both.
4.2
