---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-269-intendeduse
section_title: "intendedUse"
section_number: null
pages: 149-149
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Describes what the given dataset should be used for.
Description
A free-form text that describes what the given dataset should be used for.
Some datasets are collected to be used only for particular purposes.
For example, medical data collected from a specific demography might only be applicable for training machine learning models to
make predictions for that demography. In such a case, the intendedUse field would capture this information. Similarly, if a dataset
is collected for building a facial recognition model, the intendedUse field would specify that.
Metadata
https://spdx.org/rdf/3.0.1/terms/Dataset/intendedUse
Name:
intendedUse
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Dataset/DatasetPackage
14.2.12
