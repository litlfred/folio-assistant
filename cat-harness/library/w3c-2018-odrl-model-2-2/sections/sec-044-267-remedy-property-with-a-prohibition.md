---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-044-267-remedy-property-with-a-prohibition
section_title: "Remedy property with a Prohibition"
section_number: 2.6.7
pages: 24-24
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The remedy property expresses an agreed Duty that MUST be fulfilled in case that a Prohibition has been infringed by being
exercised. If the Prohibition action is exercised, then all remedy Duties MUST be fulfilled to address the infringement of the
Prohibition and set it to the state not infringed. The remedy property is a sub-property of the failure property.
A remedy MUST NOT refer to a Duty that includes a consequence Duty.
Example Use Case: The below Agreement between assigner http://example.com/person:88 and assignee
http://example.com/org:99 prohibits the assignee to index the Asset http://example.com/data:77. If the
assignee does actually index the target asset, then the remedy will be that they MUST anonymize the target asset
http://example.com/data:77.
