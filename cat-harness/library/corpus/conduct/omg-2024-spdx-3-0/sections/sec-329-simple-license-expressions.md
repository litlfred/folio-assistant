---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-329-simple-license-expressions
section_title: "Simple license expressions"
section_number: null
pages: 186-186
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
A simple <license-expression> is composed one of the following:
• An SPDX License List Short Form Identifier. For example: CDDL-1.0
• An SPDX License List Short Form Identifier with a unary “+” operator suffix to represent the current version of the license
or any later version. For example: CDDL-1.0+
• An SPDX user defined license reference: [“DocumentRef-”1*(idstring)“:”]“LicenseRef-”1*(idstring)
Some examples:
LicenseRef-23
LicenseRef-MIT-Style-1
DocumentRef-spdx-tool-1.2:LicenseRef-MIT-Style-2
The current set of valid license identifiers can be found in spdx.org/licenses4.
B.4
