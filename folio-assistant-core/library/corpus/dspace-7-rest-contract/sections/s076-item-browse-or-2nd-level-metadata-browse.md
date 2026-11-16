---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s076-item-browse-or-2nd-level-metadata-browse
section_title: "Item browse or 2nd level metadata browse"
file: "browses.md"
lines: 179-205
source_sha256: 847a5e835b2cd033
granularity: heading
---
### Item browse or 2nd level metadata browse
**/api/discover/browses/<:index-name>/items**

Examples:

item browse: <https://{dspace.server.url}/api/discover/browses/dateissued/items>

2nd level metadata browse: <https://{dspace.server.url}/api/discover/browses/author/items?filterValue=Arulmozhiyal, Ramaswamy>

The supported parameters are:
* page, size & sort [see pagination](README.md#Pagination): the sort name must be one of the name specified in the sortOptions.name of the browse index or *default*, followed by a comma and the order direction. For example sort=default,asc or sort=dateissued,desc
* startsWith: value to use to filter the browse results so all results returned start with this prefix, so all items returned have name starting with this value
* scope: limit the browse to the items included in a specific DSpace container. It could be the UUID of a community or a collection. For example scope=9076bd16-e69a-48d6-9e41-0238cb40d863 

**On metadata browse** exactly one of the following parameter must be specified 
* value
* authority
**Please note that HAL compliant client should follow the link "items" in the browse entry resource instead to build the link theirself**

Error codes:

**404** if the browse index doesn't exist
**422** if both the page and startsWith parameters are present in the request
**500** 

1.  if a value or authority parameter **has been** specified and the browse index **is NOT** a metadata browse
2.	if a value or authority parameter has **NOT** been specified and the browse index **IS** a metadata browse
