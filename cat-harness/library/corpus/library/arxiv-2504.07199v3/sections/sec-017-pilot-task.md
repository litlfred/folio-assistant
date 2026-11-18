---
doc_id: arxiv-2504.07199v3
doc_title: "Tagging for a National Technical Library’s Open-Access Catalog"
section_id: sec-017-pilot-task
section_title: "Pilot Task"
section_number: null
pages: 14-14
source_pdf: 2504.07199v3.pdf
source_sha256: a6c42fa7f3f5183f
toc_source: outline
---
At TIB, ANNIF has been used in production code
since the start of 2024 for the use case of assign-
ing items from the TIB portal discovery system to
one or several subject facets. The TIB portal em-
ploys a multi-stage algorithm to attribute a record
to one of the 28 TIB’s different subjects, viz. Ar-
chitecture, Civil Engineering, Biochemistry, Biol-
ogy, Chemistry, Chemical Engineering, Electrical
Engineering, Energy Technology, Educational Sci-
ence, Earth Sciences, History, Information Technol-
ogy, Literary Studies and Linguistics, Mechanical
Engineering, Mathematics, Medical Technology,
Plant Sciences, Philosophy, Physics, Law, Study of
Religions, Social Sciences, Sports Sciences, The-
ology, Environmental Engineering, Traffic Engi-
neering, Materials Science, and Economics, the
last of which is the so-called automatic stage. If
no more salient information is available, machine
learning methods are used to assign the subject(s).
Note, the subjects reference here can be seen di-
rectly akin to fields of study or scientific disciplines,
whereas LLMs4Subjects includes a much broader
scope for its subjects. Previously utilizing a com-
mercial algorithm, TIB switched to ANNIF for
its customization potential and community-driven
improvements. The training data of ANNIF al-
gorithms consists of document metadata from the
TIB catalog, partially overlapping with the training
dataset for LLMs4Subjects. Since the documents
to be indexed by ANNIF include many cases where
abstracts or fulltexts cannot be accessed program-
matically, we only consider the the titles and pub-
lishers. ANNIF has shown good overall results
in assigning the 14 subjects is has so far been in-
crementally trained on, with an overall F1 score
of ≈0.65 for several algorithms. Both English
and German-language documents were considered,
with little difference in performance when training
both languages combined or separately. Leverag-
ing the capabilities of LLMs as a complementary
approach to ANNIF marks a logical next step in
the automation of subject indexing.
14
