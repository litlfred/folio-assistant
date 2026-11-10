---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-015-52-exclusion-of-documents-from-consideration
section_title: "Exclusion of documents from consideration"
section_number: 5.2
pages: 4-5
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
Exclusion of documents from consideration
Taking into account the proposed algorithm, we took the following
step to clean the dataset before applying it. We excluded those
documents on which it would not have worked due to the absence
of certain data.
If for any page between𝑟𝑜𝑤[Scan document id] and𝑛𝑒𝑥𝑡_𝑟𝑜𝑤[Scan
document id] inclusive LaTeX representation is missing, the docu-
ment was excluded from further consideration. There were 2,028
such documents in total.
After this, 810,977 of the 813,005 documents remain. For them,
we apply the algorithm presented.
5.3
Challenges
The application of the described approach presented several chal-
lenges due to the OCR errors, the variability in document formatting
(for example, the presence or absence of a typed ID before the doc-
ument) and the possibility of writing the same formula in different
ways. Because of this, exact matches between titles from the data
table and from the LaTeX text often did not occur during the steps
4 and 5 of the algorithm. In such cases, we used regular expressions
in an attempt to eliminate typical OCR errors. After that, steps 4
and 5 of the algorithm were repeated once again. As a result, the
algorithm suggested an answer for 693,635 documents (85.5%).
LLM-supported document separation for printed reviews from zbMATH Open
Figure 2: RE-based extraction approach. Red - titles and
sources matches. Blue - text to be extracted.
To increase that number, we allowed the Levenshtein Distance
[17] between the desired title and the section of LaTeX code to
be 0.3 times the length of the title, rather than requiring an exact
match. This threshold was chosen because, at this value, the growth
in the number of documents for which the approach could produce
an answer was significantly reduced. We expected that step 7 of
the algorithm would reduce the drop in the accuracy metric caused
by this action.
5.4
Results
The algorithm returned extracted text for 786,314 out of 810,977
entries (97%). However, the described challenges led to inaccura-
cies in text extraction, complicating the process of removing extra
information except for the document itself. Further improvement
(modification of the regular expressions) of the algorithm requires
significant manual labor to analyze all errors that occur and write
rules to eliminate them.
