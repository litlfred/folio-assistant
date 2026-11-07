---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-022-231-function-property
section_title: "Function Property"
section_number: 2.3.1
pages: 10-10
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A function property is used to link a Rule to a Party, indicating the function undertaken by the Party in respect to the Rule that
links to it. The function property itself is abstract; sub-properties represent explicit semantics of the functional role between the
Party and the Rule.
An ODRL validator MUST support the following sub-properties of function:
assigner: indicates the Party that is issuing the Rule. For example, the Party granting a Permission or requiring an agreed
Duty to be fulfilled.
assignee: indicates that the Party that is the recipient the of Rule. For example, the Party being granted a Permission or
required to fulfil an agreed Duty.
Additional function subtype properties MAY be defined in the ODRL Common Vocabulary [odrl-vocab] and ODRL Profiles.
Example Use Case: The Policy shows an Agreement with two Parties with the functional roles of the assigner and
the assignee. The assigner grants the assignee the play action over the target asset.
   "dc:publisher": "ABC Pictures",
   "dc:creator": "Allen, Woody",
   "dc:issued": "2017",
   "dc:subject": "Musical Comedy",
   ...
   "odrl:hasPolicy": "http://example.com/policy:1010",
   ...
}
