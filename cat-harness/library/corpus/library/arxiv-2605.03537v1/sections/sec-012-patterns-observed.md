---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-012-patterns-observed
section_title: "Patterns Observed"
section_number: null
pages: 7-7
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
Specificity. In seven of ten cases, the agent produced head-
ings at a comparable or more specific level than the baseline
record. The most striking example is the medical virology ti-
tle (#6), where the agent assigned influenza-specific headings
while the baseline used broad disciplinary terms. In two cases
(Ford, black holes), the baseline was clearly more specific—
particularly in geographic granularity and topical subdivisions.
The Bolivia title presents a mixed picture: the agent added a
chronological subdivision ($y2006-) and a disciplinary head-
ing (Political anthropology) absent from the baseline, but the
baseline was more specific geographically (Toracari valley vs.
country level) and topically (Land tenure, which the agent
dropped).
Name Headings. The agent assigned name headings (600,
610) in four of ten titles—for biographical subjects, corporate
bodies, and individuals treated at length in case-study chapters.
The baseline records contained no 600 or 610 fields for any title,
likely reflecting differences in cataloging depth or institutional
practice.
LCGFT and the 2026 Policy. The agent consistently applied
the February 2026 LC policy change, assigning genre/form
concepts in 655 fields with LCGFT vocabulary rather than
as $v form subdivisions. The baseline records use the older
practice (e.g., Fiction appended to topical headings). This is the
single largest systematic difference and reflects genuine policy
evolution rather than agent error.
Subdivision Practice. The baseline records tend to include
more subdivisions per heading, particularly geographic. The
Bolivia title illustrates this most clearly: the baseline drills
down to the Toracari valley as a third-level geographic sub-
division, while the agent stops at the country level. Notably,
the agent did produce a chronological subdivision in its 651
heading (Bolivia$xPolitics and government$y2006-) that the
baseline record lacks, demonstrating that the pipeline can apply
period subdivisions when the temporal scope is explicit. The
persistent geographic gap suggests the synthesis skill may ben-
efit from stronger guidance on when to subdivide below the
country level—particularly for works with a clearly identified
field site or locality.
Conceptual Framing. In several cases, the agent and base-
line record identified the same concept through different autho-
rized headings: Race discrimination vs. Racism in the work-
place, Poverty vs. Rural poor, Landlord and tenant vs. Land-
lords. These differences fall within normal inter-cataloger vari-
ation.
Subject Group Coverage. The Bolivia title revealed that the
baseline record assigned headings under two parallel subject
groups (Indians of South America and Peasants), capturing
both ethnic and socioeconomic dimensions. The agent used
only one group, suggesting the conceptual analysis skill could
benefit from guidance on identifying overlapping population
groups.
4
