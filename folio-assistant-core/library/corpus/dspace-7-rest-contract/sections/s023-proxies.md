---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s023-proxies
section_title: "Proxies"
file: "README.md"
lines: 259-265
source_sha256: 7a4858339b7ca74e
granularity: heading
---
## Proxies
The DSpace REST API supports the `X-Forwarded-For` header by default for all requests coming from localhost (127.0.0.1). This allows any clients running on the same server to immediately proxy requests for other IP addresses.

If your client (or User Interface) is on a different server, you may add additional "trusted" IP addresses (or ranges) which are allowed to use the `X-Forwarded-For` header. To do so, modify the `proxies.trusted.ipranges` setting in your `local.cfg`. This configuration accepts a comma-separated list of IPs and/or you may specify a range by listing the first three blocks of the IP range (e.g. 123.45.67)

Keep in mind, the `X-Forwarded-For` header is ONLY read if `useProxies=true` (default value) is also set in your DSpace configuration (either `dspace.cfg` or `local.cfg`).
