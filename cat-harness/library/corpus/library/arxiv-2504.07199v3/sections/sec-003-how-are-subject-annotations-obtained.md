---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-003-how-are-subject-annotations-obtained
section_title: "How are subject annotations obtained?"
section_number: null
pages: 2-3
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
Subject annotations in the TIB catalog are
continuously created by a dedicated team of
1https://www.dnb.de/EN/gnd
2The
GND
is
available
for
download
at
https:
//www.dnb.de/EN/Professionell/Metadatendienste/
Datenbezug/Gesamtabzuege/gesamtabzuege_node.html.
3https://pypi.org/project/langdetect/
4Reflecting the real-world nature of the corpus, many
records contain mixed-language content and are not reliably
classifiable under a single language.
2
statistics
lang
Article
Book
Conference
Report
Thesis
num. records
en
1,042/253
26,966/17,669
3,619/2,840
1,275/896
3,452/2,506
de
6/5
33,401/12,528
2,210/717
1,507/761
8,459/3,727
num. subjects
(avg, max)
en
(3/4, 7/6)
(3/3, 39/26)
(3/3, 14/16)
(3/3, 12/13)
(4/4, 20/19)
de
(3/3, 8/7)
(3/3, 27/25)
(3/4, 17/16)
(3/3, 15/15)
(4/4, 20/19)
Table 1: Train dataset statistics (all-subjects/tib-core collections) for the LLMs4Subjects shared task.
17 expert subject specialists covering 28 disci-
plines—including Architecture, Chemistry, Electri-
cal Engineering, Mathematics, Traffic Engineering,
and others—ensuring broad and expert-driven sub-
ject classification.
In libraries, content is typically described using
controlled vocabularies. In Germany, the GND is
used for cataloging literature. In addition to de-
scriptive cataloging (e.g., author, title, year, pub-
lisher), subject cataloging is performed by subject
librarians. Based on the title, abstract, and full text,
librarians assign appropriate GND keywords to de-
scribe the content as precisely as possible. This
collaborative work is carried out across various
libraries and national library networks.
With TIB adding around 15,000 new titles each
month, subject cataloging is a labor-intensive
task. Integrating AI-driven solutions—especially
LLMs—can significantly boost efficiency, partially
automate workflows, and improve usability, all
while maintaining cataloging quality. Such innova-
tions are key to modernizing information manage-
ment and supporting research at scale.
4
