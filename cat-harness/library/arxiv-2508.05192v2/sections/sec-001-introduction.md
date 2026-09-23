---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-001-introduction
section_title: "Introduction"
section_number: null
pages: 1-1
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
Model-Driven Engineering (MDE) emphasizes the central
role of models in the design, development, and operation of
systems [1]. In the context of research data management [2]–
[4], models are typically expressed as schemas, which define
the structure and semantics of datasets. These models enable
key functionalities such as instance validation, transformation,
code generation, and visualization, and are essential for ensur-
ing data quality, interoperability, and reusability.
Despite their importance, many scientific domains still
lack standardized data models. In fields such as chemistry,
data are often stored in electronic lab notebooks (ELNs) or
spreadsheets, where much of the meaning is implicit rather
than explicitly structured. While CSV documents are used in
many machine learning workflows, they are inherently limited
to flat, table-like structures and cannot encode relationships,
constraints, or domain-specific rules. This lack of structure
restricts interoperability, reproducibility, and the application of
Deutsche
Forschungsgemeinschaft
(DFG)
under
project
numbers
528693298 (preECO), 358283783 (SFB1333), and 390740016 (EXC2075)
downstream methods such as knowledge graph construction or
automated schema-driven validation.
Recent advances in large language models (LLMs) offer
a promising opportunity to bridge this gap by assisting users,
particularly non-experts, in the creation and refinement of data
models. LLMs can translate natural language descriptions into
structured model representations, potentially democratizing
model-driven techniques. However, relying solely on LLMs
introduces several limitations: 1) lack of guaranteed model
validity, 2) limited interpretability of plain-text outputs, 3)
challenges in processing large or complex datasets, and 4) the
need for users to craft effective prompts.
To address these issues, we present an MDE-based approach
that integrates LLMs with deterministic safeguards, including
targeted pre- and post-processing, and the rule-based execution
of AI-generated mappings, implemented in the open-source
tool MetaConfigurator1 [5]. MetaConfigurator supports inter-
active visual model (schema) editing, validation, and code/-
documentation/form generation.
We extend the tool with capabilities for schema creation,
modification, and querying from natural language input (Sec-
tion III-A). By integrating prompt engineering, context man-
agement, and post-processing safeguards with visual feedback
and schema validation, we align LLM-generated content with
the principles of model correctness and transparency central to
MDE. Second, we introduce a model-driven approach to data
integration (Section III-B): given heterogeneous data sources
in JSON [6], YAML [7], XML [8], or CSV, LLMs generate
human-readable mapping rules to transform the data into a
target schema (model). These rules are executed deterministi-
cally, separating generation from execution and ensuring reli-
ability and scalability, especially for large datasets. To demon-
strate practical applicability, Section IV showcases an example
from the domain of chemistry, where existing unstructured
Excel data are transformed into structured, interoperable, and
AI-ready representations using the extended toolchain.
