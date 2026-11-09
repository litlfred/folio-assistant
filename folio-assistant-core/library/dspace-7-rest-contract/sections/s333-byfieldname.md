---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s333-byfieldname
section_title: "byFieldName"
file: "metadatafields.md"
lines: 50-67
source_sha256: c6cc6468c8c0f419
granularity: heading
---
#### byFieldName
**/api/core/metadatafields/search/byFieldName**

This endpoint supports the parameters (any combination of parameters is allowed):
* schema, an exact match of the prefix of the metadata schema (e.g. "dc", "dcterms", "eperson")
* element, an exact match of the field's element (e.g. "contributor", "title")
* qualifier, an exact match of the field's qualifier (e.g. "author", "alternative")
* query, part of the fully qualified field, should start with the start of the schema, element or qualifier (e.g. "dc.ti", "contributor", "auth", "contributor.ot")
* exactName, The exact fully qualified field, should use the syntax schema.element.qualifier or schema.element if no qualifier exists (e.g. "dc.title", "dc.contributor.author"). It will only return one value if there's an exact match
* page, size [see pagination](README.md#Pagination)

Examples:
* /api/core/metadatafields/search/byFieldName?schema=dc&query=author
* /api/core/metadatafields/search/byFieldName?query=id&qualifier=uri

Return codes:
* 200 OK - if the operation succeed
