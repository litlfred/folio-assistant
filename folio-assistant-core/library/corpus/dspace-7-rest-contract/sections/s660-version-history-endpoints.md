---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s660-version-history-endpoints
section_title: "Version history endpoints"
file: "versionhistory.md"
lines: 1-11
source_sha256: f48fbb000afbfea4
granularity: heading
---
# Version history endpoints

[Back to the list of all defined endpoints](endpoints.md)

This endpoint represents the version history that group all related versions.

Whether version history information is accessible depends on versioning.item.history.view.admin configuration
If this is set to true, the version history can only be retrieved if the user is a community, collection or repository administrator, otherwise the version histories are public.
Please note that the security of the version history is in no way related to any of the items that belong to it. 
It is eventually possible to retrieve an history containing only not accessible items. As the version history neither the single version expose any sensitive information this pose no security risks.
