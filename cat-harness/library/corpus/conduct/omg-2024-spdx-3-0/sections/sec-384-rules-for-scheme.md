---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-384-rules-for-scheme
section_title: "Rules for scheme"
section_number: null
pages: 199-199
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
• The scheme is a constant with the value “pkg”
• Since a purl never contains a URL Authority, its scheme must not be suffixed with double slash as in pkg:// and should
use instead pkg:.
• purl parsers must accept URLs such as ‘pkg://’ and must ignore the ‘//’.
• purl builders must not create invalid URLs with such double slash ‘//’.
• The scheme is followed by a ‘:’ separator.
• For example, the two purls pkg:gem/ruby-advisory-db-check@0.12.4 and pkg://gem/ruby-advisory-db-chec
are strictly equivalent. The first is in canonical form while the second is an acceptable purl but is an invalid URI/URL per
RFC3986.
E.4.2
