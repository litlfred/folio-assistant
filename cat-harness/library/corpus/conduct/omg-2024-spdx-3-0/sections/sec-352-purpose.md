---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-352-purpose
section_title: "Purpose"
section_number: null
pages: 192-192
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
To avoid the possibility of a non-match due to the existence or absence of code comment indicators placed within the license text,
e.g., at the start of each line of text, or repetitive characters to establish a separation of text, e.g., ---, ===, ___, or ***.
C.7.2
Guideline
Any kind of code comment indicator or prefix which occurs at the beginning of each line in a matchable section should be ignored
for matching purposes.
XML files do not require specific markup to implement this guideline.
C.7.3
Guideline
A non-letter character repeated 3 or more times to establish a visual separation should be ignored for matching purposes.
XML files do not require specific markup to implement this guideline.
C.8
