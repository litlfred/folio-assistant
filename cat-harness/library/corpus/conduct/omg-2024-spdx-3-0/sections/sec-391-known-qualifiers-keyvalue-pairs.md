---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-391-known-qualifiers-keyvalue-pairs
section_title: "Known qualifiers key/value pairs"
section_number: null
pages: 200-201
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Qualifiers should be limited to the bare minimum for proper package identification, to ensure that a purl stays compact and readable
in most cases. Separate external attributes stored outside of a purl are the preferred mechanism to convey extra long and optional
information. API, database or web form.
The following keys are valid for use in all package types:
• repository_url is an extra URL for an alternative, non-default package repository or registry. The default repository
or registry of each type is documented in the “Known types” section.
188
System Package Data Exchange (SPDX©) v3.0
• download_url is an extra URL for a direct package web download URL.
• vcs_url is an extra URL for a package version control system URL.
• file_name is an extra file name of a package archive.
• checksum is a qualifier for one or more checksums stored as a comma-separated list. Each item in the list is in form of
algorithm:hex_value (all lowercase), such as sha1:ad9503c3e994a4f611a4892f2e67ac82df727086.
E.7
