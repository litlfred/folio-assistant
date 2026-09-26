---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-006-source-material-and-skill-construction
section_title: "Source Material and Skill Construction"
section_number: null
pages: 3-3
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
The four agent skills were constructed through close reading
and systematic encoding of eleven Library of Congress pol-
icy documents, listed in Table 1. These PDFs, obtained from
the Library of Congress Cataloging and Acquisitions division,
served as the primary normative source for the rules embedded
in each skill.
In addition to the LC policy documents, the conceptual anal-
ysis skill drew on Holley & Joudrey (2021), a review article
that synthesizes the theoretical frameworks for aboutness de-
termination and conceptual analysis in library and information
science. Their presentation of Wilson’s four methods of subject
determination (purposive, figure-ground, objective, cohesion),
Langridge’s three questions, and the Joudrey–Taylor concept
identification framework provided the intellectual scaffolding
for the first stage of the pipeline.
Each reference document was read in full and its norma-
tive content—rules, exceptions, decision criteria, and worked
examples—was translated into structured instructions within
a SKILL.md file. The resulting skills are not simply prompts;
they are multi-section documents that define terminology, enu-
merate decision steps, specify output formats, and include vali-
dation checks. The complete SKILL.md files for all four skills,
along with the Python scripts for authority validation, are avail-
able in the project’s GitHub repository.1
1https://github.com/choweric/
subject-indexing-skills
2.2
