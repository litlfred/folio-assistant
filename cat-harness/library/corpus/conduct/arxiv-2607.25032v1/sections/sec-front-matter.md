---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-1
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
Authoring Agent Skills: A Software-Engineering
Approach
Giuseppe Destefanis
Department of Computer Science, University College London
g.destefanis@ucl.ac.uk
Abstract
Agent Skills are an emerging way to extend large language model agents with reusable procedural
knowledge that the agent loads on demand. Anthropic introduced Agent Skills and published
the format as an open specification supported across several agent tools. This note argues
that a skill is a software artefact and that its construction should follow software-engineering
principles, with qualifications: single responsibility, separation of interface from implementation,
low coupling, and economy in a shared token budget, together with behavioural evaluation in
place of deterministic testing. Using Claude Code as the reference implementation, it describes
how a skill is structured, how its contents are loaded in stages, and how to write the description
on which selection depends. It places skills against the other mechanisms a developer can use
to shape agent behaviour, like project memory files, slash commands, subagents, external tool
connections, and hooks, and gives a rule for choosing between them based on who decides
that a mechanism runs and what guarantee it provides. It then sets out an evaluation-driven
authoring process, a set of patterns and faults commonly encountered in authoring, and the
trust question raised by using skills from third parties. We illustrate the comparison drawn
in UML class style, the loading model, the anatomy of a skill, the relative position of each
mechanism, and the points at which skills and hooks act during a session.
Note on sources
This note draws on Anthropic’s official documentation1 for Agent Skills, Claude Code skills, hooks,
and skill authoring best practices, together with the open Agent Skills specification.
1
