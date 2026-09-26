---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-015-limitations-and-areas-for-improvement
section_title: "Limitations and Areas for Improvement"
section_number: null
pages: 7-8
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
Geographic and chronological subdivision. The agent under-
subdivided in several cases. Strengthening the MARC synthesis
skill’s guidance on when to append $z and $y subdivisions—
particularly for works with clear geographic or temporal scope—
would address this gap.
Heading selection among synonymous terms. When multi-
ple authorized headings cover overlapping territory (e.g., Race
discrimination vs. Racism in the workplace), the agent some-
times selected the broader term. Enhanced BT/NT navigation
in the authority validation skill could guide toward the most
specific applicable heading.
Absence of copy cataloging context. In practice, subject
catalogers consult existing records in shared utilities like World-
Cat when assigning headings. The agent pipeline operates from
the title page and abstract alone, without access to peer records.
Integrating a step that queries existing bibliographic records
for the same ISBN could improve consistency with community
7
subject indexing practice.
Corpus size and disciplinary coverage. Ten paired com-
parisons are insufficient for statistical generalization. Although
the test corpus spans the humanities, social sciences, natural
sciences, and fiction, with only one or two titles per discipline
it is not possible to determine whether the pipeline performs
more reliably in some subject domains than others. A more sys-
tematic evaluation—drawing a larger, stratified sample across
disciplines from the Harvard Library Bibliographic Dataset—
would allow researchers to identify whether the pipeline is
better suited to certain types of material (e.g., monographs with
well-defined topical scope vs. interdisciplinary edited volumes)
and whether particular disciplines present recurring challenges
for automated subject indexing, such as the granular geographic
subdivisions observed in the anthropology title or the “Mathe-
matical models” subdivisions expected in physics. Establishing
inter-cataloger agreement baselines for the same titles would
further contextualize the pipeline’s performance relative to the
inherent variability of human subject indexing.
4.3
