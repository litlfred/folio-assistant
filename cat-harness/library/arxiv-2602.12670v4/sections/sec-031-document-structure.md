---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-031-document-structure
section_title: "Document Structure"
section_number: null
pages: 19-19
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
task.md is a Markdown file whose YAML frontmatter is the task configuration and whose body,
immediately following the closing frontmatter delimiter, is the task instruction—no section heading
is required. The schema is strict at the top level: unknown keys are rejected at parse time, so a
contributor’s task cannot silently lose a configuration field as the schema evolves across harnesses;
values within the free-form metadata block are open by design (next subsection).
---
schema_version : "1.3"
metadata:
difficulty: medium
# easy | medium | hard
category: finance -economics
# controlled
vocabulary
task_type: [analysis]
tags: [pandas , spreadsheet ]
# open
tier
environment:
network_mode : no -network
# no -network|public|allowlist
cpus: 1
memory_mb: 4096
storage_mb: 10240
agent: {}
verifier: {type: test -script}
oracle: {}
---
You are
given
...
produce
... in /app/out.json.
C.2
