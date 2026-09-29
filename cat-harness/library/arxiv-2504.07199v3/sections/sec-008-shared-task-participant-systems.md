---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-008-shared-task-participant-systems
section_title: "Shared Task Participant Systems"
section_number: null
pages: 4-8
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
The participant systems are described with a focus
on their key methodological contributions. Teams
are listed in alphabetical order of their names. An
overview of the systems is provided in Table 2.
1. Annif (Suominen et al., 2025) The key ideas
in this system’s subject tagging approach were:
1) Traditional extreme multi-label text clas-
sification (XMTC) implemented in the Annif
toolkit (2022) – Using Omikuji Bonsai (Khanda-
gale et al., 2020), a tree-based machine learning
approach; MLLM (Maui-like (Medelyan, 2009)
Lexical Matching), a lexical matching algorithm;
and XTransformer, a transformer-based classifica-
tion model (Yu et al., 2022) for XMTC. 2) En-
semble Models – Combining individual classifiers
into simple averaging and neural ensembles to im-
prove predictions. 3) LLM-Assisted Translation
– Using the Llama-3.1-8B-Instruct LLM (2024) to
translate bibliographic records and subject vocabu-
laries into English and German. 4) Synthetic Data
Generation – Expanding training data with the
same LLM by generating new records with modi-
fied subject labels. And 5) Multilingual Merging
– Combining monolingual predictions to form a
multilingual ensemble, improving overall perfor-
mance.
2.
DNB-AI-Project (Kluge and Kähler, 2025)
This was an LLM-driven ensemble approach which
achieved top qualitative scores without fine-tuning
and few-shot prompting. Key steps included: 1)
LLM Ensemble for Keyword Generation – Mul-
tiple off-the-shelf LLMs use few-shot prompting
with 8-12 examples to improve recall and preci-
sion. 2) Map – A BGE-M3 embedding model
9https://sites.google.com/view/llms4subjects/
(Chen et al., 2024) maps LLM-generated free key-
words to controlled GND subject terms via nearest
neighbor search. 3) Summarize – Predictions from
the LLM ensemble are aggregated, with similarity
scores summed and normalized into a confidence-
based score. 4) Rank – A new LLM, Llama-3.1-
8B-Instruct (2024) assesses relevance of each pre-
dicted term on a 0-10 scale, refining rankings be-
yond frequency-based measures. And 5) Combine
– Ensemble and relevance scores are weighted and
combined to optimize subject ranking.
3. DUTIR831 (Tian et al., 2025b) The key steps
of this system are: 1) Data Synthesis and Filter-
ing – The Qwen2.5-72B-Instruct LLM is used to
generate synthetic data to expand training sets by
selecting related subject terms and creating titles
and abstracts. The LLM is then applied to filter
low-quality samples based on coherence and rel-
evance. 2) GND Knowledge Distillation – The
LLM is then finetuned on GND subject collections
improves its understanding of subject hierarchies
and relationships.
3) Supervised Fine-Tuning
and Preference Optimization – LoRA-based (Hu
et al., 2022) fine-tuning on TIBKAT data is com-
bined with Direct Preference Optimization (DPO)
(Rafailov et al., 2023) to align model outputs with
human-like subject assignments. 4) Subject Term
Generation – A multi-sampling ranking strategy
improves diversity, LLM-based keyword extrac-
tion selects high-confidence terms, and BGE-M3
(2024) embedding-based vector retrieval adds miss-
ing terms to ensure 50 subject labels per record.
And 5) Re-Ranking for Final Selection – Subject
terms from multiple sources are re-ranked using
LLMs to prioritize the most relevant terms, improv-
ing recall and ranking consistency.
4. Homa (Bayrami Asl Tekanlou et al., 2025) Sub-
ject tagging is tackled using retrieval-augmented
generation (RAG) (Lewis et al., 2020) to match
TIBKAT records with GND subjects leveraging the
OntoAligner toolkit (Giglou et al., 2025). The key
methods steps are: 1) Multi-Level Data Repre-
sentation – Records are represented at three levels:
title-based, contextual (including metadata), and
hierarchical (parent-level relationships) to improve
subject mapping. 2) Retrieval with Embeddings
– Nomic-AI embeddings (Nussbaum et al., 2024)
are used to retrieve the top-k relevant subjects by
computing cosine similarity between records and
subject embeddings. 3) LLM-Assisted Subject Se-
lection – Qwen2.5-0.5B-Instruct LLM (Yang et al.,
2024) assesses retrieved subjects, verifying rele-
4
Team
Method
LLMs Used
Ranking
Annif
LLM-based synthetic data generation
and XMTC traditional classifier models
ensemble
Llama-3.1-8B-Instruct
1st all-subjects, 2nd tib-
core, 4th qualitative
DNB-AI
Few-shot prompting to an LLM ensem-
ble
Llama-3.2-3B-Instruct,
Llama-
3.1-70B-Instruct, Mistral-7B-v0.1,
Mixtral-8x7B-Instruct-v0.1,
OpenHermes-2.5-Mistral-7B,
Teuken-7B-instruct-research-v0.4,
LLama-3.1-8B-Instruct
4th all-subjects, N/A tib-
core, 1st qualitative
DUTIR831
Synthetic data generation, GND knowl-
edge distillation, and supervised finetun-
ing
Qwen2.5-72B-Instruct
2nd all-subjects, 4th tib-
core, 2nd qualitative
Homa
RAG-based ranking and retriever fine-
tuning
Qwen2.5-0.5B
N/A all-subjects, 10th
tib-core, 10th qualita-
tive
Jim
BERT model ensemble
German
BERT,
Multilingual
cased/uncased, ModernBERT base
7th all-subjects, N/A tib-
core, 5th qualitative
LA²I²F
Transfer of concepts from similar docu-
ments to target and concept similarity to
target document
Llama-3.1-8B
as
baseline,
all-
mpnet-base-v2
Sentence
Trans-
former
6th all-subjects, 3rd tib-
core, 8th qualitative
last_minute
Subjects are ranked, then re-ranked with
embeddings, and refined with an LLM
stella-en-400M-v5,
granite-
embedding-125m-english, Llama-
3.2-1B
N/A all-subjects, 9th tib-
core, 11th qualitative
NBF
Finetuned embeddings using Burst At-
tention and multi-layer perceptron
all-mpnet-base-v2, german-roberta
9th all-subjects, N/A tib-
core, 9th qualitative
RUC Team
Retrieves pre-indexed similar records
and uses their subject tags as candidates
Arctic-Embed 2.0, Llama-8B, Chat
GLM 4 (130B)
3rd all-subjects, 1st tib-
core, 3rd qualitative
silp_nlp
Multilingual sentence transformer-based
embedding similarity
jina-embeddings-v3-559M,
distiluse-base-multilingual-cased-
v2
11th all-subjects, 6th tib-
core, N/A qualitative
TartuNLP
Bi-encoder candidate subject retrieval,
and finetuned cross-encoder re-ranking
model
multilingual-e5-large-instruct,
mdeberta-v3-base
8th all-subjects, 7th tib-
core, 7th qualitative
YNU-HPCC
Combines Sentence-BERT with con-
trastive learning
distilroberta, minilm, mpnet
10th all-subjects, 8th tib-
core, 12th qualitative
Table 2: Overview of teams, methods, LLMs used, and rankings from quantitative scores over the two dataset
collections and from the qualitative evaluations. The full leaderboard is released on our shared task website.
vance in a RAG-based ranking framework. And 4)
Fine-Tuning with Contrastive Learning – The
retriever is fine-tuned using contrastive learning,
training on positive and negative record-subject
pairs to improve distinction between relevant and
irrelevant subjects.
5. Jim (Hahn, 2025) The key method steps of this
system are: 1) Multilingual BERT Ensemble –
The system uses an ensemble of four BERT models
(two multilingual m1 & m2, one German-only, one
English-only). 2) Fine-Tuning on TIBKAT and
GND Data – The models are finetuned on TIBKAT
records paired with GND subject labels, leverag-
ing the AutoTrain framework (Thakur, 2024) for
efficient optimization. 3) Ensemble-Based Infer-
ence – Subject predictions are ranked by summing
confidence scores across models.
6. LA2I2F (Salfinger et al., 2025) The system
retrieves subjects based on document similarity
(analogical reasoning) and semantic similarity with
ontology concepts (ontological reasoning), combin-
ing both for optimal subject tagging. The key steps
are: 1) Embedding-Based Retrieval – MPNet sen-
tence embeddings (Reimers and Gurevych, 2019)
are used to represent documents and GND sub-
jects in a shared vector space, enabling similarity-
based matching. 2) Analogical Reasoning for
Subject Transfer – The system identifies semanti-
cally similar training documents and transfers their
human-assigned subject labels to the target doc-
ument. 3) Ontology-Based Subject Matching –
GND subjects are embedded and matched to docu-
ments based on semantic closeness, retrieving the
most conceptually relevant subjects. And 4) Fi-
nal Fusion and Re-Ranking – Predictions from
both methods are merged and ranked by similarity,
ensuring complementary information is integrated.
7. last_minute (Sarlak and Ansari, 2025) The sys-
tem followed a rank, rerank, and refine approach
using contextual vector embeddings stored in the
5
Milvus vector database for efficient retrieval. The
key steps are: 1) Finetuned Embedding Model –
The stella-en-400M-v5 model (Zhang et al., 2024)
is finetuned on the training data with Multiple Neg-
atives Ranking Loss (Henderson et al., 2017). 2)
Re-Ranking with a Cross-Encoder Model – A
granite-embedding-125m model (Granite Embed-
ding Team, 2024) re-ranks the top 100 retrieved
subject tags from the prior step, refining predictions
before LLM processing. And 3) LLM Refinement
– The Llama-3.2-1B LLM (2024) evaluates and se-
lects the top 50 most relevant subject tags from the
re-ranked list using prompt-based filtering.
8. NBF (Islam et al., 2025) The system introduces
the use of Burst Attention (Sun et al., 2024), a
lightweight self-attention mechanism that treats
each embedding dimension as a token, capturing
inter-dimensional dependencies to enhance subject
retrieval. The methodology consists of four key
steps. 1) Sentence Transformer Embeddings
(2019): Articles and GND subjects are embedded
using all-mpnet-base-v2 for en and german-roberta-
sentence-transformer-v2 for de, aligning them in
a shared space. 2) Margin-Based Retrieval with
BurstAttention: The model is trained with a
margin-based ranking loss, leveraging BurstAtten-
tion to refine embeddings by bringing relevant sub-
jects closer and pushing irrelevant ones away. 3)
Feed-Forward MLP for Refinement: A multi-
layer perceptron (MLP) further refines embeddings
to improve subject retrieval accuracy. 4) Top-k
Search: At inference, cosine similarity between
article and subject embeddings is computed, select-
ing the top-k closest subjects as final predictions.
9.
RUC Team (Tian et al., 2025a) This team
used a retrieval-based method, prioritizing accu-
racy, speed, and scalability over heavy LLM infer-
ence. Key steps are: 1) Cross-Lingual Embed-
dings for Retrieval – Uses Arctic-Embed 2.0 (Yu
et al., 2024), a multilingual embedding model, to
match documents across English and German in
a shared semantic space. 2) Vector-Based Near-
est Neighbor Search – Computes inner product
similarities between document embeddings using
Faiss indexing to efficiently retrieve the most rele-
vant records. And 3) Ranking Relevant Subject
Terms – Merges and re-ranks candidate subjects
based on document similarity, term position, and
term occurrence in the title/abstract.
10. silp_nlp (Singh et al., 2025) This system uti-
lizes sentence transformer embeddings (2019)
for titles and abstracts, retrieving subjects based
on cosine similarity.
It employs JinaAi/jina-
embeddings-v3 (Sturua et al., 2024), a novel mul-
tilingual model supporting 89 languages, to pro-
cess both en and de text. Performance was com-
pared against distiluse sentence transformers, with
JinaAi embeddings achieving superior results.
11. TartuNLP (Dorkin and Sirts, 2025) The sys-
tem first retrieves a coarse set of candidate subjects
using a bi-encoder, viz.
multilingual-e5-large-
instruct (Wang et al., 2024), then refines the se-
lection with a cross-encoder re-ranking model,
viz. mdeberta-v3-base model (He et al.), finetuned
on the task dataset. The key insight being the two-
stage approach nearly doubles recall compared to
using the bi-encoder alone, confirming the cross-
encoder re-ranking’s impact on performance.
12. YNU-HPCC (Mao et al., 2025) The system
fine-tuned multilingual sentence-BERT models,
such as paraphrase-multilingual-MiniLM, -mpnet,
and mpnet-base, using contrastive loss, to improve
semantic alignment between the records and sub-
jects. Key was their Balanced Positive-Negative
Sampling – Two strategies were tested: multi-
label sampling, aggregating all true labels per doc-
ument, and single-label sampling, constructing 1:1
positive-negative pairs to improve classification.
The shared task attracted a diverse range of
systems.
A review of the 12 submissions re-
vealed unique methodological contributions, in-
cluding Burst Attention (Islam et al., 2025), analog-
ical/ontological reasoning (Salfinger et al., 2025),
the use of toolkits like Annif (2022) (Suominen
et al., 2025) and OntoAligner (2025) (Bayrami
Asl Tekanlou et al., 2025), and multi-stage prompt
engineering. Some teams (Tian et al., 2025a; Singh
et al., 2025) also evaluated newer embedding mod-
els such as Arctic-Embed and JinAI. As shown in
Table 2, top-performing systems went beyond stan-
dard sentence transformer embeddings (2019). Key
strategies among the leading teams—Annif (Suomi-
nen et al., 2025), DNB-AI (Kluge and Kähler,
2025), DUTIR831 (Tian et al., 2025b), RUC Team
(Tian et al., 2025a), and Jim (Hahn, 2025)—in-
cluded: (1) model ensembles, (2) synthetic train-
ing data generation, and (3) multilingual language
models, the latter being common across submis-
sions. Notably, DUTIR831 and RUC Team de-
ployed very large LLMs—Qwen2.5-72B-Instruct
and ChatGLM 4 (130B)—while others used mod-
els with 8B or fewer parameters.
In the next section, we present the leaderboard
results for the shared task.
6
all-subjects
tib-core
Team Name
P@5
R@5
P@10
R@10
Ov. R@k
Team Name
P@5
R@5
P@10
R@10
Ov. R@k
Annif
0.26
0.49
0.16
0.57
0.63
RUC Team
0.25
0.48
0.16
0.57
0.66
DUTIR831
0.26
0.48
0.15
0.56
0.6
Annif
0.23
0.48
0.14
0.54
0.59
RUC Team
0.23
0.44
0.14
0.52
0.59
LA2I2F
0.2
0.41
0.13
0.49
0.58
DNB-AI
0.25
0.47
0.15
0.54
0.56
DUTIR831
0.23
0.49
0.13
0.54
0.56
icip
0.2
0.39
0.12
0.46
0.53
icip
0.17
0.37
0.1
0.44
0.5
LA2I2F
0.17
0.34
0.11
0.41
0.48
silp_nlp
0.16
0.34
0.11
0.42
0.49
Jim
0.18
0.34
0.11
0.41
0.47
TartuNLP
0.14
0.3
0.09
0.36
0.4
TartuNLP
0.13
0.27
0.08
0.33
0.38
YNU-HPCC
0.05
0.12
0.03
0.16
0.23
NBF
0.08
0.17
0.06
0.23
0.32
last_minute
0.02
0.05
0.02
0.08
0.21
YNU-HPCC
0.04
0.09
0.03
0.12
0.17
Homa
0.08
0.15
0.05
0.18
0.2
silp_nlp
0.05
0.08
0.03
0.11
0.13
TSOTSALAB
0.02
0.04
0.01
0.05
0.07
Homa
-
-
-
-
-
NBF
-
-
-
-
-
TSOTSALAB
-
-
-
-
-
DNB-AI
-
-
-
-
-
last_minute
-
-
-
-
-
Jim
-
-
-
-
-
Table 3: Quantitative performance comparisons for all-subjects and tib-core datasets. The ‘Ov. R@k’ column
represents the average recall across k = 5, 10, ..., 45, 50.
(a) Recall@5 results for all-subjects and tib-core datasets based on the record-type ablation.
(b) Precision@5 results for all-subjects and tib-core datasets based on the record-type ablation.
Figure 1: K@5 Results on the record type ablation. A - article, B - book, C - conference, R - report, and T - thesis.
On the x-axis, teams are listed in alphabetical order of names.
(a) Recall@5 results for all-subjects and tib-core datasets based on the language ablation.
(b) Precision@5 results for all-subjects and tib-core datasets based on the language ablation.
Figure 2: K@5 Results on the language ablation. On the x-axis, teams are listed in alphabetical order of names.
7
7
