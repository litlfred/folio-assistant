---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-008-13-terminology
section_title: "Terminology"
section_number: 1.3
pages: 2-3
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
2. 2. ODRL Information Model
1. 2.1 Policy Class
1. 2.1.1 Set Class
2. 2.1.2 Offer Class
3. 2.1.3 Agreement Class
2. 2.2 Asset Class
1. 2.2.1 Relation Property
2. 2.2.2 Part Of Property
3. 2.2.3 Target Policy Property
3. 2.3 Party Class
1. 2.3.1 Function Property
2. 2.3.2 Part Of Property
3. 2.3.3 Assigned Policy Properties
4. 2.4 Action Class
5. 2.5 Constraints
1. 2.5.1 Constraint Class
2. 2.5.2 Logical Constraint Class
3. 2.5.3 Constraint property with a Rule
4. 2.5.4 Refinement property with an Action
5. 2.5.5 Refinement property with an Asset Collection
6. 2.5.6 Refinement property with a Party Collection
6. 2.6 Rule Class
1. 2.6.1 Permission Class
2. 2.6.2 Prohibition Class
3. 2.6.3 Duty Class
4. 2.6.4 Obligation property with a Policy
5. 2.6.5 Duty property with a Permission
6. 2.6.6 Consequence property with a Permission/Obligation Duty
7. 2.6.7 Remedy property with a Prohibition
7. 2.7 Policy Rule Composition
1. 2.7.1 Compact Policy
8. 2.8 Policy Metadata
9. 2.9 Policy Inheritance
10. 2.10 Policy Conflict Strategy
3. 3. ODRL Profiles
1. 3.1 ODRL Profile Purpose
2. 3.2 ODRL Profile Conformance
3. 3.3 ODRL Profile Mechanism
4. 3.4 ODRL Core Profile
4. 4. Privacy Considerations
5. A. Acknowledgements
6. B. Candidate Recommendation Exit Criteria
7. C. Relationship to the W3C ODRL Community Group Reports
8. D. Changes from Previous Versions
9. E. References
1. E.1 Normative references
2. E.2 Informative references
1. Introduction
This section is non-normative.
Several business scenarios require expressing what are the permitted and prohibited actions over resources. These
permitted/prohibited actions are usually expressed under the form of policies, i.e., expressions that indicate those uses and re-uses
of the content which are conformant with existing regulations or to the constraints assigned by the owner. Policies may also be
enriched with additional information, i.e., who are the entities in charge of the definition of such Policy and those who are
required to conform to it, what are the additional constrains to be associated with the Permissions, Prohibitions and Duties
expressed by the Policy. The ability to express these concepts and relationships is important both for the producers of content,
i.e., they may state in a clear way what are the permitted and the prohibited actions to prevent misuse, and for the consumers, i.e.,
they may know precisely what resources they are allowed to use and re-use to avoid breaking any rules, laws or the owner's
constraints. This specification describes a common approach to expressing these policy concepts.
