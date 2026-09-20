---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-001-skills-as-software-artefacts
section_title: "Skills as software artefacts"
section_number: null
pages: 2-3
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
The introduction set out the grounds for treating a skill as a software artefact: ordinary files that
can be versioned, an interface and an implementation, composition with other units, and the ways
it can fail. Many of the disciplines that apply to ordinary software therefore apply to skills, some
directly and some in a modified form, and this note treats authoring as a design activity.
Several principles transfer, though each for a reason specific to how skills work rather than
by analogy alone. A skill should have a single responsibility, one coherent capability, because
the description that advertises it is matched against a task: a skill scoped to one class of task is
selected more reliably, while one that does several things has a diffuse description that matches
less well. The separation of interface from implementation is built into the format. The metadata
that advertises a skill, its name and description, is the only part the selector reads, and the body
is loaded only after selection, so the separation of interface and implementation is one of timing
as well as principle. Cohesion applies in its usual sense: a skill, and each reference file within it,
groups content that serves a single concern, which keeps each unit focused and, for a skill, sharpens
the description that selects it. Coupling applies between skills: a skill that relies on the internal
behaviour or output format of another skill, or on a shared resource, is coupled to it, so that a
change to one can break the other. Such dependencies are kept few and made explicit, shown as
composition and a use relation in Figure 1, which is low coupling in the usual sense of limiting
how far a change propagates. The context window is a shared resource with a fixed budget, so a
skill is written to spend tokens only where they earn their place, which is resource economy under
a hard limit. The name is part of the metadata the selector matches, so a consistent, descriptive
name aids selection as well as readability.
Testing transfers only in a qualified form, and it is worth being exact about why. A skill cannot
be unit-tested the way a function can, because it has no behaviour in isolation: it is inert text
until a model reads it, so what is exercised is the model together with the skill on a task, which is
integration rather than unit testing. The result is non-deterministic, so a skill is judged by a pass
rate over several runs rather than a single pass or fail, and most outputs have no exact expected
value, so the check is a rubric or a judge rather than an equality assertion. This is behavioural
2
evaluation, closer to evaluating a machine-learning component than to deterministic testing, and
Section 9 sets out the process. The exception is a bundled script, which is ordinary code and is
unit-tested in the ordinary way.
Figure 1 draws a skill in UML class style. The top compartment holds the skill name. The
interface compartment is the description, the contract a caller reads to decide whether to use the
skill. The implementation compartment is the body together with the bundled files. Composition
links the skill to the resources it bundles, and a dependency links it to the external tools or other
skills it calls.
«skill»
release-notes
interface (description)
what it does and when to use it:
“drafts release notes from merged
pull requests; use when cutting a
release or updating a changelog”
implementation
SKILL.md body: ordered steps
bundled: changelog-style.md,
gather-prs.py
bundled resources
changelog-style.md
gather-prs.py
external tool / other
skill
a code host
(via MCP), or a called skill
composition
«uses»
Figure 1: A skill drawn in UML class style. The name, interface, and implementation map onto the skill
name, the description, and the body with its bundled files. The notation captures structure only: a skill is
module-like with a static form, and the model selects it by matching its description, where a method call is
dispatched deterministically on its signature.
The comparison is a guide to structure. A skill is module-like in behaviour: a single static
unit, like a class that holds only static members, and each skill is independent of the others.
Its invocation is probabilistic: the model selects a skill at runtime by matching its description,
while a method call is dispatched deterministically on its signature. The static form and the
description-based selection are what an author should keep in mind when reading the diagram.
That last difference is the strongest reason to take the design seriously. In conventional code a
type checker and a linker catch a mis-wired call before it runs. A skill has no such guarantee: a
poorly named or poorly scoped skill fails quietly, either by not being selected or by being selected
and then ignored. The contract and the evaluations, that is the description and the behavioural
tests, carry the weight that a type system would otherwise carry. Clear interfaces, low coupling,
and executable evaluations matter more here than in code a compiler can check.
Where a skill governs a task, the agent’s behaviour on that task turns substantially on the
quality of the skill. A skill that is selected reliably and followed faithfully raises the floor on the
agent’s behaviour for that task; one that is not lowers it, often without a visible error. Skill quality
is therefore a determinant of system behaviour, which is the reason to architect skills with the
care given to the modules of a conventional system. The rest of this note sets out that structure
in detail.
3
