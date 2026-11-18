---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s011-pagination-response
section_title: "Pagination Response"
file: "README.md"
lines: 146-186
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### Pagination Response
The HAL document always includes a page object with the following attributes
- `size` - the dimension of the result set window returned (can be different from the requested value due to imposed limit, see the request parameters section)
- `totalElements` - the total size of the result set
- `totalPages` - the number of available page of result using the current window size
- `number` - the index (zero-based) of the returned page

An example
```
"page": {
    "size": 5,
    "totalElements": 14,
    "totalPages": 3,
    "number": 0
}
```
When applicable, the following links may also appear:
- `self` - a parameterized link to the requested collection page
- `next` - the link to the next page of resources in the collection, if any, keeping the same option for size and sorting
- `previous` - the link to the previous page of resources in the collection, if any, keeping the same option for size and sorting
- `first` - the link to the first page of resources in the collection, keeping the same option for size and sorting
- `last` - the link to the last page of resources in the collection, keeping the same option for size and sorting

An example
```
"_links": {
    "first": {
      	"href": "http://localhost:8080/server/api/core/bitstreams?page=0&size=5"
    },
    "self": {
      	"href": "http://localhost:8080/server/api/core/bitstreams"
    },
    "next": {
      	"href": "http://localhost:8080/server/api/core/bitstreams?page=1&size=5"
    },
    "last": {
        "href": "http://localhost:8080/server/api/core/bitstreams?page=2&size=5"
    }
}
```
