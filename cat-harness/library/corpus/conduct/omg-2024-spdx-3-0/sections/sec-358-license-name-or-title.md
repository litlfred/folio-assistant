---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-358-license-name-or-title
section_title: "License name or title"
section_number: null
pages: 193-193
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
C.12.1
Purpose
To avoid a license mismatch merely because the name or title of the license is different than how the license is usually referred to
or different than the SPDX full name. This also avoids a mismatch if the title or name of the license is simply not included.
C.12.2
Guideline
Ignore the license name or title for matching purposes, so long as what ignored is the title only and there is no additional substantive
text added here.
The following XML tag is used to implement this guideline: <titleText>
For example: <titleText>Attribution Assurance License</titleText>
C.13
