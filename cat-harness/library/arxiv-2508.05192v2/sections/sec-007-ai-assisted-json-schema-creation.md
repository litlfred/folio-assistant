---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-007-ai-assisted-json-schema-creation
section_title: "AI-assisted JSON Schema Creation"
section_number: null
pages: 3-3
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
MetaConfigurator’s modular and extensible architecture en-
ables the integration of a new AI assistance view. To enable
schema creation and modifications via natural language, we
introduce a conversational, chat-like interface. Our hybrid
method offers several advantages over pure LLM-based so-
lutions:
1) Prompt construction and context management: The
tool handles all aspects of prompt engineering. For
schema creation, it dynamically constructs a structured
prompt that sets the LLM’s role (e.g., ”You are a JSON
Schema expert”), includes the user’s natural language
description, and specifies the expected output format.
For schema modifications, the relevant schema subset,
based on the user’s current selection, is included in the
prompt.
2) Integrated validation and visualization: The generated
or modified schema is immediately subject to validation
and is visualized within MetaConfigurator’s schema ed-
itor.
3) Scalability through targeted context: To prevent LLM
inaccuracies and hallucinations on large schemas, we
avoid transmitting the entire schema. Instead, only the
user-selected sub-schema is provided as context, en-
abling precise and modular editing.
4) Automated response post-processing: The tool auto-
matically cleans the LLM response by removing format-
ting artifacts such as code fences or language identifiers.
5) Human-in-the-loop editing: If the LLM output is in-
complete or incorrect, the user is presented with the raw
response. They may then correct the schema manually
before accepting or discarding the change.
For schema creation tasks, prompts are constructed accord-
ing to the principles described above. Figure 1 shows an exam-
ple of a user-provided schema description to MetaConfigurator
and the resulting schema, visualized. The same chat-based
interface can be used to modify existing schemas (Figure 2),
to query a schema for information or to create, edit and query
document instances.
