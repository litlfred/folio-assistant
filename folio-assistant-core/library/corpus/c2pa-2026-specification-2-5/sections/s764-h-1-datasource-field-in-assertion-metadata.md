---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s764-h-1-datasource-field-in-assertion-metadata
section_title: "H.1. `dataSource` Field in Assertion Metadata"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16083-16109
source_sha256: ff401df19d1fde8c
granularity: heading
---
### H.1. `dataSource` Field in Assertion Metadata

> **IMPORTANT:**
> The `dataSource` field in assertion metadata is deprecated. Claim generators shall not include a `dataSource` field in assertion metadata. Validators shall continue to accept the field for backwards compatibility.

A previous version of this specification defined a `dataSource` field in the assertion metadata structure to convey the origin of assertion data. No known implementations used this field, and the distinctions it expressed are better addressed through the conformance and attestation mechanisms defined elsewhere in this specification.

The value of the field is a `dataSource` object composed of two fields: `type` and `details`.

The `type` field defines the source of the assertion data. The value can be one of the following specification-defined values, or [entity-specific namespaces](#_namespacing) can be used as an extension mechanism.

**Table 22. Data source types**

| Value of `type` | Meaning |
| --- | --- |
| `signer` | The assertion contents came from the signer |
| `claimGenerator.REE` | Assertion contents came from a claim generator running in a rich execution environment (REE), such as a desktop or mobile operating system |
| `claimGenerator.TEE` | Assertion contents came from a claim generator running in a trusted execution environment (TEE), such as a trusted OS |
| `localProvider.REE` | Assertion contents came from a data source running in an REE on the same physical computing device as the claim generator |
| `localProvider.TEE` | Assertion contents came from a data source running in a TEE on the same physical computing device as the claim generator |
| `remoteProvider` | Assertion contents came from a remote data source controlled by the signer or claim generator vendor |
| `remoteProvider.external` | Assertion contents came from an external, remote data source that is not the signer or claim generator vendor |
| `humanEntry` | Assertion contents were entered by a human |

The `details` field is a human-readable string providing additional information about the data source, e.g., the name of the API or the URL of the server from which the assertion contents were provided.

<a id="_string_label_x5chain"></a>
