---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-015-82-generalisability
section_title: "Generalisability"
section_number: 8.2
pages: 19-20
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Generalisability
In the past decade, we have witnessed a growing data production involving different forms of data, including raw
documents. However, building domain-specific corpora with manually annotated terms from the available raw texts
is often error-prone, labor-intensive, time-consuming, and subjective35. As a consequence, annotated datasets, on
which the models can be trained, are often scarce, limited, and usually do not cover many languages and domains.
Therefore, it is necessary for the model to have the ability to adapt and extract terms from new languages and domains,
which were not present in its training dataset. For this reason, one of the future challenges is to build models that will
be able to transfer the knowledge between different domains and languages efficiently and to extract language- and
35Subjectiveness emerges due to two major reasons: the low agreement among the annotators and the lack of consensus about an annotation protocol.
19
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
domain-specific terminology even either without the language- or domain-specific training corpus, or with only a few
available training examples.
With the recent advances in language models and the huge demand for real-world applications, we expect ATE to
receive more attention from researchers in the future. Based on the comparative studies in this survey, we list some
proposals for further directions that the research on term extraction could take.
