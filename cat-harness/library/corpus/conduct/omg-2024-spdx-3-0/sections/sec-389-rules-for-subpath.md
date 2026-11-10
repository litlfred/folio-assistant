---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-389-rules-for-subpath
section_title: "Rules for subpath"
section_number: null
pages: 200-200
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
• The subpath string is prefixed by a # separator when not empty.
• This # is not part of the subpath.
• The subpath contains zero or more segments, separated by slash /.
• Leading and trailing slashes / are not significant and should be stripped in the canonical form.
• Each subpath segment must be a percent-encoded string.
• When percent-decoded, a segment must not contain a /, must not be any of .. or ., and must not be empty.
• The subpath must be interpreted as relative to the root of the package.
E.5
