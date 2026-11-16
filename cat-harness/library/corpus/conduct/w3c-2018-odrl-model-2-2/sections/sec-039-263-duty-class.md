---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-039-263-duty-class
section_title: "Duty Class"
section_number: 2.6.3
pages: 21-21
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A Duty is the obligation to exercise an action, with all refinements satisfied. A Duty is fulfilled if all constraints are satisfied
and if its action, with all refinements satisfied, has been exercised. If its action has not been exercised, then all consequences
must also be fulfilled to fulfil the Duty. That is, consequences are additional Duties that must also be fulfilled. (Note: only Duties
referenced by duty or obligation properties may use consequence properties.)
The Duty class is a subclass of, and inherits all the properties from, the Rule class - and has the following additional property
semantics:
A Duty MAY have none or one target property values (of type Asset) to indicate the Asset that is the primary subject to
which the Duty directly applies. (Other relation sub-properties MAY be used.)
A Duty MAY have none or one assigner and/or assignee property values (of type Party) for functional roles. (Other
function sub-properties MAY be used.)
A Duty MAY have none, one or many consequence property values of type Duty only when the Duty is referenced by a
Rule with the duty or obligation properties.
Note: The above property cardinalities reflect the normative ODRL Information Model. In some cases, repeat occurrences of
some properties are also supported (as described in Policy Rule Composition and Compact Policy) but the normative atomic
Policy is consistent with the above property cardinalities.
The Duty class also has these additional requirements:
The Party obligated to perform the duty MUST have the ability to exercise the Duty Action.
The Party obligated to perform the duty MUST satisfy the Duty.
The consequence property (a sub-property of the failure property) is utilised to express the repercussions of not fulfilling an
agreed Policy obligation or duty for a Permission. If either of these fails to be fulfilled, then this will result in the consequence
Duties also becoming new requirements, meaning that the original obligation or duty, as well as the consequence Duties MUST
all be fulfilled.
Note that the consequence property MUST NOT be used on a Duty that is already a consequence for a Permission duty or Policy
obligation.
