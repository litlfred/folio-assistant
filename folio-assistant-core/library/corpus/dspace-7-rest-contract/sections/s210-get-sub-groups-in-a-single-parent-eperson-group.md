---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s210-get-sub-groups-in-a-single-parent-eperson-group
section_title: "Get Sub Groups in a single parent EPerson Group"
file: "epersongroups.md"
lines: 101-150
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Get Sub Groups in a single parent EPerson Group

**GET /api/eperson/groups/<:uuid>/subgroups**

Retrieves direct child groups of the given group.
Requesting indirect child groups is not supported

Sample:
* GET /rest/api/eperson/groups/3b1de75d-5bf9-4ca3-bf4d-42bc8abd0d42/subgroups

```json
{
    "_embedded": {
      "groups": [
        {
          "id": "617cf46b-535c-42d5-9d22-327ce2eff6dc",
          "uuid": "617cf46b-535c-42d5-9d22-327ce2eff6dc",
          "name": "Administrator",
          "handle": null,
          "metadata": {},
          "permanent": true,
          "type": "group",
          "_links": {
            "subgroups": {
              "href": "https://demo.dspace.org/server/api/eperson/groups/617cf46b-535c-42d5-9d22-327ce2eff6dc/subgroups"
            },
            "epersons": {
              "href": "https://demo.dspace.org/server/api/eperson/groups/617cf46b-535c-42d5-9d22-327ce2eff6dc/epersons"
            },
            "self": {
              "href": "https://demo.dspace.org/server/api/eperson/groups/617cf46b-535c-42d5-9d22-327ce2eff6dc"
            }
          }
        }
      ]
    },
    "_links": {
      "self": {
        "href": "https://demo.dspace.org/server/api/eperson/groups/3b1de75d-5bf9-4ca3-bf4d-42bc8abd0d42/subgroups"
      }
    },
    "page": {
      "number": 0,
      "size": 10,
      "totalPages": 1,
      "totalElements": 10
    }
}
```
