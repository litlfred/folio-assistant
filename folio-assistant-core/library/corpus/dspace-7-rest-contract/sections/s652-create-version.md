---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s652-create-version
section_title: "Create version"
file: "version.md"
lines: 20-46
source_sha256: 5a33997dae698af1
granularity: heading
---
## Create version

**POST /api/versioning/versions[?summary=<summary-text>]**

* summary: it is an optional textual parameter that if provided will be saved in the summary property of the new version

Item administrators or, according to the `versioning.submitterCanCreateNewVersion` configuration, the original submitter can create a new version of an item. The content-type is uri-list.

The URI-list should contain the uri of the item that should be used to create the new version. It can be an item without an existing version history or an item part of an existing history. In the latest case it is possible to use an item representing an older version than the current one to facilitate the restore.

The new created version will be returned in the response, see the [get single version](#get-single-version) endpoint for an example of response.

An example curl call:

```
 curl -i -X POST https://demo7.dspace.org/server/api/versioning/versions \
 -H "Content-Type:text/uri-list" \
 --data "https://demo7.dspace.org/server/api/core/items/a8ba963f-d9c9-4198-b5a4-3f74e2ab6fb9"
```

Status codes:
* 201 Created - if the new version has been created
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions or if you are trying to create a new version for an entity item and the `versioning.block.entity` configuration property is `true` or unset
* 400 Bad Request - if the uri doesn't resolve to an item
* 422 Unprocessable Entity - if there are already an inprogress submission representing a new version in the same version history of the item
