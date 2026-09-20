---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-010-trust-and-third-party-skills
section_title: "Trust and third-party skills"
section_number: null
pages: 8-9
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
A skill should be treated as a software dependency. It can carry instructions, scripts, references,
and links to external content, and the agent acts on those materials with whatever permissions it
holds in the current environment. A skill that fetches external content is a particular concern,
since that content can itself carry instructions and can change after the skill was first trusted.
8
So a skill from a third party should be inspected before use: read the SKILL.md, the bundled
scripts, the referenced resources, and any external URLs, and check each against the skill’s stated
purpose. This matters most when the skill can read local files, call tools, or send data outside the
project [2].
12
