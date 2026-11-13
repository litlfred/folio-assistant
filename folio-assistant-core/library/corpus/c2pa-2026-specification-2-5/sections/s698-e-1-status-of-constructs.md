---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s698-e-1-status-of-constructs
section_title: "E.1. Status of Constructs"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 13188-13268
source_sha256: ff401df19d1fde8c
granularity: heading
---
### E.1. Status of Constructs

The table below lists constructs whose status has changed as this specification has evolved.

The following status values are used:

DEPRECATED

Construct is deprecated (claim generators are required not to produce it; validators are encouraged to accept it).

UNDEFINED

Construct is not defined (validators are required to ignore it).

<blank>

Construct is fully supported (validators are required to accept it).

**Table 21. Status of constructs**

| Construct | Type | v1.3 | v1.4 | v2.0 | v2.1 | v2.2 | v2.3 | v2.4 | v2.5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Time Stamp manifest | Manifest | UNDEFINED | UNDEFINED | UNDEFINED |  | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |
| `urn:uuid` namespace | Label |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `urn:c2pa` namespace | Label | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `c2pa.data` (Data Box) | Label |  |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.databoxes` (Data Box Store) | Label |  |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `sigTst` timestamp | Time Stamp |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `sigTst2` timestamp | Time Stamp | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `c2pa.claim` | Assertion |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.claim.v2` | Assertion | UNDEFINED | UNDEFINED |  |  |  |  |  |  |
| `c2pa.actions` | Assertion |  |  |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.actions.v2` | Assertion |  |  |  |  |  |  |  |  |
| `c2pa.asset-type` | Assertion |  |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.asset-type.v2` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `c2pa.certificate-status` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `c2pa.embedded-data` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `c2pa.font.info` | Assertion | UNDEFINED |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.hash.bmff` | Assertion | DEPRECATED | DEPRECATED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |
| `c2pa.hash.bmff.v2` | Assertion |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.hash.bmff.v3` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `c2pa.hash.boxes` for TIFF-based assets | Assertion |  |  |  |  |  | UNDEFINED | UNDEFINED | UNDEFINED |
| `c2pa.hash.collection.data` | Assertion | UNDEFINED |  |  |  |  |  |  |  |
| `c2pa.hash.multi-asset` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `c2pa.hash.segment` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |
| `c2pa.ingredient` | Assertion |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.ingredient.v2` | Assertion |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.ingredient.v3` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `stds.metadata` | Assertion | UNDEFINED |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.metadata` | Assertion | UNDEFINED | UNDEFINED |  |  |  |  |  |  |
| `c2pa.thumbnail.claim` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `c2pa.thumbnail.claim.*` | Assertion |  |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.thumbnail.ingredient` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `c2pa.thumbnail.ingredient.*` | Assertion |  |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.time-stamp` | Assertion | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `font.info` | Assertion | UNDEFINED | UNDEFINED |  |  |  |  |  |  |
| `stds.iptc` | Assertion |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `stds.exif` | Assertion |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `stds.schema-org` | Assertion |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `role` in `region-map` | Field |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `actors` in `action-item-map-v2` | Field |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `changed` in `action-item-map-v2` | Field |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `changes` in `action-item-map-v2` | Field | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `instanceID` in `parameters-map-v2` | Field |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `softwareAgents` in `actions-map-v2` | Field | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `softwareAgentIndex` in `action-common-map-v2` | Field | UNDEFINED | UNDEFINED |  |  |  |  |  |  |
| `sourceLanguage` in `parameters-map-v2` | Field | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `targetLanguage` in `parameters-map-v2` | Field | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |  |
| `templateParameters` in `action-template-map-v2` | Field | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  | DEPRECATED |
| `c2pa.trainedAlgorithmicData` | DigitalSourceType |  |  |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `[http://c2pa.org/digitalsourcetype/trainedAlgorithmicData](http://c2pa.org/digitalsourcetype/trainedAlgorithmicData)` | DigitalSourceType | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `[http://c2pa.org/digitalsourcetype/empty](http://c2pa.org/digitalsourcetype/empty)` | DigitalSourceType | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  |  |  |
| `c2pa.color_adjustments` | Action |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `c2pa.watermarked` | Action | UNDEFINED | UNDEFINED |  |  | DEPRECATED | DEPRECATED | DEPRECATED | DEPRECATED |
| `assertion.dataHash.redacted` | Status Code | UNDEFINED | UNDEFINED | UNDEFINED |  |  | DEPRECATED | DEPRECATED | DEPRECATED |
| `specVersion` | Claim | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  | DEPRECATED | DEPRECATED |
| String label `x5chain` (COSE header) | Label |  |  |  |  |  |  |  | DEPRECATED |
| `trustListUri` | Field | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED | UNDEFINED |  |  | DEPRECATED |
| `c2pa.removed` | Action |  |  |  |  |  |  |  | DEPRECATED |

<a id="version_history"></a>
