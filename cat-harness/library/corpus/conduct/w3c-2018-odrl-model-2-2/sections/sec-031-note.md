---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-031-note
section_title: "NOTE"
section_number: null
pages: 15-16
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
When using a logical operand that needs to be evaluated in sequence, such as andSequence, the serialisations MUST
preserve the order of the members of the list. In JSON-LD, the @list keyword MUST be used to represent an ordered
collection.
An Rule (such as a Permission, Prohibition, or Duty) MAY include the constraint property to indicate a condition on the Rule.
To meet this condition, all of the the Constraints/Logical Constraints referenced by the constraint property MUST be satisfied.
Example Use Case: In the Policy Offer example below, the permission allows the target asset to be distributed,
and includes a constraint of a dateTime condition that the permission can only be exercised until 2018-01-01.
