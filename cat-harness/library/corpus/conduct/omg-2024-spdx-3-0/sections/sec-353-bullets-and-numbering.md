---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-353-bullets-and-numbering
section_title: "Bullets and numbering"
section_number: null
pages: 192-192
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
C.8.1
Purpose
To avoid the possibility of a non-match due to the otherwise same license using bullets instead of numbers, number instead of letter,
or no bullets instead of bullet, etc., for a list of clauses.
C.8.2
Guideline
Where a line starts with a bullet, number, letter, or some form of a list item (determined where list item is followed by a space, then
the text of the sentence), ignore the list item for matching purposes.
The following XML tag is used to implement this guideline: <bullet>
For example: <bullet>1.0</bullet>
C.9
