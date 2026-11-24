---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
A skill packages a workflow, a set of conventions, domain facts, or a sequence of steps that an
agent should follow for a particular kind of task, so that the agent behaves as a specialist without
the developer repeating the same guidance in every session. A characteristic property of a skill
is that the agent can decide when to apply it, by matching the description, and that decision is
probabilistic. There is no compiler or type system confirming that the right skill fired. Authoring
choices therefore determine whether a skill is selected at all and whether its instructions are
followed once loaded.
Anthropic introduced Agent Skills and published them as a portable format. The directory
structure, the YAML frontmatter, and the staged loading model are an open specification supported
across a range of agent tools [1]. A skill written against the core format can usually be read by
another tool that supports the specification, though tool-specific fields and behaviours may not
transfer. This note uses Claude Code as the reference implementation, because it exposes the
surrounding mechanisms in full, but the structure of a skill and the authoring principles apply
wherever the format is supported.
1https://www.anthropic.com/
1
arXiv:2607.25032v1  [cs.SE]  27 Jul 2026
A skill is a software artefact, and the argument of this note rests on that claim, so it is
worth stating the grounds. A skill is made of ordinary files: a SKILL.md file of instructions, plus
any scripts and reference documents it bundles. These files can be kept under version control, like
the rest of a project’s code. It has an interface, the description, and an implementation, the body
and any bundled scripts. It is composed with other units: it bundles resources, calls tools, and
can invoke other skills. It is read and executed by a machine, it is maintained as the surrounding
system changes, and it can fail, by not being selected or by being followed incorrectly. These are
the properties by which software is identified, so the methods used to build software apply to
skills, and this note treats authoring as a design activity. Section 2 develops the consequences.
A developer assembling a real project faces a further problem that the per-skill documentation
does not address directly. Several mechanisms shape agent behaviour: project memory files, slash
commands, subagents, external tool connections, and hooks. They look similar on the surface
and differ in what they guarantee. Choosing the wrong one is a common source of unreliable
behaviour, because a requirement that must hold every time is written as advisory prose in a
place that only sometimes takes effect.
This note has four aims. The first is to argue that software-engineering principles apply to
skills, and to set out the comparison drawn in UML class style and its limits. The second is to set
out the structure of a skill, its staged loading model, and the way a description governs selection.
The third is to position skills against the other mechanisms on the same surface and give a rule
for choosing between them. The fourth is to describe an authoring process based on evaluation
and iteration, together with common patterns and faults. The examples use Claude Code, and
the diagrams use a generic skill that does not describe any specific deployment.
2
