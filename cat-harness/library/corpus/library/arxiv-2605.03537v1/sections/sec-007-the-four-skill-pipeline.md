---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-007-the-four-skill-pipeline
section_title: "The Four-Skill Pipeline"
section_number: null
pages: 3-4
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
The system implements a sequential pipeline in which the out-
put of each skill serves as input to the next (Figure 1).
Title + Abstract
+ Table of Contents
Skill 1
Conceptual
Analysis
Skill 2
Quantitative
Filtering
Skill 3
Authority
Validation
Skill 4
MARC 6xx
Synthesis
MARC 6xx Fields
(650, 600, 655, . . . )
concept list
candidate headings
validated headings
Wilson, Langridge,
Joudrey–Taylor
SHM H 80, H 180
20% Rule, Rule of 3
LCSH / LCGFT index
LCNAF API
H 1075, H 830
J 105, J 110
Figure 1: The four-skill sequential pipeline. Each skill receives
the output of the previous stage. Left annotations indicate the
primary knowledge sources; right annotations show intermedi-
ate data products.
Skill 1: Conceptual Analysis. Receives the title, abstract,
and table of contents of a work. Applies Wilson’s four meth-
ods of subject determination (purposive, figure-ground, objec-
tive, cohesion) and Langridge’s three questions (“What is it?”,
“What is it about?”, “What is it for?”) to produce an exhaustive
list of potentially significant concepts. The skill intentionally
over-generates at this stage—filtering is deferred to Skill 2. The
output is an aboutness statement and a flat list of candidate
concepts with brief justifications.
Skill 2: Quantitative Filtering. Receives the concept list
from Skill 1 and applies the quantitative rules codified in SHM
H 180. The key decision points are:
• 20% Rule (H 180 §E): A topic must comprise approximately
20% or more of the work to warrant a subject heading, with
exceptions for named entities critical to the work.
• Rule of Three (H 180 §I): When four or more subtopics of a
broader subject are present, assign only the broader heading.
• Specificity (H 180 §G): Headings should be as specific as
the content warrants.
• Depth of indexing (H 180 §H): Do not assign both a heading
and a broader heading that subsumes it unless each captures
a distinct facet.
• Ordering by predominance (H 80): The first heading as-
signed should represent the primary focus of the work.
The skill also applies the 2026 LC policy change on
genre/form: rather than assigning form subdivisions ($v) within
650 fields, form concepts are routed to LCGFT 655 fields. The
output is an ordered list of candidate headings with their in-
tended MARC field type (600, 610, 650, 651, or 655).
3
Table 1: Library of Congress policy documents used in skill construction.
Document
Title / Scope
Primary Skill(s)
H 80
Heading ordering by predominance
Quantitative Filtering
H 180
Assigning and constructing subject headings
Conceptual Analysis, Quant.
Filtering
H 405
Establishing entities in name vs. subject authority
Authority Validation, MARC
Synthesis
H 430
Name headings as subjects
Authority Validation
H 830
Geographic subdivision (indirect method)
Authority Validation, MARC
Synthesis
H 860
Subdivisions further subdivided by place
MARC Synthesis
H 1075
Subdivisions: types, order, construction
MARC Synthesis
J 105
MARC coding of LC genre/form terms
MARC Synthesis
J 107
MARC authority records for genre/form terms
Authority Validation
J 110
Assigning genre/form terms (LCGFT)
Quant. Filtering, MARC Synthesis
LC memo
Expand use of LCGFT and implement LCSH cataloging
simplification (Jan. 5, 2026)
All skills
Skill 3: Authority Validation. Receives the candidate head-
ings and validates each against the appropriate LC authority
file. The skill employs two lookup methods:
• Subjects (LCSH) and Genre/Forms (LCGFT): A local TF-
IDF index built from NDJSON authority files downloaded
from id.loc.gov. The subject index covers approximately
1.01 million authorized headings; the genre/form index cov-
ers approximately 8,600 terms.
• Names (LCNAF): The LC Linked Data Service suggest2
API, queried in real time. This avoids downloading the
44 GB LCNAF authority file while providing access to over
12 million name authority records.
The skill checks whether each candidate heading exists as
an authorized form, suggests the authorized form when a vari-
ant is detected (via UF references), and verifies geographic
subdivision authorization per H 830.
Skill 4: MARC 6xx Synthesis. Receives the validated
headings and constructs properly formatted MARC 21 subject
access fields. The skill implements the subdivision order pre-
scribed in H 1075 ($a →$z →$x →$y), applies the indirect
geographic subdivision method (H 830), and enforces the 2026
discontinuation of $v form subdivisions. For name headings
(600, 610, 611), the skill applies H 405 rules for authority file
determination and H 430 validation criteria.
2.3
