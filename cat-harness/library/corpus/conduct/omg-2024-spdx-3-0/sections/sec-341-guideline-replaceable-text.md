---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-341-guideline-replaceable-text
section_title: "Guideline: replaceable text"
section_number: null
pages: 190-191
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Some licenses include text that refers to the specific copyright holder or author, yet the rest of the license is exactly the same. The
intent here is to avoid the inclusion of a specific name in one part of the license resulting in a non-match where the license is
otherwise an exact match to the legally substantive terms (e.g., the third clause and disclaimer in the BSD licenses, or the third,
fourth, and fifth clauses of Apache-1.1). In these cases, there should be a positive license match.
1https://spdx.org/licenses/
2https://github.com/spdx/license-list-XML/blob/v3.25.0/DOCS/license-fields.md
178
System Package Data Exchange (SPDX©) v3.0
The text indicated as such can be replaced with similar values (e.g., a different name or generic term; different date) and still be
considered a positive match. This rule also applies to text-matching in official license headers, see Guideline: official license
headers.
