---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-286-domain
section_title: "domain"
section_number: null
pages: 157-158
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Captures the domain in which the AI package can be used.
Description
A free-form text that describes the domain where the AI model contained in the AI software can be expected to operate successfully.
Examples include computer vision, natural language processing, etc.
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/domain
Name:
domain
Nature:
DataProperty
Range:
xsd:string
Referenced
• /AI/AIPackage
15.2.3
energyConsumption
Summary
Indicates the amount of energy consumption incurred by an AI model.
Description
Captures the energy consumption of an AI model, either known or estimated.
In the absence of direct measurements, an SPDX data creator may choose to estimate the energy consumption based on information
about computational resources (e.g., number of floating-point operations), training time, and other relevant training details.
System Package Data Exchange (SPDX©) v3.0
145
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/energyConsumption
Name:
energyConsumption
Nature:
ObjectProperty
Range:
EnergyConsumption
Referenced
• /AI/AIPackage
15.2.4
energyQuantity
Summary
Represents the energy quantity.
Description
Provides the quantity information of the energy.
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/energyQuantity
Name:
energyQuantity
Nature:
DataProperty
Range:
xsd:decimal
Referenced
• /AI/EnergyConsumptionDescription
15.2.5
energyUnit
Summary
Specifies the unit in which energy is measured.
Description
Provides the unit information of the energy.
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/energyUnit
Name:
energyUnit
Nature:
ObjectProperty
Range:
EnergyUnitType
Referenced
• /AI/EnergyConsumptionDescription
15.2.6
