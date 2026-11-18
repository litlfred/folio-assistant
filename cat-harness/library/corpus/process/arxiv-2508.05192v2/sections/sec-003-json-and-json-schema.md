---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-003-json-and-json-schema
section_title: "JSON and JSON Schema"
section_number: null
pages: 2-2
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
JSON is a widespread data format for exchanging infor-
mation with web services, storing semi-structured documents
in NoSQL databases [9], and representing structured content
in APIs and configuration files. Its simplicity and human-
readability, combined with wide support across programming
languages, make it a natural fit for data interchange and
machine learning pipelines.
JSON Schema, the de-facto standard for describing the
structure and constraints of JSON documents [10], plays a
crucial role in enabling validation, interoperability, and au-
tomation. It can also be understood as a modeling language,
capturing the conceptual structure of data much like class
diagrams in MDE.
B. JSON Schema Creation
There exist several so-called JSON schema editors, which
are tools for creating and editing schemas. Among others,
this includes MetaConfigurator [5], Adamant [11] and Liq-
uid Studio JSON Schema Editor2 (paid). All these editors
require some level of understanding of JSON schema. For
this work, we build on MetaConfigurator a general-purpose
schema editor and form generator that supports different data
formats (e.g., JSON, YAML, XML) and different ways to
present and edit the data (e.g., a text editor, GUI editor or
schema diagram [12]). We choose MetaConfigurator, because
of its modular architecture and because it can generate source
code in 17 programming languages, as well as generate
documentation from a schema. Furthermore, it is open source,
free, accessible as a web service and we are familiar with it.
There also exist approaches to generate a schema automat-
ically, based on an instance dataset. They are referred to as
schema inference [13] or schema discovery [14] tasks. LLM-
based services, such as ChatGPT, can also directly be used
to generate a schema using natural language, however these
services lack proper schema validation and visualization of
the schema in a graphical way. Furthermore, 1) LLMs can be
distracted by irrelevant contexts [15]; 2) Even for deterministic
tasks, LLMs showed a significant drop in accuracy when
dealing with low-probability inputs [16]; and 3) The reasoning
abilities of LLMs degrades as the input length increases, also
before reaching maximum context window [17]. Mior [18]
fine-tune a LLM for schema related tasks and outperform the
base model Code LLama [19] significantly.
