---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s017-statelessness
section_title: "Statelessness"
file: "README.md"
lines: 211-213
source_sha256: 7a4858339b7ca74e
granularity: heading
---
### Statelessness
The REST API is [stateless](https://restfulapi.net/statelessness/), meaning the client is responsible for keeping state information and sending it to the server when it is necessary. Because the server stores no state (or session) information internally, it will return a "token" (which contains any state information) to the client. The client must return that token in *each subsequent request*, if the client wants that state information preserved.
