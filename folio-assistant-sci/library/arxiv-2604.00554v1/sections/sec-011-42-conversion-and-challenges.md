---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-011-42-conversion-and-challenges
section_title: "Conversion and challenges"
section_number: 4.2
pages: 4-4
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Conversion and challenges
To facilitate the conversion process, we utilized the Mathpix API,
an interface that allows the submission of images and the retrieval
of the corresponding LaTeX code. Our dataset comprised 254,444
images in .tiff format, representing scanned pages from zbMATH
Open volumes.
Approximately 0.88% (2,235 images) of the total submissions
resulted in API errors. These errors were primarily due to the
inability of the OCR system to recognize image content (1,408
cases). Upon errors analysis, we found that we submitted blank
sheets of paper as input. In the remaining 827 cases (approximately
0.33% of all images), Mathpix failed to process the submitted scans.
Thus, we received the data necessary for further work, saving each
converted scan into a separate .json file - 252,209 in total.
4.3
OCR errors
OCR systems, while advanced, are not perfect. Converting scanned
documents with mathematical content into LaTeX format can lead
to various errors. Understanding them was important for develop-
ing the next steps of this research. This section describes common
types of errors.
• OCR systems may incorrectly interpret characters, espe-
cially those that are visually similar. For example, ’0’ (zero)
may be recognized as ’O’ (capital letter O), or umlauted
characters (e.g., ’ä’, ’ö’, ’ü’) may be confused with their non-
umlauted counterparts (’a’, ’o’, ’u’), or " can be mistaken for
66.
• OCR output may contain inconsistent line breaks and spac-
ing. For example, the end of a line in the scanned image
might not appear in the LaTeX code. There may also be
cases of double space in the LaTeX code.
• The OCR output may include unnecessary LaTeX tags and
symbols. As an example, writing "A title of the article" as
"~A ~t i t l e ~o f ~t h e ~a r t i c l e ~".
• The OCR system may skip some characters and entire
words.
The presence of such errors, which are quite common, leads
to the complication of further work. Especially when it comes to
approaches based on regular expressions.
