---
doc_id: arxiv-2510.21603v1
doc_title: "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research"
section_id: sec-001-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-2
source_pdf: dong-2025-doc-researcher.pdf
source_sha256: edc03be2ad64077b
toc_source: outline
---
Recently, agentic retrieval-augmented generation (RAG) systems
have significantly transformed the way LLMs retrieve, organize,
and present information [30, 43]. Agentic RAG enhances tradi-
tional RAG paradigm by enabling systems to plan retrieval strate-
gies, invoke external tools, adaptively refine queries, and validate
context [18]. These capabilities underpin recent Deep Research
systems [13], which support complex reasoning [14, 17–19] and
research workflows [9, 20]. However, current deep research sys-
tems [37] remain constrained by their exclusive focus on textual
web data. This limitation overlooks the reality that professional and
academic documents (e.g., scientific papers, technical reports, finan-
cial reports, brochures, etc) are inherently multimodal, seamlessly
integrating text with images, tables, equations, and charts [33, 44].
Moreover, these systems lack the capability to process locally stored
documents, forcing users to rely solely on publicly available web
content rather than their own document repositories.
To facilitate multimodal document understanding, recent agen-
tic RAG systems (e.g., MDocAgent [12] and M3DocRAG [3]) have
emerged. However, these systems exhibit three critical limitations:
(1) Inadequate multimodal parsing. Current approaches rely on
simplistic parsing strategies: either converting documents into OCR-
text [41] or treating them as raw page screenshots [10, 12]. Both
methods fail to preserve modality-specific characteristics and rich
visual semantics inherent in charts, tables, figures, equations, and
complex layouts. (2) Limited retrieval strategies. Existing sys-
tems employ retrieval mechanisms based solely on OCR-extracted
text chunks or full-page screenshots, hindering precise multimodal
evidence localization. Different research tasks demand varying
granularities: document-level summaries [7] for comparative anal-
ysis, fine-grained chunks [8] for specific evidence extraction, or
visual elements for multimodal understanding. Yet current systems
lack mechanisms to dynamically select optimal retrieval strate-
gies across modalities and granularity levels (e.g., full-text, sum-
mary, page, chunk) based on query characteristics. (3) Absence
of deep research capabilities. Current systems are confined to
single-round visual QA rather than supporting iterative, multi-
step research workflows. Furthermore, no evaluation framework
comprehensively assesses multimodal document understanding in
realistic research scenarios: particularly those requiring large-scale
arXiv:2510.21603v1  [cs.IR]  24 Oct 2025
xxx, June 03–05, 2018, Woodstock, NY
Dong et al.
A 50-year-old Singaporean is considering PRUShield either
Premier or Plus (with rider), minimizing OOP costs of
S$80k private hospitalisation (panel provider).  What is
their total annual premium?
Premier Route: Total annual premium = SGD 3,114.40  
Plus Route: Total annual premium = SGD 1,181.38
What is the maximum OOP they would pay for the
S$80k stay under each combination?  
Premier + Premier CoPay (Panel Private Hospital): Max
OOP = S$3k, Plus + Plus CoPay (Private Hospital): Max
OOP = S$80k, it only covers restructured hospitals, so
no benefit for private hospital bill.
What happens to this OOP and their premium level if
they go to a non-panel provider?
History Analysis
PRUShield Premier Plan:  
Standard Deductible + Co-insurance = $11,150. PRUExtra
Premier covers part ($5,250). Needs to pay $5,900 OOP, as
there is no stop-loss protection (unlike panel). 
Premium rating increases by 4 levels next year.
PRUShield Plus Plan: 
Still invalid for private hospital claims. OOP = $80,000.
Doc Relevance
Conversation History
Search & Refine
Search queries: 
- PRUShield Premier/ Plus
private non-panel coverage
- PRUShield Premier/ Plus
private non-panel hospital: out-
of-pocket maximum
- PRUShield premium level 
Report (short)
Retrieved
Evidence
- 50-year-old Singaporean
- S$80k hosptilalisation bill
- Premier + Premier CoPay
- Plus + Plus CoPay
- doc1
- doc2
- doc3
- doc4
- doc5
- doc6
- doc7
- doc8
- doc9
- doc10
- doc11
- ....
Figure 1: An typical use case of multimodal doc deep research. The user asks a multi-hop question in the context of multi-
turn conversations, where ground-truth evidence spans across multiple documents and modalities. The demo conversations,
evidence, and answer are shortened for simplicity. Refer to more examples and evidence-chain annotations in Figure 4.
document collections with annotated evidence chains, multi-hop
reasoning, and multi-turn interactions (Figure 1). In contrast, exist-
ing document QA benchmarks focus primarily on single-document
scenarios [5, 23] (Table 1).
To address these challenges, we introduce Doc-Researcher, a
unified system that integrates sophisticated multimodal document
parsing with multi-agent deep research capabilities. Our approach
makes three key contributions: (1) Deep multimodal parsing
(§3.1). We develop a comprehensive parsing framework that em-
ploys MinerU [39] for layout-aware document analysis, followed by
intelligent chunking strategies and multimodal content processing.
This framework creates multi-granular document representations
that preserve both structural and semantic information, enabling ef-
ficient multimodal retrieval. (2) Systematic retrieval architecture
(§3.2). We conduct extensive experiments on multimodal retrieval
paradigms, evaluating 5 text and 5 vision retrievers alongside vari-
ous reranking and query extension strategies. Our analysis reveals
the effectiveness-efficiency tradeoffs among text-only, vision-only,
and hybrid approaches. (3) Deep research workflows (§3.3). Doc-
Researcher supports iterative, multi-step research workflows on
local document collections through intelligent planning capabilities.
The framework adaptively selects optimal retrieval granularities
based on query characteristics and content types, enabling complex
multi-hop reasoning across documents.
Beyond the system itself, we introduce M4DocBench (§4), a
comprehensive benchmark for evaluating multimodal, multi-hop,
multi-document, and multi-turn deep research capabilities. This
benchmark provides expert-annotated question-answer pairs with
complete evidence chains, enabling rigorous assessment of doc-
ument understanding in realistic research scenarios. Experimen-
tal results demonstrate that Doc-Researcher significantly out-
performs existing approaches, establishing a new paradigm for
multimodal document retrieval and deep research. In summary,
our contributions are threefold: (1) Deep multimodal parsing
and retrieval framework: We develop modular, plug-and-play
components for multimodal document parsing and retrieval that
can enhance any deep research system, featuring layout-aware
analysis and multi-granular representation strategies. (2) Doc-
Researcher system: We present the first unified deep research
workflows, leveraging adaptive and granular retrieval, and iterative
evidence refinement for multimodal documents understanding. (3)
M4DocBench benchmark: We establish the first comprehensive
benchmark for multimodal deep research, featuring large-scale doc-
ument collections with annotated evidence chains for multi-hop,
multi-document, and multi-turn evaluation.
2
