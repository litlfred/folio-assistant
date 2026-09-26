---
doc_id: arxiv-2504.21474v1
doc_title: "Homa at SemEval-2025 Task 5: Aligning Librarian Records with OntoAligner for Subject Tagging"
section_id: sec-004-ontoaligner-pipeline
section_title: "OntoAligner Pipeline"
section_number: null
pages: 2-3
source_pdf: 2504.21474v1.pdf
source_sha256: 68a09fcd43927e7a
toc_source: outline
---
3.1
OntoAligner Pipeline
1) Data Representation. To align the technical
records with the target subjects, we explore multi-
ple levels of information from the records for rep-
resentation of input data: 1) Title-based Represen-
tation: We start by using the titles of the technical
records, capturing the most concise representation
of the content. 2) Contextual Representation: We
enhance the alignment by incorporating additional
metadata, such as abstracts and descriptions, pro-
viding deeper context for each record. 3) Hierarchi-
cal Representation: For records with hierarchical
relationships, we include parent-level metadata, en-
riching the alignment by reflecting the structural
relationships within the ontology. These varied
representations ensure that both the content and
the structural relationships within the records are
leveraged to accurately map to relevant subjects.
2) Retrieval Module of OntoAligner. We employ
Nomic-AI embedding models (Nussbaum et al.,
2024) to generate dense embeddings of the techni-
cal records and their corresponding subjects. These
embeddings are used to retrieve the top-k most rel-
evant subjects for each record by computing cosine
similarity between the record’s embedding and the
embeddings of potential subjects. We configure
the top-k to 30 subject tags.
3) LLM Module of OntoAligner. The LLM mod-
ule in OntoAligner leverages advanced language
models to enhance the alignment process. This
module utilizes Qwen2.5-0.5B (Yang et al., 2024)
to interpret and align complex ontological concepts
effectively. By integrating LLMs, OntoAligner can
process natural language descriptions and context,
facilitating more accurate alignments. After retriev-
ing the top-k relevant candidates for indexing a
Sentence 1
Sentence 2
Score
Springer eBook Collection
Thermodiffusion
1
Springer eBook Collection
Zeitauflösung
0
ACM Digital Library
Software Engineering
1
ACM Digital Library
Laser
0
Table 1: Examples from the retriever model fine-tuning
dataset. Sentence 1 column represents the title of the
librarian record, while Sentence 2 column corresponds
to the assigned subject. Score column indicates whether
the title and subject are a match (1) or not (0).
given librarian record, the LLM evaluates whether
each subject is a suitable match or not. This ap-
proach follows a RAG paradigm, seamlessly inte-
grating ontology matching within OntoAligner.
3.2
Fine-Tuning
Within prior experimentation on three types of in-
put representation – title, contextual, and Hierarchi-
cal – using the development set and computational
resource on hand, we preferred to move forward
with title-based input representation. In the follow-
ing, we will discuss the details for retriever and
LLM model finetunings.
Contrastive Learning for Retrieval Model. To
fine-tune the retriever module, we constructed a
Semantic Textual Similarity (STS) (Majumder
et al., 2016; Giglou et al., 2023) dataset.
The
records were then paired with their ground truth
subjects, assigning a similarity score of 1 for
correct pairs. To introduce contrastive learning,
we randomly selected negative samples—subjects
not associated with the record—and assigned
them a similarity score of 0.
This resulted in
a balanced dataset with 32,952 sentence pairs,
ensuring the retriever learns to distinguish relevant
subjects from irrelevant ones based on textual
similarity.
The limit of 600 pairs applied per
record from the training set. This threshold is
applied to reduce the number of training sets for
the retriever module due to the computational
resource limitation.
The Table 1 represents
examples of the obtained datasets for positive
and negative pairs.
We fine-tuned a sentence-
transformer
model
(Reimers
and
Gurevych,
2019) (specifically https://huggingface.co/
nomic-ai/nomic-embed-text-v1)
using
the
Multiple Negatives Ranking Loss (Henderson
et al., 2017). The model is fine-tuned for 3 epochs
with a batch size of 32. The training process lever-
aged contrastive learning to distinguish between
relevant and irrelevant subject pairs, optimizing
Dataset
Avg Prec.
Avg Rec.
Avg F1
