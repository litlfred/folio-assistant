---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-018-7-conclusion
section_title: "Conclusion"
section_number: 7
pages: 9-9
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
We studied what keeps public Agent Skills from becoming
reusable agent capabilities. Across 138,133 public SKILL.md
files, 89.3% violate at least one official-specification rule and
91.8% contain at least one detected reusability defect under
our baseline detector, with the finding stable under lenient
and strict thresholds. Routing is the clearest functional bot-
tleneck we isolate: skills with clean routing metadata are
retrieved more reliably than those with routing defects from
the startup description surface under a BM25 lexical baseline;
an LLM-based selector may compress this gap, and we treat
lexical retrieval as a lower-bound probe of discovery-stage
reuse.
These findings lead to a four-stage quality-assured gen-
eration workflow: spec-aware prompting, lightweight lint-
ing, automated repair, and safety gating, supported by static
analysis, routing stress testing, enforcement simulation, and
repair experiments on our dataset. The workflow addresses
the practical reality that self-generated skills currently pro-
vide little average benefit by embedding routing, structure,
resource organization, and safety checks into generation
itself.
Data Availability. Our dataset (138,133 skills, CC-BY-
4.0) and all analysis scripts are publicly available at https:
//huggingface.co/datasets/FayeZC/SkillMD-138K.
