---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-041-note
section_title: "NOTE"
section_number: null
pages: 21-22
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
In some cases, to fulfil the original duty/obligation that triggered a consequence, some constraints and/or refinements on
the original duty/obligation MAY be required to be relaxed if they are no longer able to be satisfied.
For example, if an obligation to provide data by a fixed date is not fulfilled, then a consequence of a $100 fine is payable
as well. If the date has passed, then the original duty is technically not able to be fulfilled (as the date constraint cannot be
satisfied).
In such cases, ODRL implementations SHOULD provide mechanisms to allow the original duty/obligation to be
satisfiable post triggering a consequence.
Example Use Case: The below Agreement includes an obligation from assigner http://example.com/org:43 to
assignee http://example.com/person:44 to compensate the assigner for a payment amount of EU500.00.
A Policy MAY also include a consequence of not fulfilling an obligation.
Example Use Case: The below Agreement includes an obligation from assigner http://example.com/org:43 to
assignee http://example.com/person:44 to delete the target Asset. If the obligation is not fulfilled, then a
consequence is that the assigner MUST now also compensate the nominated charity with a payment of EU10.00 (as
well as the fulfill the obligation Duty).
