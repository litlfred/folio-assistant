---
doc_id: arxiv-2508.05192v2
doc_title: "AI-assisted JSON Schema Creation and Mapping 1st Felix Neubauer , 3rd Benjamin Uekermann"
section_id: sec-010-conclusion
section_title: "Conclusion"
section_number: null
pages: 4-5
source_pdf: neubauer-2025-ai-assisted-schema-creation.pdf
source_sha256: 13728ff160553b85
toc_source: outline
---
We presented a hybrid approach for schema creation,
editing, and instance transformation using large language
models, integrated into the open-source tool MetaConfigu-
rator. Our method combines modular prompt engineering,
targeted context scoping, human-in-the-loop refinement, and
post-processing safeguards to enable intuitive and controlled
schema modeling. To enable transforming also large document
instances to satisfy a target schema, mapping rules are gener-
ated by LLMs but then applied in a deterministic manner.
An example in the chemistry domain demonstrates the
applicability of our approach. By translating informal data
11https://croningroup.gitlab.io/chemputer/xdl/standard, acc. 25/07/05.
into machine-readable structures, our method enables FAIR
(Findable, Accessible, Interoperable, and Reusable) [38] data
practices and model-driven workflows.
Beyond this proof-of-concept, model editing and instance
transformation, the tool supports other MDE-oriented tasks
such as instance validation, code/documentation generation,
mapping discovery and schema-driven form generation. A
future extension for model-to-model transformations (e.g.,
XSD to JSON Schema) is planned.
ACKNOWLEDGMENT
The authors acknowledge Eseng¨ul Ciftci (Max Planck In-
stitute for Solid State Research, Stuttgart, Germany) and
Kenichi Endo (University of Stuttgart, Institute of Polymer
Chemistry, Stuttgart, Germany) for inspiring the chemistry
application example. The assistance of ChatGPT-4 for editorial
suggestions is acknowledged.
