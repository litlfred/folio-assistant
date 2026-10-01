---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-059-d-changes-from-previous-versions
section_title: "D. Changes from Previous Versions"
section_number: null
pages: 33-34
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
Changes from the First Public Working Draft 21 July 2016:
Added abstract Rule class to the Information Model (Issue#24)
Clarified Permission cardinality (Issue#17)
Clarified Duty obligations (Issue#18)
Clarified Duty only applicable to Permission (Issue#19)
Clarified conflict of Permissions/Prohibitions may arise also within the same policy (Issue#20)
Clarified Party definition and its relation with role (Issue#23)
Additional description on the purpose and use of ODRL Profiles.(Issue#49)
Modified UML model to have Inheritance as separate association class.(Issue#51)
Added example use cases through-out the Model sections and have removed the Scenarios sections (as they are covered in
the examples).(Issue#50)
Updated the Scope for Parties (and new for Assets) to allow any URI to scope the characteristics of the entity. (Issue#59)
Added rightOperandReference to Constraint. (Issue#56)
Clarified Constraint related definitions. (Issue#81)
Support multiple Assets, Parties, and Actions. (Issue#73)
Support Policy-level Assets, Parties, and Actions. (Issue#82)
Clarified and simplified Policy Inheritance.(Issue#22)
Added Policy Provenance section. (Issue#48)
Added Extended Relations to Constraints. (Issue#63)
Added Constraint on Constraint support. (Issue#62)
Changes from the Working Draft 23 February 2017:
Removed inheritRelation attribute. (Issue#22)
Replaced URI with IRI for I18N (Issue#133)
Updated Information Model to be based on Class/Property concepts and removed UML requirements. (Issue#128)
Removed the type property and replaced with subclasses of Policy. Added Set/Offer/Agreement to the IM. Set is now
default for Policy. (Issue#154)
Removed (deprecated) the Undefined Actions section. (Issue#139)
Removed Scopes and replaced with Constraints on Asset and Party. (Issue#183)
More clearly defined the scope of ODRL Profiles (addition only) and added how to create them. (Issue#173)
Added use and transfer as the top-level actions (Issue#140)
Added hasPolicy property (Issue#184)
Added includedIn and implies properties for Action. Added partOf property for Asset and Party (Issue#160)
Added assignerOf/assigneeOf properties (Issue#190)
Added source property for Asset/PartyColection (Issue#164)
Removed inheritAllowed property and support multiple inheritance (Issue#204)
Updated constraint Model to support Logical Constraints with typed operands (Issue#206)
Added support for Duty at Policy-level using new obligation property (Issue#191)
Added Consequence, Remedy, and Failure properties (Issue#209)
Added mandatory use of ODRL Profiles (Issue#210)
Added Refinement property (Issue#211)
Changes from the Candidate Recommendation 26 September 2017:
Added explanation on satisfying duties that have triggered a consequence (Issue#267) (Issue#275)
Added missing uid property for Constraint/Logical Constraint (Issue#278)
Clarified the assignee party for Duties (Issue#269)
Clarified the processing rules for conflicting Rules (Issue#270)
Added disjoint class rules for Policy subclasses (Issue#271)
Clarified use of ODRL Core Profile URI (Issue#272)
Clarified disjoint Policies and Rules. (Issue#280)
Added version "2.2" to the document title to make it clear the provenance of the specification. (Issue#283)
Clarified refinement property satisfaction (Issue#282)
Changes from the Proposed Recommendation 04 January 2018:
No significant changes.
