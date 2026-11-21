---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-357-copyright-notice
section_title: "Copyright notice"
section_number: null
pages: 193-193
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
C.11
Copyright notice
C.11.1
Purpose
To avoid a license mismatch merely because the copyright notice (usually found above the actual license or exception text) is
different. The copyright notice is important information to be recorded elsewhere in the SPDX document, but for the purposes of
matching a license to the SPDX License List, it should be ignored because it is not part of the substantive license text.
C.11.2
Guideline
Ignore copyright notices. A copyright notice consists of the following elements, for example: “2012 Copyright, John Doe. All
rights reserved.” or “(c) 2012 John Doe.”
The following XML tag is used to implement this guideline: <copyrightText>
For example: <copyrightText>Copyright 2022 The Linux Foundation</copyrightText>
C.12
