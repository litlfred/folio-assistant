---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s485-16-7-1-2-schema-and-example
section_title: "16.7.1.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9655-9676
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.1.2. Schema and Example

The schema for this type is defined by the `cert-status-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.6.1, “Certificate Status”](#cddl_annex_cert_status) for the complete normative schema):

```cddl
certificate-status-map = {
  "ocspVals": [1* bstr]
}
```

An example in CBOR Diagnostic Format (`.cbordiag`) is shown below:

```none
{
  "ocspVals" : [
    h'...',
    h'...'
  ]
}
```

<a id="_requirements_2"></a>
