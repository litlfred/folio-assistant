---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s392-16-4-1-4-6-unique-identifiers-for-actions
section_title: "16.4.1.4.6. Unique Identifiers for Actions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6781-6792
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.4.6. Unique Identifiers for Actions

Where a unique identifier for an instance of a specific action is required, it can be either determined implicitly or through explicit declaration. Implicitly, each action can be identified and its unique identifier assembled according to the following recommendation:

Use the [JUMBF URI](#_standard_uris) of that `actions` assertion, which includes the unique manifest ID and a path to the `actions` assertion. For example: `self#jumbf=/c2pa/urn:c2pa:ABCD:joe-ed/c2pa.assertions/c2pa.actions.v2`. If it is also necessary to refer to a specific action, then add that via the `&cbor=` syntax followed by the CBOR path using JSON Pointer ([RFC 6901](https://www.rfc-editor.org/rfc/rfc6901)) syntax, such as `&cbor=/actions/1`, creating a full URI to that action as `self#jumbf=/c2pa/urn:c2pa:ABCD:joe-ed/c2pa.assertions/c2pa.actions.v2&cbor=/actions/1`.

> **NOTE:**
> When constructing the CBOR path, all rules for JSON Pointer apply, including the need to escape `~` and `/` characters in the path, zero-based indexing of arrays, etc.

To provide a unique identifier explicitly, consider using a custom key in the actions `parameters` object, such as `com.fabrikam.actionId`.

<a id="_changes"></a>
