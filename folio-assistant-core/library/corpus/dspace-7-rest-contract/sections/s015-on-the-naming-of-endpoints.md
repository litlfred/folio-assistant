---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s015-on-the-naming-of-endpoints
section_title: "On the Naming of Endpoints"
file: "README.md"
lines: 196-205
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### On the Naming of Endpoints

We strive to align with these rules for all REST API endpoint names:
* Endpoint names MUST use plural nouns instead of verbs.
* When compounds are used in an endpoint name, the words MUST be concatenated, all lowercase, without punctuation. For example: `metadatafields`, NOT `metadata-fields` or `MetadataFields` or `metadataFields`.
* Endpoint names SHOULD be descriptive, but reasonably short (<25 characters). Abbreviations are _not recommended_, unless necessary for brevity. When abbreviations are used, the REST Contract MUST spell out the meaning of the abbreviation.
* Endpoints SHOULD be grouped with other related endpoints by category or name. 
    * The "category" is the first part of the endpoint's path and is always a singular noun. For example, all configuration-related endpoints use the category "config", which means they appear under `/api/config/*`.  Similarly, all submission-related endpoints use the category "submission", which means they appear under `/api/submission/*`.
    * Alternatively, the name of the endpoint may include a prefix to relate it to other endpoints.  For example, all workflow related endpoints start with the prefix "workflow", regardless of their category. For example: `/api/config/workflowdefinitions`, `/api/config/workflowsteps`, `/api/workflow/workflowitems`.
