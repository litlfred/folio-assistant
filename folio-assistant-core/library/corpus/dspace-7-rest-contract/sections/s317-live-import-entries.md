---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s317-live-import-entries
section_title: "Live import entries"
file: "metadata-suggestions.md"
lines: 165-295
source_sha256: 29d83451107b7c52
granularity: heading
---
### Live import entries
**/api/integration/metadata-suggestions/<:suggestion-name>/entries**

It returns the filtered entries managed by the live import source, see below

The supported parameters are:
* page, size [see pagination](README.md#Pagination) if supported by the live import source
* query: the terms, keywords or prefix to search. Applicable for sources where "query-based" is true
* bitstream: the bitstream ID to process. Applicable for sources where "file-based" is true
* use-metadata: enable metadata based search (true or false, defaults to false). Applicable for sources where "metadata-based" is true
* workspaceitem: the current workspace item ID (mutually exclusive with workflowitem)
* workflowitem: the current workflow item ID (mutually exclusive with workspaceitem)

It returns the entries in the live import source matching the query, bitstream or item metadata

sample for a live import source /api/integration/metadata-suggestions/orcid/entries?query=Smith&size=2
```json
{
  "_embedded": {
    "metadataSuggestionEntries": [
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
        "type": "metadataSuggestionEntry",
        "_links": {
          "self": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entryValues/0000-0002-4271-0436"
          },
          "differences": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entryValueDifferences/0000-0002-4271-0436"
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
        "type": "metadataSuggestionEntry",
        "_links": {
          "self": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entryValues/0000-0003-3681-2038"
          },
         "differences": {
           "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entryValueDifferences/0000-0003-3681-2038"
         }
        }
      }
    ]
  }
}
```

The differences are explained below, and won't be embedded in this endpoint.
