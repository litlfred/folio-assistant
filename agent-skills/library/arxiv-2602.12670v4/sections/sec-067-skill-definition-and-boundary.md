---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-067-skill-definition-and-boundary
section_title: "Skill Definition and Boundary"
section_number: null
pages: 36-36
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
A Skill is an artifact satisfying four operational criteria:
• Procedural content: Contains how-to guidance, workflows, standard operating procedures, or
domain conventions rather than factual retrieval.
• Task-class applicability: Applies to a class of problems rather than a single benchmark instance.
• Structured components: Includes a SKILL.md file plus optional resources such as scripts, tem-
plates, references, or worked examples.
• Portability: Is represented as ordinary file-system content, making it easy to edit, version, share,
and use across Skills-compatible agent harnesses.
This definition explicitly excludes system prompts, which lack file-structured resources; few-shot
examples [Brown et al., 2020], which are primarily declarative rather than procedural; RAG re-
trievals [Lewis et al., 2020], which provide factual context rather than procedural workflows; and tool
documentation [Schick et al., 2023, Qin et al., 2024], which describes tool capabilities rather than
how to solve a task class. The boundary is not absolute–for example, a StackOverflow answer may
mix factual and procedural content–but these criteria provide an operational definition for benchmark
construction.
In SKILLSBENCH, each Skill is a modular package under environment/skills/. The required
SKILL.md specifies how to approach a task class, while optional resources may include executable
scripts, code templates, reference documentation, or examples that the agent can invoke or consult.
M.2
