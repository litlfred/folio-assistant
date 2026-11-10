---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-004-schema-matching-and-mapping
section_title: "Schema Matching and Mapping"
section_number: null
pages: 2-2
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
Integrating data from various sources and in different for-
mats poses a significant challenge [20]–[22]. In this work,
we study the task of schema mapping: converting an instance
from one JSON schema to another. A schema mapping can
contain simple property-to-property correspondences or also
more expressive logics. JSON to JSON transformation (Jolt)3,
is a Java library to transform JSON documents. JSONata4,
2https://www.liquid-technologies.com/json-schema-editor, acc. 25/06/02
3https://github.com/bazaarvoice/jolt, acc. 25/06/02
4https://github.com/jsonata-js/jsonata, acc. 25/06/02
is another transformation library, written in TypeScript. The
JSON query language jq5 also can be used to transform JSON
documents. While it is a powerful tool for concise JSON
querying and transformation on the command line, it is not
primarily intended for transforming large JSON documents
due to its in-memory processing model and limited support
for streaming or parallel execution.
Schema mappings can be created manually, but there also
exist automated approaches [23]. The task of identifying which
elements in one schema correspond to elements in another is
called schema matching. Rahm and Bernstein [24] compare
different automated schema matching approaches for rela-
tional databases. Stanek and Killough [25] created a program
which generates code to convert a JSON document from
one schema to another, defining and implementing different
mapping rules themselves. Buss et al. [26] discuss the use of
LLM to automatically create schema mappings, focusing on
relational databases. Among other points, they state that due
to the difficult nature of data integration, human-in-the-loop
approaches are required.
