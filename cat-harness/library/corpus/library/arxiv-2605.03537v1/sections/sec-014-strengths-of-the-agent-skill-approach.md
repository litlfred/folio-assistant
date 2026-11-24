---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-014-strengths-of-the-agent-skill-approach
section_title: "Strengths of the Agent Skill Approach"
section_number: null
pages: 7-7
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
The modular pipeline design offers several advantages over
monolithic prompting:
Separation of concerns. Each skill addresses one phase of
the subject indexing process, mirroring the cognitive stages a
trained subject cataloger moves through. This decomposition
makes each stage auditable: a reviewer can identify exactly
where a questionable heading decision originated.
Policy updateability. When LC policy changes—as it did in
February 2026 with the discontinuation of form subdivisions—
the change can be implemented by modifying the relevant
skill(s) without rebuilding the entire system. The 2026 LCGFT
transition required updates to two skills while leaving the other
two unchanged.
Transparency of reasoning. Each skill produces intermedi-
ate output with justifications (20% calculations, authority match
scores, subdivision authorization checks), making the system’s
reasoning inspectable—in contrast to end-to-end systems that
produce headings without explanation.
Standards fidelity. The skill instructions directly encode
SHM rules with section-level granularity. The 20% rule, Rule
of Three, specificity principle, and subdivision ordering rules
are not learned from training data but explicitly specified, ensur-
ing that every heading decision is traceable to a specific policy
document.
4.2
