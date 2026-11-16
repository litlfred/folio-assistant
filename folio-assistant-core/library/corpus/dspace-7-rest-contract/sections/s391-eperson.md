---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s391-eperson
section_title: "EPerson"
file: "profiles.md"
lines: 124-166
source_sha256: 64c203a69ff49a8b
granularity: heading
---
### EPerson
**GET /api/eperson/profiles/<:eperson-uuid>/eperson**

Returns the eperson owning the profile. The JSON response document is as follow

```json
{
  "id": "eb645ef8-1373-41eb-bf67-6afcea7e2069",
  "uuid": "eb645ef8-1373-41eb-bf67-6afcea7e2069",
  "name": "msmith@samltest.id",
  "handle": null,
  "metadata": {
    "eperson.firstname": [{
        "value": "Mortimer",
        "language": null,
        "authority": null,
        "confidence": -1,
        "place": 0
      }],
    "eperson.lastname": [{
        "value": "Smith",
        "language": null,
        "authority": null,
        "confidence": -1,
        "place": 0
      }]
  },
  "netid": "msmith@samltest.id",
  "lastActive": "2019-10-25T08:05:46.530+0000",
  "canLogIn": true,
  "email": "msmith@samltest.id",
  "requireCertificate": false,
  "selfRegistered": false,
  "type": "eperson"
}
```

It would respond with:
* 200 OK - Returning the eperson if there's a match
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions to view the eperson
* 404 Not found - if the eperson doesn't exist
