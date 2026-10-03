---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-359-extraneous-text-at-the-end-of-a-license
section_title: "Extraneous text at the end of a license"
section_number: null
pages: 193-193
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
C.13.1
Purpose
To avoid a license mismatch merely because extraneous text that appears at the end of the terms of a license is different or missing.
This also avoids a mismatch if the extraneous text merely serves as a license notice example and includes a specific copyright
holder’s name.
C.13.2
Guideline
Ignore any text that occurs after the obvious end of the license and does not include substantive text of the license, for example:
text that occurs after a statement such as, “END OF TERMS AND CONDITIONS,” or an exhibit or appendix that includes an
example or instructions on to how to apply the license to your code. Do not apply this guideline or ignore text that is comprised of
additional license terms (e.g., permitted additional terms under GPL-3.0, section 7).
To implement this guideline, use the <optional> XML element tag as described in Guideline: omittable text.
C.14
