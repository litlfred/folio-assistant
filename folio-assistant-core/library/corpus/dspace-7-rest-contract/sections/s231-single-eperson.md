---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s231-single-eperson
section_title: "Single EPerson"
file: "epersons.md"
lines: 7-62
source_sha256: f15d99d416d78ed5
granularity: heading
---
## Single EPerson
**GET /api/eperson/epersons/<:uuid>**

```json
{
  "id": "028dcbb8-0da2-4122-a0ea-254be49ca107",
  "uuid": "028dcbb8-0da2-4122-a0ea-254be49ca107",
  "name": "user@institution.edu",
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
  "selfRegistered": true,
  "type": "eperson",
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/eperson/epersons/028dcbb8-0da2-4122-a0ea-254be49ca107"
    },
    "groups": {
      "href": "https://demo.dspace.org/server/api/eperson/epersons/028dcbb8-0da2-4122-a0ea-254be49ca107/groups"
    }
  }
}
```
