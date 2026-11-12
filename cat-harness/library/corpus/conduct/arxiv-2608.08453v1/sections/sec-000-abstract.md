---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-000-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
Under the current standard, Agent Skills are SKILL.md files
that combine instructions with supporting resources, en-
abling Large Language Model (LLM) agents to reuse proce-
dures beyond a single conversation. Yet many public skills
appear to originate from a single task, repository, or conver-
sation, even when they are shared as reusable components.
We analyze this gap across 138,133 public SKILL.md files
from 20,556 repositories using a two-tier defect taxonomy
grounded in the official specification and best-practice guid-
ance. We find that 91.8% of skills contain at least one de-
tected defect, with stable estimates across lenient and strict
thresholds (88.8–94.6%). The dominant failures are ordinary
packaging problems rather than exotic attacks: weak routing
metadata, bloated or non-actionable bodies, and poor re-
source organization. A deterministic routing stress test over
20,000 skills shows the functional impact: skills with valid
routing metadata are retrieved more reliably from startup
descriptions than skills with routing defects. Defect rates
vary by platform and provenance: specification-aware skills
contain fewer defects, while AI-marked skills show more
safety and portability problems. Lightweight enforcement
and repair experiments support a quality-assured generation
workflow combining spec-aware prompting, lightweight lint-
ing, automated repair, and safety gating.
Keywords: Agent Skills, LLM Agents, SKILL.md, Reusability
Defects, Skill Routing, Quality-Assured Generation
1
