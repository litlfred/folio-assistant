---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-011-summary-of-guidance
section_title: "Summary of guidance"
section_number: null
pages: 9-9
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
A skill is a software artefact, and the guidance above is an application of ordinary engineering
discipline to it. The comparison drawn in UML class style holds for structure, while invocation
works differently: the model selects a skill probabilistically, so evaluations carry the weight a
type system would in conventional code. A skill is selected by the model on the strength of its
description and loaded in stages, so the description must state both function and trigger, and the
body must stay short and assume general knowledge. Reference files are linked one level deep,
and scripts are bundled for execution rather than for reading. The choice between a skill and
the other mechanisms turns on two questions: who should decide that it runs, and how strong
the guarantee must be. Judgement-dependent procedure belongs in a skill; a requirement that
must hold every time belongs in a hook. Authoring proceeds by writing evaluations first, then the
minimum instructions needed to pass them, and refining against observed behaviour. Because
a skill may contain instructions and code that the agent can act on, a skill from a third party
should be read in full before it is used.
References
[1] Agent Skills. Agent Skills Specification (open standard, Apache-2.0). https://agentskills.io
[2] Anthropic. Agent Skills. Claude API documentation. https://platform.claude.com/docs/
en/agents-and-tools/agent-skills/overview
[3] Anthropic. Skill authoring best practices. Claude API documentation. https://platform.
claude.com/docs/en/agents-and-tools/agent-skills/best-practices
[4] Anthropic. Hooks reference. Claude Code documentation. https://code.claude.com/docs/
en/hooks
[5] Anthropic. Skills in Claude Code. Claude Code documentation. https://code.claude.com/
docs/en/skills
9
