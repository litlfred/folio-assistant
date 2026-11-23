---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s315-single-suggestion-endpoint
section_title: "Single suggestion endpoint"
file: "metadata-suggestions.md"
lines: 133-163
source_sha256: 29d83451107b7c52
granularity: heading
---
## Single suggestion endpoint
**/api/integration/metadata-suggestions/<:suggestion-name>**

Provide detailed information about a specific live import source. The JSON response document is as follow
```json
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
}
```

Properties:
* query-based: if the live import source uses a query to suggest information to import
* file-based: if the live import source uses a file to suggest information to import
* metadata-based: if the live import source uses the current item metadata to suggest information to import

Exposed links:
* entries: the list of values managed by the live import source
