---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s012-out-of-bound-pages
section_title: "Out of Bound Pages"
file: "README.md"
lines: 187-189
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### Out of Bound Pages
If the request parameters lead to a page outside the result set, then an empty page should be returned with the links needed to go to the first and last page of the result set (if the results set is not empty), and the total number of resources in the collection.
