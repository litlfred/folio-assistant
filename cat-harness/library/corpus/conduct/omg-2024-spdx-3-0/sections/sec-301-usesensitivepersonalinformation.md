---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-301-usesensitivepersonalinformation
section_title: "useSensitivePersonalInformation"
section_number: null
pages: 164-164
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Records if sensitive personal information is used during model training or could be used during the inference.
Description
Notes if sensitive personal information is used in the training or inference of the AI models.
This might include biometric data, addresses or other data that can be used to infer a person’s identity.
Related: hasSensitivePersonalInformation in /Dataset/DatasetPackage
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/useSensitivePersonalInformation
Name:
useSensitivePersonalInformation
Nature:
ObjectProperty
Range:
/Core/PresenceType
Referenced
• /AI/AIPackage
15.3
