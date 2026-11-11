---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s314-main-endpoint
section_title: "Main Endpoint"
file: "metadata-suggestions.md"
lines: 34-132
source_sha256: 29d83451107b7c52
granularity: heading
---
## Main Endpoint
**/api/integration/metadata-suggestions**

Provide access to the configured live import sources which can suggest metadata.
It returns the list of existent live import sources.

Parameters (or should this be retrieved from the submission forms?):
* workspaceitem
* workflowitem

The list can differ per item.
A Person item can be limited to sources containing people such as orcid.
A Publication item can be limited to sources containing publications such as PubMed

Example:
```json
{
  "_embedded": {
    "metadata-suggestions": [
      {
        "id": "pubmed",
        "name": "pubmed",
        "type": "metadataSuggestion",
        "query-based": "true",
        "file-based": "false",
        "metadata-based": "true",
        "_links": {
          "entries": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/pubmed/entries"
          },
          "self": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/pubmed"
          }
        }
      },
      {
        "id": "orcid",
        "name": "orcid",
        "type": "metadataSuggestion",
        "query-based": "true",
        "file-based": "false",
        "metadata-based": "true",
        "_links": {
          "entries": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid/entries"
          },
          "self": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/orcid"
          }
        }
      },
      {
        "id": "ciencia",
        "name": "ciencia",
        "type": "metadataSuggestion",
        "query-based": "true",
        "file-based": "false",
        "metadata-based": "true",
        "_links": {
          "entries": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/ciencia/entries"
          },
          "self": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/ciencia"
          }
        }
      },
      {
        "id": "ris_data_loader",
        "name": "ris_data_loader",
        "type": "metadataSuggestion",
        "query-based": "false",
        "file-based": "true",
        "metadata-based": "false",
        "_links": {
          "entries": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/ris_data_loader/entries"
          },
          "self": {
            "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions/ris_data_loader"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "https://dspace7-internal.atmire.com/server/api/integration/metadata-suggestions"
    }
  },
  "page": {
    "size": 20,
    "totalElements": 3,
    "totalPages": 1,
    "number": 0
  }
}
```
