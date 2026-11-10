---
doc_id: 9789240116191-eng
doc_title: "9789240116191-eng"
section_id: page-029
section_title: "Page 29"
pages: 29-29
pdf_page: 29
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
text_source: embedded
granularity: page
---
20
Instituting data management and governance policies
GENERIC PRODUCT
identifier 0..*
status 1..1
name 1..*
 nameType 1..1
 nameValue 1..1
description 0..1
classification 0..*
unitOfUse 1..1
dosageForm 0..1
strength 0..1
routeOfAdministration 0..*
manufacturer 0..1
countryOfOrigin 0..1
shelfLife 0..1
doseQuantity 0..1
attribute 0..*
 type 1..1
 value[x] 1..1
associatedProduct 0..*
 product 1..1
 relationship 1..*
 quantity 1..1
1
0..*
1
0..*
TRADE ITEM
identifier 1..*
status 1..1
tradeItemName 0..*
 nameType 1..1
 name 1..1
description 0..1
classification 0..*
manufacturer 0..1
countryOfOrigin 1..1
shelfLife 0..1
associatedGenericProduct 0..*
 genericProduct 1..1
 quantity 1..1
contains 0..*
 tradeItem 1..1
 quantity 1..1
attribute 0..*
 type 1..1
 value[x] 1..1
REGULATED TRADE ITEM
identifier 1..*
status 1..1
jurisdiction 1..*
authorisationHolder 1..1
validityPeriod 0..1
authorisedTradeItem 1..1
attribute 0..*
 type 1..1
 value[x] 1..1
associatedProduct 0..*
 product 1..1
 relationship 1..*
 quantity 1..1
In addition to the above mapping, Fig 9 shows the 
relationship between generic products, trade items and 
regulated trade item using HL7 FHIR resource.
Fig. 9: Relationship between generic product, trade item and regulated trade item
Best practices:
•	
It is generally recommended to avoid including product 
classification or product characteristics such as dosage 
and strength in the generic national product code. 
Instead, a system-generated sequential numeric or 
alphanumeric code should be used.
•	
Product characteristics such as dosage, strength, 
pack size, and route of administration should be 
defined as attributes and linked to the product codes. 
This combination of attributes and codes facilitates 
comprehensive identification of products.
•	
Generic national product codes, including drug 
codes and medicinal product identifiers (when 
using the WHO Drug Dictionary), should be mapped 
to trade item-specific identifiers, such as GTINs, 
or similar unique identifiers where GTINs are 
not available.
	
•	
The product coding system should maintain uniform 
code lengths and ensure scalability to accommodate 
an increasing number of unique products.
•	
Product master data structures should support the 
mapping of one generic national product code to 
multiple corresponding trade items. In addition, the 
data structure should organize multiple packaging 
levels and quantity relationships across those. 
•	
Packaging hierarchies and quantity conversions 
across these levels—along with packaging variations 
among different brand items—are critical for 
countries to effectively manage supply chain 
operations such as inventory control and distribution. 
Fig. 11 illustrates packaging variations across brand 
items and how they will link to standardized generic 
product information.
