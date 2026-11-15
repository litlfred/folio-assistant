---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-049-210-policy-conflict-strategy
section_title: "Policy Conflict Strategy"
section_number: 2.10
pages: 29-29
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The conflict property is used to establish strategies to resolve conflicts that arise from the merging of Policies or conflicts
between Permissions and Prohibitions in the same Policy. Conflicts may arise when merging Policies as a result of Policy
Inheritance and the resultant Rules are inconsistent.
The conflict property SHOULD take one of the following Conflict Strategy Preference values (instance of the ConflictTerm
class):
perm: the Permissions MUST override the Prohibitions
prohibit: the Prohibitions MUST override the Permissions
invalid: the entire Policy MUST be void if any conflict is detected
If the conflict property is not explicitly set, the default of invalid will be used.
