---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s134-collection-harvesting-settings
section_title: "Collection Harvesting Settings"
file: "collections.md"
lines: 377-490
source_sha256: bba07ac44ca0f3fc
granularity: heading
---
### Collection Harvesting Settings
**GET /api/core/collections/<:uuid>/harvester**

It returns the harvesting settings for the current collection. This information is only accessible for users with collection administration permissions

The harvest_type can be any of:
* NONE
* METADATA_ONLY
* METADATA_AND_REF
* METADATA_AND_BITSTREAMS

The harvest_status can be any of:
* READY
* BUSY
* QUEUED
* OAI_ERROR
* UNKNOWN_ERROR

The metadata_config_id can be one of the ids from the [Harvester Metadata Endpoint](harvestermetadata.md)

A sample json response:

```json
{
  "harvest_type": "METADATA_ONLY",
  "oai_source": "https://dspace.mit.edu/oai/request",
  "oai_set_id": "col_1721.1_114174",
  "harvest_message": null,
  "metadata_config_id": "dc",
  "harvest_status": "READY",
  "harvest_start_time": null,
  "last_harvested": null,
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/core/collections/6f944500-c300-449a-9023-a5ad8bd21160/harvester"
    }
  },
  "_embedded": {
    "metadata_configs": {
      "configs": [
        {
           "id": "dc",
           "label": "Simple Dublin Core",
           "nameSpace": "http://www.openarchives.org/OAI/2.0/oai_dc/"
        },
        {
           "id": "qdc",
           "label": "Qualified Dublin Core",
           "nameSpace": "http://purl.org/dc/terms/"
        },
        {
           "id": "dim",
           "label": "DSpace Intermediate Metadata",
           "nameSpace": "http://www.dspace.org/xmlns/dspace/dim"
        }
      ],
      "_links": {
        "self": {
          "href": "https://demo.dspace.org/server/api/config/harvestermetadata"
        }
      }
    }
    
  }
}
```

A sample json response if no harvesting is enabled:

```json
{
  "harvest_type": "NONE",
  "oai_source": null,
  "oai_set_id": null,
  "harvest_message": null,
  "metadata_config_id": null,
  "harvest_status": null,
  "harvest_start_time": null,
  "last_harvested": null,
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/core/collections/6f944500-c300-449a-9023-a5ad8bd21160/harvester"
    }
  },
  "_embedded": {
    "harvestermetadata": {
      "configs": [
        {
           "id": "dc",
           "label": "Simple Dublin Core",
           "nameSpace": "http://www.openarchives.org/OAI/2.0/oai_dc/"
        },
        {
           "id": "qdc",
           "label": "Qualified Dublin Core",
           "nameSpace": "http://purl.org/dc/terms/"
        },
        {
           "id": "dim",
           "label": "DSpace Intermediate Metadata",
           "nameSpace": "http://www.dspace.org/xmlns/dspace/dim"
        }
      ],
      "_links": {
        "self": {
          "href": "https://demo.dspace.org/server/api/config/harvestermetadata"
        }
      }
    }
    
  }
}
```
