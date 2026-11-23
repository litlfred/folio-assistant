---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s252-supported-entity-types
section_title: "supported entity types"
file: "external-authority-sources.md"
lines: 296-300
source_sha256: 669cf312a4da728a
granularity: heading
---
### supported entity types
**/api/integration/externalsources/<:source-name>/entityTypes**

Return the list of entity types that are supported by this external provider. For example a Pubmed provider can return "Publication" and "Dataset" as supported entity types assuming that a separate Dataset entity type has been configured in DSpace
