---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s251-14-10-5-3-4-redirect-handling
section_title: "14.10.5.3.4. Redirect handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3480-3486
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.5.3.4. Redirect handling

A validator may limit the number of HTTP redirects it will follow for a single validation operation (see [Section 14.10.5.3.6, “Resource limits”](#_resource_limits)), and may refuse to follow a redirect from an HTTPS URI to an HTTP URI. If the redirect limit is exceeded or a downgrade redirect is encountered, the validator may abort the retrieval.

Before a redirected request is sent, a validator may apply the countermeasures in [Section 14.10.5.3.1, “Permitted schemes and identifiers”](#_permitted_schemes_and_identifiers), [Section 14.10.5.3.2, “Credential handling”](#_credential_handling), and [Section 14.10.5.3.3, “Address validation and connection binding”](#_address_validation_and_connection_binding) to the redirect’s target URI, exactly as it would to the initial request, rather than sending the redirected request and evaluating them against the response it returns.

<a id="_retrieved_representation"></a>
