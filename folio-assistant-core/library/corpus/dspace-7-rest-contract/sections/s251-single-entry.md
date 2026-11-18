---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s251-single-entry
section_title: "single entry"
file: "external-authority-sources.md"
lines: 231-295
source_sha256: 669cf312a4da728a
granularity: heading
---
### single entry
**GET /api/integration/externalsources/<:source-name>/entryValues/<:entry-id>**

It returns the data from one entry in an external source

sample for an external source /api/integration/externalsources/orcid/entryValues/0000-0002-4271-0436 
```json
{
  "id": "0000-0002-4271-0436",
  "display": "Smith, Dean",
  "value": "Smith, Dean",
  "type": "externalSourceEntry",
  "externalSource": "orcid",
  "metadata": {
    "dc.identifier.orcid": [
      {
        "value": "0000-0002-4271-0436",
        "language": null,
        "authority": null,
        "confidence": 0,
        "place": -1
      }
    ],
    "dc.identifier.uri": [
      {
        "value": "https://orcid.org/0000-0002-4271-0436",
        "language": null,
        "authority": null,
        "confidence": 0,
        "place": -1
      }
    ],
    "person.familyName": [
      {
        "value": "Smith",
        "language": null,
        "authority": null,
        "confidence": 0,
        "place": -1
      }
    ],
    "person.givenName": [
      {
        "value": "Dean",
        "language": null,
        "authority": null,
        "confidence": 0,
        "place": -1
      }
    ]
  },
  "_links": {
    "entity": {
      "href": "https://demo.dspace.org/server/api/core/item/00167e74-c027-4984-8564-85c3fe513d45"
    },
    "parent": {
      "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid"
    },    
    "self": {
      "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid/entryValues/0000-0002-4271-0436"
    }
  }
}
```
