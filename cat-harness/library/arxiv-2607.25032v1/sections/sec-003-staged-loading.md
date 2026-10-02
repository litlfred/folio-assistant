---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-003-staged-loading
section_title: "Staged loading"
section_number: null
pages: 4-4
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
Skills use staged loading, described in the documentation as progressive disclosure [2]. The
mechanism rests on three levels, shown in Figure 2.
The first level is the frontmatter. The name and description of every installed skill are made
available to the model at the start of a session, at a cost of roughly one hundred tokens per skill [2].
This is what lets a project hold many skills without paying for all of their contents up front. At
this stage the model knows only that the skill exists and what it claims to be for.
The second level is the body. When the model judges that a task matches a skill’s description,
it reads SKILL.md from disk and the body enters the context window. The body should stay
under about five hundred lines, a few thousand tokens, so that once loaded it does not crowd out
the conversation and other context [3].
The third level is the bundled files. Reference documents are read only when the body points to
them and the task needs them. Scripts are normally run rather than read into context: executing
a script keeps its source out of the context window and brings in only its output. A script can
instead be read as reference where its internal logic matters, in which case it counts as a reference
file. There is no token cost for bundled material until it is accessed, which means a skill can carry
large reference files or datasets without penalty as long as they remain unread [2].
Level 1
Metadata
name + description
Level 2
SKILL.md body
instructions
Level 3
Reference files
and scripts
reads when
relevant
reads or runs
as needed
always loaded
≈100 tokens / skill
loaded on trigger
under ≈5k tokens
loaded on demand
no fixed limit
Figure 2: Staged loading. Only the metadata is resident at all times. The body enters context when the
model selects the skill, and bundled files are read or executed only when the task requires them.
A skill has two invocation paths. Under automatic invocation the model decides whether to
run a skill, by matching the description, and that decision is probabilistic. A skill can also be
invoked directly by name, which runs it deterministically at the user’s choice. The description
carries a double load on the automatic path: it is both the documentation a reader sees and the
trigger condition the model matches against.
5
