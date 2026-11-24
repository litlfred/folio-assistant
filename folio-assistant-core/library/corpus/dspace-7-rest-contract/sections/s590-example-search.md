---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s590-example-search
section_title: "Example search:"
file: "statistics-viewevents.md"
lines: 62-95
source_sha256: 4e2de1ed810866ca
granularity: heading
---
### Example search:

```json
{
  "query": "Lorem ipsum",
  "scope": "a3e80c6d-a83f-4c35-9f27-8718598c6c17",
  "configuration": "default",
  "appliedFilters": [
      {
        "filter" : "title",
        "operator" : "notcontains",
        "value" : "dolor sit",
        "label" : "dolor sit"
      },
      {
        "filter" : "author",
        "operator" : "authority",
        "value" : "9zvxzdm4qru17or5a83wfgac",
        "label" : "Amet, Consectetur"
      }
  ],
  "sort" : {
    "by" : "dc.date.issued",
    "order" : "asc"
  },
  "page": {
    "size": 5,
    "totalElements": 14,
    "totalPages": 3,
    "number": 0
  }
}
```
