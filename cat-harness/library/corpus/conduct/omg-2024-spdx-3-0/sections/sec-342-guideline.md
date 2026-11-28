---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-342-guideline
section_title: "Guideline"
section_number: null
pages: 191-191
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
• match - a POSIX extended regular expression (ERE) to match the replaceable text
• name - an identifier for the variable text unique to the license XML document
The original text is enclosed within the beginning and ending alt tags.
For
example:
<alt match="(?i:copyright.{0,200})." name="copyright1">Copyright The Linux
Foundation</alt>
The original replaceable text appears on the SPDX License List webpage in red text.
C.3.5
