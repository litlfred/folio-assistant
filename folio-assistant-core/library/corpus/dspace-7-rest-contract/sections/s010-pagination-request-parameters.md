---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s010-pagination-request-parameters
section_title: "Pagination Request Parameters"
file: "README.md"
lines: 141-145
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### Pagination Request Parameters
- `page` - zero-based integer value that specify the requested page in the result set (default 0). Negative values must be rejected with a `400` Error code.
- `size` - the dimension of the result set window to show. It must be a positive value. Negative or zero values must be rejected with a `400` Error code. The default value as well as maximum values are configurable by the system administrator. Different Maximum values apply for anonymous users, logged-in users and administrators. Size over the maximum value are automatically reset to the maximum allowed value, no error is thrown.
- `sort` - the criteria to use. Ordering is specified appending a comma and the keyword asc or desc to the criteria name (i.e. title,asc). Unknown sort criteria and/or ordering keyword produce an error response with Http Code `400`
