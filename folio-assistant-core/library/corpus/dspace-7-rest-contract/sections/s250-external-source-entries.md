---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s250-external-source-entries
section_title: "external source entries"
file: "external-authority-sources.md"
lines: 99-230
source_sha256: 669cf312a4da728a
granularity: heading
---
### external source entries
**/api/integration/externalsources/<:source-name>/entries**

It returns the filtered entries managed by the externally, see below 

The supported parameters are:
* page, size [see pagination](README.md#Pagination) if supported by the external source
* query: the terms, keywords or prefix to search: mandatory
* parent: the key of the parent authority when searching in a hierarchical authority 

It returns the entries in the external source matching the query

sample for an external source /server/api/integration/externalsources/orcid/entries?query=Smith&size=2 
```json
{
  "_embedded": {
    "externalSourceEntries": [
      {
        "id": "0000-0002-4271-0436",
        "display": "Smith, Dean",
        "value": "Smith, Dean",
        "metadata": {
            "dc.identifier.orcid": [
              {
                "value": "0000-0002-4271-0436",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ],
            "dc.identifier.uri": [
              {
                "value": "https://orcid.org/0000-0002-4271-0436",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ],
            "person.familyName": [
              {
                "value": "Smith",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ],
            "person.givenName": [
              {
                "value": "Dean",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ]
        },
        "type": "externalSourceEntry",
        "_links": {
          "authority": {
            "href": "https://demo.dspace.org/server/api/integration/authorities/authors/entryValues/d4b5ca88-9d6d-4a87-b905-fef0f8cae26c"
          },
          "parent": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid/entryValues/0000-0002-4271-0436"
          }
        }
      },
      {
        "id": "0000-0003-3681-2038",
        "display": "Smith, Charles",
        "value": "Smith, Charles",
        "metadata": {
            "dc.identifier.orcid": [
              {
                "value": "0000-0003-3681-2038",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ],
            "dc.identifier.uri": [
              {
                "value": "https://orcid.org/0000-0003-3681-2038",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ],
            "person.familyName": [
              {
                "value": "Smith",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ],
            "person.givenName": [
              {
                "value": "Charles",
                "language": null,
                "authority": null,
                "confidence": -1,
                "place": -1
              }
            ]
        },
        "type": "externalSourceEntry",
        "_links": {
          "entity": {
            "href": "https://demo.dspace.org/server/api/core/item/6fd90bf5-b84f-47b3-aaec-a55bde3a2a5a"
          },
          "parent": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid"
          },          
          "self": {
            "href": "https://demo.dspace.org/server/api/integration/externalsources/orcid/entryValues/0000-0003-3681-2038"
          }
        }
      }
    ]
  }
}
```
