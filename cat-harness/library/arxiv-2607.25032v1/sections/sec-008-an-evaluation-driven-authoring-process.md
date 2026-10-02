---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-008-an-evaluation-driven-authoring-process
section_title: "An evaluation-driven authoring process"
section_number: null
pages: 8-8
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
Write evaluations before writing the skill. Run the model on representative tasks without the skill
and record where it fails or lacks context. Turn those failures into a small set of test cases with
expected behaviours. Measure the baseline without the skill, then write the minimum instructions
needed to pass the tests, and iterate against them. This keeps the skill aimed at real gaps rather
than imagined ones [3].
A reliable development loop uses two instances of the model [3]. Work with one instance to
draft and refine the skill, drawing on the context that would otherwise be typed by hand. Test the
result with a fresh instance that has only the skill loaded, and observe its behaviour on real tasks:
whether it triggers when expected, follows the references, and applies the rules. Bring specific
observations back to the drafting instance and revise. The frontmatter is the first thing to check
when a skill fails to trigger, since the model selects on the name and description.
Observe how the skill is read.
If the model reads files in an order that was not expected, the
structure may be less clear than assumed. If it ignores a bundled file, that file may be unnecessary
or poorly signalled. If it returns to the same file repeatedly, that content may belong in the body.
Test with each model intended for use, since a body that suits a stronger model may need more
detail for a faster one.
10
