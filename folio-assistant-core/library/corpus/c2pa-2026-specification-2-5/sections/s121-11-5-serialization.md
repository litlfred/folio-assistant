---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s121-11-5-serialization
section_title: "11.5. Serialization"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1619-1638
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 11.5. Serialization

The C2PA Manifest Store and individual C2PA Manifests are serialized using the JPEG Universal Metadata Box Format (ISO 19566-5:2023, JUMBF). This serialized format shall be used also in formats that do not natively support JUMBF, or when C2PA Manifest Stores are stored separately from the asset, such as in a separate file or URI location. The following type, label, and content requirements shall apply:

**Table 2. C2PA JUMBF boxes**

| Item | JUMBF type UUID | JUMBF Label | Contents |
| --- | --- | --- | --- |
| C2PA Manifest Store | `63327061-0011-0010-8000-00AA00389B71` (`c2pa`) | `c2pa` | One or more C2PA Manifest superboxes (`c2ma`, `c2um`, `c2cm`, or `c2md`), the last of which is the [active manifest](#_active_manifest). Additionally may contain [unrecognized boxes](#_unrecognized_boxes). |
| C2PA Standard Manifest | `63326D61-0011-0010-8000-00AA00389B71` (`c2ma`) | See [Unique Identifiers](#_unique_identifiers) | Exactly one each of a C2PA Assertion Store, a C2PA Claim, and a C2PA Claim Signature. Additionally may contain [unrecognized boxes](#_unrecognized_boxes). |
| C2PA Update Manifest | `6332756D-0011-0010-8000-00AA00389B71` (`c2um`) | See [Unique Identifiers](#_unique_identifiers) | Exactly one each of a C2PA Assertion Store, a C2PA Claim, and a C2PA Claim Signature. Additionally may contain [unrecognized boxes](#_unrecognized_boxes). |
| C2PA Compressed Manifest | `6332636D-0011-0010-8000-00AA00389B71` (`c2cm`) | Identical to the label of the compressed manifest | See [Compressed Manifests](#_compressed_manifests) |
| C2PA Standard Manifest (deprecated type) | `63326D64-0011-0010-8000-00AA00389B71` (`c2md`) | See [Unique Identifiers](#_unique_identifiers) | Exactly one each of a C2PA Assertion Store, a C2PA Claim, and a C2PA Claim Signature. Additionally may contain [unrecognized boxes](#_unrecognized_boxes). |
| C2PA Assertion Store | `63326173-0011-0010-8000-00AA00389B71` (`c2as`) | `c2pa.assertions` | See [Assertion Store Contents](#_assertion_store_contents) |
| C2PA Claim | `6332636C-0011-0010-8000-00AA00389B71` (`c2cl`) | `c2pa.claim.v2` | A single CBOR Content Type box (`cbor`) with contents as described in [Claim](#_claims) |
| C2PA Claim Signature | `63326373-0011-0010-8000-00AA00389B71` (`c2cs`) | `c2pa.signature` | A single CBOR Content Type box (`cbor`) with contents as described in [Claim Signature](#_digital_signatures) |

The boxes defined in [Table 2, “C2PA JUMBF boxes”](#table_c2pa_jumbf_boxes) shall satisfy the requirements in [Section 11.5.3.2, “Toggles”](#_toggles) and [Section 11.5.3.3, “Labels”](#jumbf_labels). Manifest Consumers shall accept `c2md` superboxes as standard C2PA Manifests, but claim generators shall not create such manifests.

<a id="_assertion_store_contents"></a>
