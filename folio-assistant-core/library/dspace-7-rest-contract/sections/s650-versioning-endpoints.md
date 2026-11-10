---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s650-versioning-endpoints
section_title: "Versioning endpoints"
file: "version.md"
lines: 1-11
source_sha256: 5a33997dae698af1
granularity: heading
---
# Versioning endpoints

[Back to the list of all defined endpoints](endpoints.md)

This endpoint provide access to a single version, matching a single item.

Whether a version is accessible depends on `versioning.item.history.view.admin` configuration.  
If this is set to true, the version can only be retrieved if the user is a community, collection or repository administrator, otherwise the versions are public.
Please note that the security of the single version is in no way related to the linked item. 
It is eventually possible to retrieve a version related to a not accessible item, as the version doesn't expose any sensitive information this pose no security risks.
