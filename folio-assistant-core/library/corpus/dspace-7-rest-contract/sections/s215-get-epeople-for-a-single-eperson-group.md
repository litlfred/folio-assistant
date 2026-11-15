---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s215-get-epeople-for-a-single-eperson-group
section_title: "Get Epeople for a single EPerson Group"
file: "epersongroups.md"
lines: 202-280
source_sha256: 564c15e42ecf3fbf
granularity: heading
---
### Get Epeople for a single EPerson Group

**GET /api/eperson/groups/<:uuid>/epersons**

Retrieves direct child epeople of the given group.
Requesting indirect child epeople is not supported

Sample:
* GET /rest/api/eperson/groups/3b1de75d-5bf9-4ca3-bf4d-42bc8abd0d42/epersons


```json
{
    "_embedded": {
      "epersons": [
        {
          "id": "a6086b34-3918-45b7-8ddd-9329a702a26a",
          "uuid": "a6086b34-3918-45b7-8ddd-9329a702a26a",
          "name": "atmirenv@gmail.com",
          "handle": null,
          "metadata": {
            "eperson.firstname": [
              {
                "value": "John",
                "language": null,
                "authority": "",
                "confidence": -1,
                "place": 0
              }
            ],
            "eperson.language": [
              {
                "value": "en",
                "language": null,
                "authority": "",
                "confidence": -1,
                "place": 0
              }
            ],
            "eperson.lastname": [
              {
                "value": "Doe",
                "language": null,
                "authority": "",
                "confidence": -1,
                "place": 0
              }
            ]
          },
          "netid": null,
          "lastActive": "2019-09-25T15:59:28.000+0000",
          "canLogIn": true,
          "email": "user@institution.edu",
          "requireCertificate": false,
          "selfRegistered": false,
          "groups": null,
          "type": "eperson",
          "_links": {
            "self": {
              "href": "https://demo.dspace.org/server/api/eperson/epersons/a6086b34-3918-45b7-8ddd-9329a702a26a"
            }
          }
        }
      ]
    },
    "_links": {
      "self": {
        "href": "https://demo.dspace.org/server/api/eperson/groups/3b1de75d-5bf9-4ca3-bf4d-42bc8abd0d42/epersons"
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
