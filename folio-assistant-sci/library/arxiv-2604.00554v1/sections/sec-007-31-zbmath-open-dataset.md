---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-007-31-zbmath-open-dataset
section_title: "zbMATH Open dataset"
section_number: 3.1
pages: 3-3
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
zbMATH Open dataset
The primary dataset consists of 478 distinct scanned books, encom-
passing texts in English, German, French, and Italian. The books
are divided into pages, each in a separate file, in total 254,444 pages.
We also used the following information about 813,005 documents
from these books (e.g., Table 1):
• Scan Document ID: A unique identifier linking each entry
to a specific page.
• zbMATH Internal ID: A unique identifier for each docu-
ment.
• Title: The title of the document, which may be translated.
• Original Title: Recorded if the Title is a translation.
• Source: The venue of publication.
Table 1: Sample of the data from the zbMATH Open.
Scan_document_id
zbMATH_internal_id
Title
Original_title
Source
001/005
3000000
Methods of
mathematical
physics.
Vol. 1.
2nd ext. ed.
Methoden der
mathematischen
Physik. Bd. I.
2. verb. Aufl
Die Grundlehren der
mathematischen
Wissenschaften in
Einzeldarstellungen
mit besonderer
Berücksichtigung der
Anwendungsgeb.
12. Berlin: Julius
Springer. XIV, 469
S. u. 26 Abb.
(1931).
001/005
3000001
On the
construction of
arithmetics
Über den
Aufbau der
Arithmetik
Jahresber. Dtsch.
Math.-Ver. 40,
22-37 (1931).
001/006
3000002
Remarks on a
determinant
theorem
by Minkowski
Bemerkungen zu
einem
Determinantensatz
von Minkowski
Jahresber. Dtsch.
Math.-Ver. 40,
49-53 (1931).
To evaluate different document splitting approaches, we pre-
pared a train dataset of 1000 random manually collected samples as
well as a test dataset of 478 random documents (one per volume).
