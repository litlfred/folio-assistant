---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-026-24-action-class
section_title: "Action Class"
section_number: 2.4
pages: 12-12
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
An Action class indicates an operation that can be exercised on an Asset. An Action is associated with the Asset via the action
property in a Rule.
The Rule provides the specific interpretations of the Action. For example; an Action is permitted to be exercised on the target
Asset when related to a Permission. When related to a Prohibition, the Action indicates the operation that is prohibited to be
exercised on the target Asset. When related to a Duty, the Action indicates the agreed operation that is obligatory to be fulfilled
by a Party
The ODRL Information Model defines the following top-level Actions:
use - actions that involve general usage by parties.
transfer - actions that involve in the transfer of ownership to third parties.
The Action class has the following properties:
An Action MAY have none, one or more refinement property values (of type Constraint) that refine the semantics of the
