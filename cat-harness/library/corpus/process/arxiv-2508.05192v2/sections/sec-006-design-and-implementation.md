---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-006-design-and-implementation
section_title: "Design and Implementation"
section_number: null
pages: 2-3
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
In this section, we describe the design and implementation
of our AI-assisted schema creation (Section III-A) and schema
matching (Section III-B) approaches.
Our system communicates with LLMs via a configurable
endpoint that follows the OpenAI API6. Users may select
the desired model via the application’s settings. Prompts are
programmatically constructed and transmitted to the API, and
the resulting textual outputs are automatically parsed and
processed by our application. Access to LLMs via these APIs
requires an authentication key tied to a user account and billing
configuration. We do not provide such API keys directly;
instead, MetaConfigurator requires users to supply their own
credentials for API access. All LLM-based interactions and
evaluations presented in this paper were conducted using
5https://github.com/jqlang/jq, acc. 25/06/02
6https://platform.openai.com/docs, acc. 25/06/07
gpt-4o-mini, which we selected for its favorable trade-
off between cost-efficiency and its demonstrated proficiency
in handling JSON Schema tasks.
