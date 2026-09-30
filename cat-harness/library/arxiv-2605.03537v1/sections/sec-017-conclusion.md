---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-017-conclusion
section_title: "Conclusion"
section_number: null
pages: 8-9
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
This study demonstrates that a modular agent skill pipeline can
produce LCSH subject heading assignments that are conceptu-
ally aligned with professional subject indexing practice. The
system’s strengths—specificity, named entity identification, and
adherence to current LC policy—complement its weaknesses in
subdivision completeness and synonym navigation. The agent
skill architecture offers a practical framework for encoding
complex subject indexing rules in a maintainable, auditable,
and updateable form. It is important to note that the pipeline
addresses only the subject indexing component of cataloging—
the assignment of MARC 6XX subject access fields—and does
not attempt descriptive cataloging, classification, or authority
control for names and titles. Subject indexing is, however,
widely recognized as one of the most time-consuming and
expertise-intensive parts of the cataloging workflow, making
it a high-value target for AI-assisted automation. Two practi-
cal use cases are particularly compelling. First, the pipeline
could be used to enhance existing bibliographic records that
lack subject headings or carry only minimal-level headings—a
common situation for vendor-supplied records and older cat-
alog entries that predate current SHM practice. Second, it
could help libraries efficiently process cataloging backlogs: col-
lections of newly acquired or donated materials that remain
undiscoverable to patrons because subject indexing has not yet
been performed. In both cases, the pipeline’s output would
serve as a draft for review by a subject cataloger rather than as a
final product, consistent with the human-in-the-loop workflow
advocated throughout the literature (Chow et al., 2024; Tang &
Jiang, 2025).
The most significant finding may be structural rather than
evaluative: the decomposition of subject indexing into discrete,
policy-grounded skills appears to be a viable paradigm for
applying LLMs to complex knowledge work. Each skill is
small enough to be validated against its source policy docu-
ment, yet the pipeline as a whole produces output that engages
with the full complexity of LCSH assignment. Where prior
work has shown that single-prompt LLM approaches achieve
only 26–35% alignment with human-assigned LCSH (Tang &
Jiang, 2025) and struggle with subdivision construction (Chow
et al., 2024), the modular skill approach produced output with
conceptual overlap on over half of all heading comparisons—
suggesting that explicit rule encoding substantially improves
upon reliance on internalized model knowledge alone. Future
work should expand the evaluation corpus, integrate copy cata-
loging consultation, and explore the system’s applicability to
other controlled vocabularies (MeSH, AAT, FAST).
References
Asula, M., Makke, J., Freienthal, L., Kuulmets, H.-A., &
Sirel, R. (2021). Kratt: Developing an automatic subject
indexing tool for the National Library of Estonia. Cata-
loging & Classification Quarterly, 59(8), 775–793. https:
//doi.org/10.1080/01639374.2021.1998283
Brzustowicz, R. (2023).
From ChatGPT to CatGPT: The
implications of artificial intelligence on library cataloging.
Information Technology and Libraries, 42(3).
https:
//doi.org/10.5860/ital.v42i3.16295
Chow, E. H. C., Kao, T. J., & Li, X. (2024). An experiment
with the use of ChatGPT for LCSH subject assignment on
electronic theses and dissertations. Cataloging & Classifica-
tion Quarterly, 62(5), 574–588. https://doi.org/10.
1080/01639374.2024.2394516
Harvard Library. (2022). Harvard Library bibliographic meta-
data [Data set]. Harvard Dataverse. https://doi.org/
10.7910/DVN/I8L0ZZ
Holley, R. M., & Joudrey, D. N. (2021). Aboutness and con-
ceptual analysis: A review. Cataloging & Classification
Quarterly, 59(2–3), 159–185. https://doi.org/10.
1080/01639374.2020.1856992
D’Souza, J., Sadruddin, S., Israel, H., Begoin, M., & Slawig,
D. (2025).
SemEval-2025 Task 5:
LLMs4Subjects—
LLM-based automated subject tagging for a national
technical library’s open-access catalog.
arXiv preprint
8
arXiv:2504.07199. https://arxiv.org/abs/2504.
07199
D’Souza, J., Sadruddin, S., Kähler, M., Salfinger, A., Za-
ccagna, L., Incitti, F., Snidaro, L., & Suominen, O. (2026).
An extreme multi-label text classification (XMTC) library
dataset: What if we took “Use of Practical AI in Digital
Libraries” seriously?
arXiv preprint arXiv:2603.10876.
https://arxiv.org/abs/2603.10876
Suominen, O., Inkinen, J., & Lehtinen, M. (2025). Annif
at SemEval-2025 Task 5: Traditional XMTC augmented
by LLMs. arXiv preprint arXiv:2504.19675. https://
arxiv.org/abs/2504.19675
Tang, K.-L., & Jiang, Y. (2025). Better recommendations:
Validating AI-generated subject terms through LOC Linked
Data Service. arXiv preprint arXiv:2508.00867. https:
//arxiv.org/abs/2508.00867
9
