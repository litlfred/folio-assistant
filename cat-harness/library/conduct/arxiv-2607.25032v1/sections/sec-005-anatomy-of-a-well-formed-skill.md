---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-005-anatomy-of-a-well-formed-skill
section_title: "Anatomy of a well-formed skill"
section_number: null
pages: 5-5
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
Figure 3 shows the parts of a skill using a generic release-notes example. Inputs that the skill
reads are drawn as chips on the left, the numbered steps of the body sit inside the container, and
the artefacts the skill produces are chips on the right. The same convention serves any skill: the
container is the unit of behaviour, the chips on either side are what it consumes and produces,
and the inner boxes are the procedure the body encodes.
release-notes
$ARGUMENTS
(tag range)
changelog-style.md
(reference)
gather-prs.py
(bundled script)
CHANGELOG.md
summary
1. Resolve tag
range
2. Collect merged
PRs (gather-prs.py)
3. Group by
change type
4. Draft against
style guide
5. Write CHANGELOG
+ summary
Figure 3: Anatomy of a skill (generic example). Grey chips are inputs the skill reads, including reference
files and bundled scripts; the numbered boxes are the steps encoded in the body; green chips are the
artefacts produced. When a bundled script is executed rather than read, its source does not enter context.
The body should be short and oriented to the task it serves. Assume the model already
holds general knowledge, and add only what it does not have: project conventions, non-obvious
procedures, specific file locations, rules that must hold. Every sentence competes for context once
the body is loaded, so remove explanations of things the model already understands.
References stay one level deep.
The body may link to reference files, but those files should
not chain onward to further files, because the model may preview a deeply linked file with a partial
read and then act on incomplete information. Link every reference file directly from SKILL.md.
For any reference file longer than about one hundred lines, place a short table of contents at the
top so the model can see the full scope even on a partial read [3].
Conventions.
Use forward slashes in all paths so they work across operating systems. Use
one term for each concept throughout the skill rather than alternating between synonyms, since
consistent wording is easier for the model to follow. Avoid time-sensitive statements that will date;
if older behaviour must be recorded, place it in a clearly marked section for legacy patterns rather
than in the main flow [3].
Degrees of freedom.
Match the level of constraint to the fragility of the task. Where several
approaches are valid and the right one depends on context, give general direction and let the
model choose. Where a sequence is fragile and must run exactly, give the precise command and
state that it must not be altered [3].
7
