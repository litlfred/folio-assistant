---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-011-heading-by-heading-comparison
section_title: "Heading-by-Heading Comparison"
section_number: null
pages: 4-7
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
Table 3 presents the complete heading-by-heading comparison
for all ten paired titles. Agent-generated headings are shown in
standard MARC notation; Harvard/LC headings are shown as
they appeared in the bibliographic dataset, with subdivisions
delimited by “ – ”. Due to space constraints, abbreviated analy-
2https://github.com/choweric/
subject-indexing-skills
4
Table 2: Test corpus sampled from the Harvard Library Bibliographic Dataset.
#
Title
Author / Editor
Discipline
1
Classical and Christian ideas in English Renaissance poetry: a student’s
guide
Rivers, I. (1994)
Literary criticism
2
Trauma room two
Green, P. A. (2015)
Emergency med. /
Fiction
3
The color line and the assembly line: managing race in the Ford empire
Esch, E. D. (2018)
Labor history / Race
studies
4
Banker to the poor: micro-lending and the battle against world poverty
Yunus, M. (2003)
Economics /
Development
5
Currencies, commodities and consumption
Clements, K. W. (2013)
Economics
6
Respiratory virology and immunogenicity
Pokorski, M. (Ed.)
(2015)
Biomedical sciences
7
Artificial black holes
Volovik, G. (Ed.) (2002)
Physics
8
The hallowing of logic: the Trinitarian method of Richard Baxter’s
Methodus theologiae
Burton, S. J. G. (2012)
Theology / Hist. of
ideas
9
All joking aside: American humor and its discontents
Krefting, R. (2014)
Cultural studies /
Humor
10
Deference revisited: Andean ritual in the plurinational state
Goudsmit, I. A. (2016)
Anthropology
ses are provided for each title; full analyses are available in the
extended version of this paper.
Title 1 (Renaissance Poetry). The agent’s first heading is an
exact match. Its second heading adds a geographic subdivision
($zEngland) not present in the baseline record but defensible
given the work’s exclusive focus on England. The agent as-
signed fewer headings overall (3 vs. 6), omitting “Christian po-
etry, English,” “Renaissance,” and “Classicism.” The LCGFT
assignment (Primary sources) reflects the work’s inclusion of
source text extracts.
Title 2 (Trauma Room Two). This title exposes a funda-
mental difference in fiction cataloging. The baseline record
uses topical headings with the form subdivision “Fiction” ap-
pended (pre-2026 practice), while the agent correctly applied
the 2026 policy: topical headings without form subdivisions,
plus separate LCGFT 655 fields (Short stories, Medical fiction).
Title 3 (Color Line). The baseline record used the more spe-
cific Racism in the workplace while the agent used the broader
Race discrimination. The baseline headings localized to Michi-
gan and Port Elizabeth; the agent used country-level geography
throughout. The agent added a corporate name heading (Ford
Motor Company) and the concept Fordism, neither of which
appears in the baseline.
Title 4 (Banker to the Poor). The agent expressed the bi-
ographical dimension through a 600 name heading (Yunus,
Muhammad) and a 655 LCGFT field (Autobiographies), while
the baseline record used a form subdivision (Biography). The
baseline headings include geographic and chronological sub-
divisions; the agent’s headings are less subdivided. The agent
used Poverty where the baseline used the more specific Rural
poor.
Title 5 (Currencies, Commodities). The closest match in
the corpus. Purchasing power parity is an exact match. The
remaining three headings show minor synonym-level variation
typical of inter-cataloger disagreement.
Title 6 (Respiratory Virology). The agent and baseline di-
verge significantly in specificity. The baseline record used very
broad headings (Medicine, Immunology); the agent’s headings
are markedly more specific (Influenza vaccines, Immune re-
sponse). Per SHM H 180’s specificity principle, the agent’s
approach is arguably more consistent with LC policy.
Title 7 (Artificial Black Holes). The baseline record added
the subdivision Mathematical models to reflect the analog-
modeling focus; the agent omitted this dimension. The baseline
headings better capture the modeling dimension, while the
agent provided broader topical coverage including Superfluid-
ity.
Title
8
(Hallowing
of
Logic).
The
agent
pro-
duced a sophisticated 600 name-title construction (Baxter,
Richard. . . $tMethodus theologiæ Christianæ), absent from the
baseline record. Both include Theology – Methodology and
Trinity. The agent added Protestant Scholasticism; the baseline
included Salvation – Christianity – History of doctrines.
Title 9 (All Joking Aside). Both the agent and baseline
identified stand-up comedy as the primary subject. The agent
subdivided into Political aspects and Social aspects and as-
signed 600 fields for individual comedians (Tyler, Kondabolu).
The baseline’s Participatory theater captures a facet the agent
missed.
Title 10 (Deference Revisited). The richest comparison. The
agent now uses the subdivision Politics and government (match-
ing the baseline’s base concept) and adds a 651 geographic
heading with a chronological subdivision (Bolivia$xPolitics
and government$y2006-), correctly situating the work in the
Morales-era plurinational state period—a level of chronologi-
cal specificity absent from the baseline record. The agent also
assigned Political anthropology$zBolivia, capturing the disci-
plinary framework. However, the Toracari gap persists: the
baseline consistently subdivides to the field-site level while the
agent stops at the country level. The baseline doubles head-
5
Table 3: Agent output vs. Harvard/LC headings for all ten titles.
Agent Output
Harvard/LC Headings
Title 1: Classical and Christian Ideas in English Renaissance Poetry (Rivers, 1994)
650 #0 $aEnglish poetry$yEarly modern, 1500-1700$xHistory and
criticism.
English poetry – Early modern, 1500-1700 – History and criticism
650 #0 $aChristianity and literature$zEngland.
Christianity and literature
650 #0 $aClassical literature$xAppreciation$zEngland.
English poetry – Classical influences
655 #7 $aPrimary sources.$2lcgft
Christian poetry, English – Hist. and criticism
—
Renaissance – England
—
Classicism – England
Title 2: Trauma Room Two (Green, 2015)
650 0 $aEmergency medicine.
Trauma centers – Fiction
650 0 $aHospitals$xEmergency services.
Emergency physicians – Fiction
650 0 $aEmergency physicians.
Physicians – Fiction
650 0 $aPhysician and patient.
Short stories, American
655 7 $aShort stories.$2lcgft
Autobiographical fiction, American
655 7 $aMedical fiction.$2lcgft
—
Title 3: The Color Line and the Assembly Line (Esch, 2018)
610 20 $aFord Motor Company$xEmployees$xHistory$y20th century.
Automobile industry workers – Social conditions – 20th century
650 0 $aRace discrimination$zUnited States$xHistory$y20th century.
Racism in the workplace – Michigan – 20th century
650 0 $aRace discrimination$zBrazil$xHistory$y20th century.
Racism in the workplace – Brazil – 20th century
650 0 $aRace discrimination$zSouth Africa$xHistory$y20th century.
Racism in the workplace – South Africa – Port Elizabeth – 20th
century
650 0 $aAfrican Americans$xEmployment$xHistory$y20th century.
—
650 0 $aFordism$xHistory.
—
655 7 $aCase studies.$2lcgft
—
Title 4: Banker to the Poor (Yunus, 2003)
600 10 $aYunus, Muhammad,$d1940-
Economists – Bangladesh – Biography
610 20 $aGrameen Bank.
Banks and banking – Bangladesh
650 0 $aMicrofinance.
Microfinance – Bangladesh – History
650 0 $aPoverty.
Rural poor – Bangladesh – History
655 7 $aAutobiographies.$2lcgft
—
Title 5: Currencies, Commodities and Consumption (Clements, 2013)
650 0 $aPurchasing power parity.
Purchasing power parity
650 0 $aForeign exchange rates.
Foreign exchange
650 0 $aPrices.
Consumer price indexes
650 0 $aConsumption (Economics).
Cost and standard of living
Title 6: Respiratory Virology and Immunogenicity (Pokorski, 2015)
650 0 $aInfluenza vaccines.
Medicine
650 0 $aInfluenza.
Immunology
650 0 $aImmune response.
Vaccines
650 0 $aRespiratory infections.
Medical virology
650 0 $aInfluenza vaccines$zPoland.
—
655 7 $aEssays.$2lcgft
—
Title 7: Artificial Black Holes (Volovik, 2002)
650 #0 $aBlack holes (Astronomy)
Black holes (Astronomy) – Mathematical models
650 #0 $aGeneral relativity (Physics)
Quantum gravity – Mathematical models
650 #0 $aCondensed matter.
Condensed matter physics – Mathematics
650 #0 $aSuperfluidity.
—
655 #7 $aEssays.$2lcgft
—
Title 8: The Hallowing of Logic (Burton, 2012)
600 10 $aBaxter, Richard,$d1615-1691.$tMethodus theologiæ Christianæ.
Theology – Methodology
650 0 $aTrinity.
Trinity – History of doctrines
650 0 $aTheology$xMethodology.
Salvation – Christianity – History of doctrines
650 0 $aProtestant Scholasticism.
—
Title 9: All Joking Aside (Krefting, 2014)
650 0 $aStand-up comedy$zUnited States$xPolitical aspects.
Stand-up comedy – United States
650 0 $aStand-up comedy$zUnited States$xSocial aspects.
Comedy – History and criticism
650 0 $aAmerican wit and humor$xHistory and criticism.
Participatory theater
650 0 $aWomen comedians$zUnited States.
—
600 10 $aTyler, Robin.
—
600 10 $aKondabolu, Hari.
—
Title 10: Deference Revisited: Andean Ritual in the Plurinational State (Goudsmit, 2016)
650 #0 $aIndians of South America$zBolivia$xRites and ceremonies.
Indians of South America – Bolivia – Toracari – Government
relations
650 #0 $aIndians of South America$zBolivia$xPolitics and government.
Indians of South America – Bolivia – Toracari – Social life and
customs
650 #0 $aLandlord and tenant$zBolivia.
Peasants – Bolivia – Toracari – Government relations
650 #0 $aPolitical anthropology$zBolivia.
Peasants – Bolivia – Toracari – Social life and customs
651 #0 $aBolivia$xPolitics and government$y2006-
Landlords – Bolivia – Toracari
655 #7 $aEthnographies.$2lcgft
Land tenure – Bolivia – Toracari
6
ings across two subject groups (Indians of South America and
Peasants); the agent uses only one. The baseline includes Land
tenure, which the agent dropped in favor of the disciplinary
heading. The agent chose Rites and ceremonies (more specific)
where the baseline used Social life and customs (broader).
3.2
