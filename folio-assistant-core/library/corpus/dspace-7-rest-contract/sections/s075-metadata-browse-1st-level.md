---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s075-metadata-browse-1st-level
section_title: "Metadata browse 1st level"
file: "browses.md"
lines: 136-178
source_sha256: 847a5e835b2cd033
granularity: heading
---
### Metadata browse 1st level
**/api/discover/browses/<:index-name>/entries**

Example: <https://{dspace.server.url}/api/discover/browses/author/entries>

It returns a collection of BrowseEntryResource the JSON document looks like
```json
{
  "_embedded": {
    "browseEntries": [
      {
        "authority": null,
        "value": "Arulmozhiyal, Ramaswamy",
        "type": "browseEntry",
        "valueLang": null,
        "count": 1,
        "_links": {
          "items": {
            "href": "https://demo.dspace.org/server/api/discover/browses/author/items?filterValue=Arulmozhiyal, Ramaswamy"
          }
        }
      },
      ...
      ]
  "_link": ...,
  "page": ...
  }
```

* authority: is the unique ID of the entry if the index is authority based. If not null it musts be used to retrieve the associated list of items. **Please note that HAL compliant client should follow the link "items" instead to build the link theirself**
* value: is the entry value to use, only if authority is null, to get the associated list of items. See also the above warning
* count: is the number of items associated with this entry

The supported parameters are:
* page, size & sort [see pagination](README.md#Pagination): the sort parameter must be specified as default,(asc|desc) as 1st level browse doesn't support sorting by option other than the natural sorting of the entries
* startsWith: value to use to filter the browse results so all results returned start with this prefix, so all plain-text browse entries start with this value
* scope: limit the browse to the items included in a specific DSpace container. It could be the UUID of a community or a collection. For example scope=9076bd16-e69a-48d6-9e41-0238cb40d863 

Error codes:

**404** if the browse index is not a metadata browse or the browse index doesn't exist at all
**422** if both the page and startsWith parameters are present in the request
