---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s329-16-2-standard-c2pa-assertion-summary
section_title: "16.2. Standard C2PA Assertion Summary"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4584-4619
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 16.2. Standard C2PA Assertion Summary

The standard C2PA assertions are listed in [Table 3, “Standard C2PA assertions”](#standard-assertions), grouped by their function.

**Table 3. Standard C2PA assertions**

| Function | Type | Assertion | Schema | Serialization |
| --- | --- | --- | --- | --- |
| Content binding & integrity | [BMFF-based Hash](#_bmff_based_hash) | c2pa.hash.bmff (removed), c2pa.hash.bmff.v2 (deprecated), c2pa.hash.bmff.v3 | C2PA | CBOR |
| [Collection Data Hash](#_collection_data_hash) | c2pa.hash.collection.data | C2PA | CBOR |
| [Data Hash](#_data_hash) | c2pa.hash.data | C2PA | CBOR |
| [General Box Hash](#_general_box_hash) | c2pa.hash.boxes | C2PA | CBOR |
| [Multi-Asset Hash](#_multi_asset_hash) | c2pa.hash.multi-asset | C2PA | CBOR |
| [Segment Hash](#_segment_hash) | c2pa.hash.segment | C2PA | CBOR |
| [Soft Binding](#soft_binding_assertion) | c2pa.soft-binding | C2PA | CBOR |
| Provenance & workflow | [Actions](#_actions) | c2pa.actions, c2pa.actions.v2 | C2PA | CBOR |
| [Asset Reference](#_asset_reference) | c2pa.asset-ref | C2PA | CBOR |
| [External Reference](#external_reference_assertion) | c2pa.external-reference | C2PA | CBOR |
| [Linked Resource Integrity](#linked_resource_integrity_assertion) | c2pa.linked-resource-integrity | C2PA | CBOR |
| [Repository Receipt](#_repository_receipt) | c2pa.repository-receipt | C2PA | JSON-LD |
| Ingredient | [Ingredient](#ingredient_assertion) | c2pa.ingredient, c2pa.ingredient.v2, c2pa.ingredient.v3 | C2PA | JUMBF Embedded File |
| Content description & referencing | [Alternative Content Representation](#alternative_content_representation_assertion) | c2pa.alternative-content-representation | C2PA | CBOR |
| [Asset Type](#_asset_type) | c2pa.asset-type (deprecated), c2pa.asset-type.v2 | C2PA | CBOR |
| [Cloud Data](#_cloud_data) | c2pa.cloud-data | C2PA | CBOR |
| [Depthmap](#_depthmap) | c2pa.depthmap.GDepth | [https://developers.google.com/depthmap-metadata/reference](https://developers.google.com/depthmap-metadata/reference) | CBOR |
| [Embedded Data](#_embedded_data) | c2pa.embedded-data | C2PA | JUMBF Embedded File |
| [Font Information](#_font_information) | font.info | C2PA | CBOR |
| [Metadata](#_metadata) | c2pa.metadata | C2PA | JSON-LD |
| [Thumbnail](#thumbnail_assertion) | c2pa.thumbnail.claim (claim creation time), c2pa.thumbnail.ingredient (importing an ingredient) | C2PA | Embedded File |
| Trust & validation adjuncts | [Certificate Status](#certificate_status_assertion) | c2pa.certificate-status | C2PA | CBOR |
| [Session Keys](#_session_keys) | c2pa.session-keys | C2PA | CBOR |
| [Time Stamps](#timestamp_assertion) | c2pa.time-stamp | C2PA | CBOR |
| Policy & disclosure | [AI Disclosure](#aiDisclosure) | c2pa.ai-disclosure | C2PA | CBOR |
| [Environmental Sustainability](#_environmental_sustainability) | c2pa.environmental-sustainability | C2PA | CBOR |

<a id="_content_binding_integrity"></a>
