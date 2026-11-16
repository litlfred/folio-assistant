---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-343-guideline-omittable-text
section_title: "Guideline: omittable text"
section_number: null
pages: 191-191
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Some licenses have text that can simply be ignored. The intent here is to avoid the inclusion of certain text that is superfluous or
irrelevant in regards to the substantive license text resulting in a non-match where the license is otherwise an exact match (e.g.,
directions on how to apply the license or other similar exhibits). In these cases, there should be a positive license match.
The license should be considered a match if the text indicated is present and matches OR the text indicated is missing altogether.
The following XML tag is used to implement this guideline: <optional>
For example: <optional>Apache License Version 2.0, January 2004 http://www.apache.org/licenses/<
Omittable text appears on the SPDX License List webpage in blue text.
C.4
