---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-009-primenumbertheoremand
section_title: "PrimeNumberTheoremAnd"
section_number: null
pages: 6-6
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
PrimeNumberTheoremAnd [13] is a large community-driven project aiming to formalize the prime number
theorem and related results in analytic number theory in Lean. It is the first external project to adopt
LeanArchitect as its primary blueprint infrastructure. The project began in 2023 and was migrated to
LeanArchitect in January 2026.
Prior to migration, PrimeNumberTheoremAnd used a custom tool (leanblueprint-extract) that embedded
blueprint information as specially formatted comments inside Lean files and extracted them into LATEX for
blueprint generation. This workflow enabled co-locating formal code and informal exposition, but required
manual maintenance of metadata such as \leanok and \uses. (The design of LeanArchitect, in particular the
\inputleanmodule mechanism, was inspired by this approach.)
Migration to LeanArchitect required only surface-level syntactic changes, primarily replacing custom com-
ments with @[blueprint] attributes and blueprint_comment commands.3 The initial conversion took approxi-
mately one day of work by us. After conversion, blueprint metadata—including \lean, \leanok, \uses, and
\mathlibok—is now inferred automatically from Lean, eliminating a significant source of duplication and
reducing maintenance overhead.
A minor source of disruption was that existing pull requests had to be manually updated by their authors to
conform to the new annotation format. From the project maintainer’s perspective, the impact was immediately
positive. In particular, the automatic coloring of nodes and management of \leanok tags substantially improved
the usability of the blueprint as a progress-tracking and coordination tool. As Terence Tao commented
publicly on Zulip:4
The auto-coloring of the blueprint and management of the \leanok tags is very pleasant from the project
maintainer side of things!
Another advantage of LeanArchitect is dependency debugging. Tao observed that although the statement of a
lemma (Erdős 392) was syntactically correct, its statement was semantically incorrect, as its AI-generated
proof did not depend on surrounding lemmas. This problem was surfaced by the visualization of dependency
relations automatically inferred by LeanArchitect.
Overall, this case study demonstrates that LeanArchitect can be adopted in an active, large-scale project,
preserve existing authoring workflows, and improve synchronization and maintainability of blueprint metadata
with small migration cost.
4.2
