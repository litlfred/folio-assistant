---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s249-14-10-5-3-2-credential-handling
section_title: "14.10.5.3.2. Credential handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3457-3461
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.5.3.2. Credential handling

A validator may omit ambient credentials — such as cookies, `Authorization` headers, proxy credentials, or client certificates — from a retrieval request unless the operator has explicitly configured those credentials for the specific origin (scheme, host, and port) being retrieved. A validator may also withhold credentials attached for one origin from a different origin reached by way of a redirect (see [Section 14.10.5.3.4, “Redirect handling”](#_redirect_handling)).

<a id="_address_validation_and_connection_binding"></a>
