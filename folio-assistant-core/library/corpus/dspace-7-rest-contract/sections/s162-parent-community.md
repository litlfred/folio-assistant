---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s162-parent-community
section_title: "Parent Community"
file: "communities.md"
lines: 196-208
source_sha256: 91351bf44765781b
granularity: heading
---
### Parent Community
**/api/core/communities/<:uuid>/parentCommunity**

It returns the community containing this communities, e.g. for trail purposes.  
If a community is part of multiple parent communities, it only returns one community.

Return codes:
* 200 OK - if the parent community exists and returned
* 204 No content - if the current community exists but the parent community doesn't exist
* 401 Unauthorized - if you are not authenticated and the current community or parent community is not public
* 403 Forbidden - if you are not logged in with sufficient permissions to retrieve the current community or parent community
* 404 Not found - if the current community doesn't exist
