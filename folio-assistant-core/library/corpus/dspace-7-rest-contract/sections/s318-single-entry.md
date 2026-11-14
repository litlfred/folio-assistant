---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s318-single-entry
section_title: "Single entry"
file: "metadata-suggestions.md"
lines: 296-359
source_sha256: 29d83451107b7c52
granularity: heading
---
### Single entry
**/api/integration/metadata-suggestions/<:suggestion-name>/entryValues/<:entry-id>**  

It returns the data from one entry in a live import source

sample for a live import source /api/integration/metadata-suggestions/orcid/entryValues/0000-0002-4271-0436
```json
{
  "id": "0000-0002-4271-0436",
  "display": "Smith, Dean",
  "value": "Smith, Dean",
  "type": "metadataSuggestionEntry",
  "metadataSuggestion": "orcid",
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
    "self": {
      "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entryValues/0000-0002-4271-0436"
    },
    "differences": {
      "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entryValueDifferences/0000-0002-4271-0436"
    }
  }
}
```

The differences are explained below
