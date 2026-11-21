---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-159-packageurl
section_title: "packageUrl"
section_number: null
pages: 83-84
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provides a place for the SPDX data creator to record the package URL string (in accordance with the Package URL specification)
for a software Package.
Description
A package URL (commonly pronounced and referred to as “purl”) is an attempt to standardize package representations in order
to reliably identify and locate software packages. A packageUrl is a URL string which represents a package in a mostly universal
and uniform way across programming languages, package managers, packaging conventions, tools, APIs and databases.
A packageUrl is composed of seven components:
scheme:type/namespace/name@version?qualifiers#subpath
The definition for each component can be found in the corresponding Annex56 of this specification. Known type definitions can
be found in the Package URL type definitions57.
56../../../annexes/pkg-url-specification.md
57https://github.com/package-url/purl-spec/blob/b33dda1cf4515efa8eabbbe8e9b140950805f845/PURL-TYPES.rst
System Package Data Exchange (SPDX©) v3.0
71
Components are designed such that they form a hierarchy from the most significant on the left to the least significant components
on the right.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/packageUrl
Name:
packageUrl
Nature:
DataProperty
Range:
xsd:anyURI
Referenced
• /Software/Package
9.2.13
