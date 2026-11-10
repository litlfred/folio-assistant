---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s135-changing-collection-harvesting-settings
section_title: "Changing Collection Harvesting Settings"
file: "collections.md"
lines: 491-521
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
### Changing Collection Harvesting Settings
**PUT /api/core/collections/<:uuid>/harvester**

It updates the harvesting settings for the current collection. This information can only be updated by users with collection administration permissions

A sample json request:

```json
{
  "harvest_type": "METADATA_ONLY",
  "oai_source": "https://dspace.mit.edu/oai/request",
  "oai_set_id": "col_1721.1_114174",
  "metadata_config_id": "dc"
}
```

A sample json request to disable harvesting is:

```json
{
  "harvest_type": "NONE"
}
```

Status codes:
* 200 OK - if the operation succeeded
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the collection doesn't exist
* 422 Unprocessable Entity - if the harvest_type or the metadata_config_id is not valid
