---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-009-patterns-and-faults
section_title: "Patterns and faults"
section_number: null
pages: 8-8
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
For multi-step tasks, give the body an explicit ordered workflow, and for fragile sequences include
a checklist the model can copy and tick off as it proceeds. Where output quality depends on
validation, build a loop: run a check, fix what it reports, run it again, and proceed only when
it passes. For batch or destructive operations, have the model write a plan to a structured file
and validate that file with a script before any change is applied, so that errors are caught before
they take effect. Where output format matters, provide a template; where style matters, provide
worked input and output examples rather than describing the style in the abstract.
Several patterns commonly cause trouble, drawn from the cited best practices and from
common experience. Offering many alternatives leaves the model to choose without grounds, so
give one default and name the exception. Windows-style backslash paths break on other systems.
Deeply nested references lead to partial reads. Assuming a package is installed fails when it is not,
so state dependencies explicitly. In bundled scripts, handle error conditions rather than failing and
leaving the model to recover, and justify every constant rather than leaving unexplained values.
11
