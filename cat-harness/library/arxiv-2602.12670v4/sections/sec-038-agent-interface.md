---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-038-agent-interface
section_title: "Agent Interface"
section_number: null
pages: 21-21
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Agents interact with the environment through a standardized interface:
class
BaseAgent(ABC):
@abstractmethod
def
step(self , obs: str) -> str:
"""obs:␣terminal␣output␣->␣action"""
pass
D.5
