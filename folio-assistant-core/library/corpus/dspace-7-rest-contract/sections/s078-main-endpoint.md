---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s078-main-endpoint
section_title: "Main Endpoint"
file: "bulkaccessconditionoptions.md"
lines: 4-16
source_sha256: 23b4e1e1052cf700
granularity: heading
---
## Main Endpoint
**/api/config/bulkaccessconditionoptions**   

Provide access to the existent configurations for the bulk access control management. It returns the list of existent BulkAccessConfig.
The BulkAccessConfig aggregates in a single place the configuration needed to the access section of the bulk access control management at the item and bitstream level.

Please note that currently only a single repository wide configuration is supported and it is configured in the backend `/config/spring/api/access-conditions.xml` file, so this endpoint will list a single configuration.

Status codes:
* 200 OK - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions. This endpoint is only accessible ot user that has administrative priviled over at least one community, collection or item limited to the resources that they admin.
