---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s204-single-eperson-group
section_title: "Single EPerson Group"
file: "epersongroups.md"
lines: 7-36
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
## Single EPerson Group
**GET /api/eperson/groups/<:uuid>**

```json
{
  "id": "617cf46b-535c-42d5-9d22-327ce2eff6dc",
  "uuid": "617cf46b-535c-42d5-9d22-327ce2eff6dc",
  "name": "Administrator",
  "handle": null,
  "metadata": {
  },
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
```

The "permanent" attribute will be "true" if the group is a required system group (e.g. the 'Administrator' group).  
A permanent group cannot be removed or have its name altered.
