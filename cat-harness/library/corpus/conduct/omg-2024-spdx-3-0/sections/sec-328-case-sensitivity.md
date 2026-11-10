---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-328-case-sensitivity
section_title: "Case sensitivity"
section_number: null
pages: 186-186
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
License expression operators (AND, and, OR, or, WITH and with) should be matched in a case-sensitive manner, i.e., letters
must be all upper case or all lower case.
License identifiers (including license exception identifiers) used in SPDX documents or source code files should be matched in a
case-insensitive manner. In other words, MIT, Mit and mIt should all be treated as the same identifier and referring to the same
license.
However, please be aware that it is often important to match with the case of the canonical identifier on the SPDX License List3.
This is because the canonical identifier’s case is used in the URL of the license’s or exception’s entry on the List, and because the
canonical identifier is translated to a URI in RDF documents.
For user defined license identifiers, only the variable part (after LicenseRef-) is case insensitive. This means, for example,
that LicenseRef-Name and LicenseRef-name should be treated as the same identifier and considered to refer to the same
license, while licenseref-name is not a valid license identifier.
The same applies to AdditionRef- user defined identifiers.
B.3
