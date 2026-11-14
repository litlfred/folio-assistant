---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s678-b-3-3-retrieval-of-externally-referenced-data
section_title: "B.3.3. Retrieval of externally referenced data"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12680-12686
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### B.3.3. Retrieval of externally referenced data

Cloud data assertions, hashed external references, and linked resource integrity assertions contain URIs that are chosen by the author of a C2PA Manifest rather than by the operator of the validator. A validator that chooses to resolve these URIs therefore makes network requests to destinations selected by a potentially adversarial party. Without countermeasures, such requests can be used to reach services on the validator’s internal network (server-side request forgery), including by way of redirects or by a DNS answer that changes between checking an address and connecting to it; to leak credentials that the validator’s environment attaches to outgoing requests; to downgrade a secure connection to an insecure one; or to exhaust the validator’s memory, bandwidth, or time through large, highly compressed, slow, or numerous responses. A validator can also report a mismatch for a correctly bound resource if the bytes it hashes are not those the claim generator hashed.

Countermeasures for these threats are described in [Section 14.10.5.3, “Retrieval Security”](#_retrieval_security).

<a id="_references_2"></a>
