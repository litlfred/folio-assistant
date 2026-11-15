---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-282-properties
section_title: "Properties"
section_number: null
pages: 156-157
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Property
Type
minCount
maxCount
finetuningEnergyConsumption
EnergyConsumptionDescription
0
*
inferenceEnergyConsumption
EnergyConsumptionDescription
0
*
trainingEnergyConsumption
EnergyConsumptionDescription
0
*
All properties (informative)
Property
Type
minCount
maxCount
finetuningEnergyConsumption
EnergyConsumptionDescription
0
*
inferenceEnergyConsumption
EnergyConsumptionDescription
0
*
trainingEnergyConsumption
EnergyConsumptionDescription
0
*
15.1.3
EnergyConsumptionDescription
Summary
The class that helps note down the quantity of energy consumption and the unit used for measurement.
Description
This class is designed to store energy consumption data, including the quantity and the unit of measurement.
The energyQuantity property stores the amount of energy consumed, and the energyUnit property stores the unit used for
measurement.
For example, 0.0042 kilowatt-hour of energy will have 0.042 as a value for property energyQuantity, and "kilowattHour"
as a value for property energyUnit.
Example
{
"type": "ai_EnergyConsumptionDescription",
"ai_energyQuantity": "0.042",
"ai_energyUnit": "kilowattHour"
}
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/EnergyConsumptionDescription
Name:
EnergyConsumptionDescription
Instantiability:
Concrete
Properties
Property
Type
minCount
maxCount
energyQuantity
xsd:decimal
1
1
energyUnit
EnergyUnitType
1
1
144
System Package Data Exchange (SPDX©) v3.0
All properties (informative)
Property
Type
minCount
maxCount
