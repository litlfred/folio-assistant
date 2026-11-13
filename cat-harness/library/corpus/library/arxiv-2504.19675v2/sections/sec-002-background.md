---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-002-background
section_title: "Background"
section_number: null
pages: 1-2
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
The task involved developing LLM-based systems
that recommend the most relevant subjects from the
GND subject vocabulary to tag a given TIBKAT
record based on its title and abstract, which is a type
of extreme multilabel text classification (XMTC)
problem. The organisers provided two variants
of the GND subject vocabulary: all-subjects (all
200,035 GND subjects) and tib-core-subjects (a
1https://annif.org
2https://github.com/NatLibFi/
Annif-LLMs4Subjects/
3https://huggingface.co/NatLibFi/
Annif-LLMs4Subjects-data
arXiv:2504.19675v2  [cs.CL]  21 Aug 2025
subset of 78,741 subjects especially important for
TIB). We used the SKOS versions of GND pro-
vided by the German National Library (DNB).
The organisers also provided bibliographic
records from the TIBKAT database as two data
sets, corresponding to the two GND variants, each
of them divided into train, development, and test
subsets. The number of records was 81937 / 13666
/ 27986 for the all-subjects data set and 41923 /
7001 / 6119 for the tib-core-subjects data set. All
these subsets were further split by document type
(e.g. Article or Book) and language (German or
English). We did not distinguish records by these
two aspects4. Known GND subjects were included
only for the train and development records.
Although the task description suggested using
LLMs, we did not use one for the core task of
choosing subjects but instead relied on the tradi-
tional XMTC algorithms in Annif. However, we
used LLMs to pre-process the data sets and to gen-
erate additional synthetic training data.
3
