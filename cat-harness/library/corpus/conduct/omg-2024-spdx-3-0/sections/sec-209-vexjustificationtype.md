---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-209-vexjustificationtype
section_title: "VexJustificationType"
section_number: null
pages: 116-117
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies the VEX justification type.
Description
VexJustificationType specifies the type of Vulnerability Exploitability eXchange (VEX) justification.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/VexJustificationType
Name:
VexJustificationType
Entries
componentNotPresent The software is not affected because the vulnerable component is not in the product.
inlineMitigationsAlreadyExist Built-in inline controls or mitigations prevent an adversary from leveraging the vulnerability.
vulnerableCodeCannotBeControlledByAdversary The vulnerable component is present, and the component contains the vul-
nerable code. However, vulnerable code is used in such a way that an attacker cannot mount any anticipated attack.
vulnerableCodeNotInExecutePath The affected code is not reachable through the execution of the code, including non-
anticipated states of the product.
vulnerableCodeNotPresent The product is not affected because the code underlying the vulnerability is not present in the product.
104
System Package Data Exchange (SPDX©) v3.0
11
