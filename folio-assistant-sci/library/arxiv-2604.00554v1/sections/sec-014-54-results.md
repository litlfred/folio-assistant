---
doc_id: arxiv-2604.00554v1
doc_title: "LLM-supported document separation for printed reviews from zbMATH Open"
section_id: sec-014-54-results
section_title: "Results"
section_number: 5.4
pages: 4-4
source_pdf: 2604.00554v1.pdf
source_sha256: cabfd76a9acea030
toc_source: outline
---
5.1
Methodology
The objective was to automate the extraction of individual docu-
ments from OCR-processed files in LaTeX.
Steps involved:
(1) For each 𝑟𝑜𝑤in the zbMATH Open table 1:
(2) Reading next row: Read the next row from the zbMATH
Open table as the 𝑛𝑒𝑥𝑡_𝑟𝑜𝑤.
(3) Reading LaTeX files: Read the 𝐿𝑎𝑇𝑒𝑋𝑐𝑜𝑛𝑡𝑒𝑛𝑡of the files
from 𝑟𝑜𝑤[Scan document id] to 𝑛𝑒𝑥𝑡_𝑟𝑜𝑤[Scan document
id] inclusive. If there is more than one file, connect the
LaTeX code sequentially.
(4) Search for the original title and title: Search for the
𝑟𝑜𝑤[Original title] in the 𝐿𝑎𝑇𝑒𝑋𝑐𝑜𝑛𝑡𝑒𝑛𝑡. If there is no
match, search for 𝑟𝑜𝑤[title]. We denote the index of the
end of the match as 𝑠𝑡𝑎𝑟𝑡.
(5) Next_row title and original title search:
Repeat the previous step for𝑛𝑒𝑥𝑡_𝑟𝑜𝑤. We denote the index
of the beginning of the match as 𝑒𝑛𝑑.
(6) Text extraction part: Extract the text between 𝑠𝑡𝑎𝑟𝑡and
𝑒𝑛𝑑from 𝐿𝑎𝑇𝑒𝑋𝑐𝑜𝑛𝑡𝑒𝑛𝑡. We denote the extracted text as
𝑡𝑒𝑥𝑡.
(7) Removing extraneous text: Remove extra parts from
𝑡𝑒𝑥𝑡.
(8) Saving extracted text:Save the 𝑡𝑒𝑥𝑡as
𝑟𝑜𝑤[Abstract/Review/Summary].
Steps 4 and 5 were necessary to find the tentative boundaries of
the searched document. In Step 7, these bounds were refined using
regular expressions. This helped to strip away superfluous elements
such as page numbers, author names, parts of the title, and other
metadata, leaving only the document’s text. The applied regular
expressions were iteratively changed to handle the next detected
algorithm or OCR system error. In the case when the document
was the last in the book, we artificially added another title to the
end of the text and applied the algorithm.
An example can be seen in Figure 2.
