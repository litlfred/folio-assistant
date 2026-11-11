---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s182-single-property
section_title: "Single property"
file: "configuration.md"
lines: 8-25
source_sha256: 9dd3b5f81c9f10af
granularity: heading
---
## Single property
**/api/config/properties/<:property>**

This endpoint provides functionality to retrieve certain (configurable) configuration properties. 
The DSpace server will have a whitelist of properties that can be retrieved by this endpoint.


```json
{
  "name": "google.analytics.key",
  "values": [ 
      "UA-XXXXXX-X"
   ]
}
```          

* 200 OK - if the operation succeed
* 404 Not found - if the property doesn't exist or isn't configured to be retrieved
