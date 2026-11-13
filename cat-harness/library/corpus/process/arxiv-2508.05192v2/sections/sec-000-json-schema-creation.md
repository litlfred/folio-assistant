---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-000-json-schema-creation
section_title: "JSON Schema Creation"
section_number: null
pages: 1-1
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
1st Felix Neubauer
, 3rd Benjamin Uekermann
Institute for Parallel and Distributed Systems
University of Stuttgart
Stuttgart, Germany
Felix.Neubauer@ipvs.uni-stuttgart.de,
Benjamin.Uekermann@ipvs.uni-stuttgart.de
2nd J¨urgen Pleiss
Institute of Biochemistry and Technical Biochemistry
University of Stuttgart
Stuttgart, Germany
Juergen.Pleiss@itb.uni-stuttgart.de
Abstract—Model-Driven Engineering (MDE) places models
at the core of system and data engineering processes. In the
context of research data, these models are typically expressed
as schemas that define the structure and semantics of datasets.
However, many domains still lack standardized models, and
creating them remains a significant barrier, especially for non-
experts. We present a hybrid approach that combines large
language models (LLMs) with deterministic techniques to enable
JSON Schema creation, modification, and schema mapping based
on natural language inputs by the user. These capabilities are
integrated into the open-source tool MetaConfigurator, which
already provides visual model editing, validation, code gener-
ation, and form generation from models. For data integration,
we generate schema mappings from heterogeneous JSON, CSV,
XML, and YAML data using LLMs, while ensuring scalability
and reliability through deterministic execution of generated
mapping rules. The applicability of our work is demonstrated in
an application example in the field of chemistry. By combining
natural language interaction with deterministic safeguards, this
work significantly lowers the barrier to structured data modeling
and data integration for non-experts.
Index Terms—rdm, research data management, mde, model
driven engineering, json, yaml, configuration, schema, data,
model, editor, gui, tool, ai, llm, mapping, matching
