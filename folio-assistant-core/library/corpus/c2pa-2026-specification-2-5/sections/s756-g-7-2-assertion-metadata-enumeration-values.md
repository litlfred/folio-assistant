---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s756-g-7-2-assertion-metadata-enumeration-values
section_title: "G.7.2. Assertion Metadata Enumeration Values"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15899-15930
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.7.2. Assertion Metadata Enumeration Values

```cddl
; Enumerated values for $source-type and $review-code
; (used in assertion-metadata-common.cddl)

$source-type /= "signer"
$source-type /= "claimGenerator.REE"
$source-type /= "claimGenerator.TEE"
$source-type /= "localProvider.REE"
$source-type /= "localProvider.TEE"
$source-type /= "remoteProvider.1stParty"
$source-type /= "remoteProvider.3rdParty"
$source-type /= "humanEntry"
; the following two values of source-type are deprecated as of 2.0
$source-type /= "humanEntry.anonymous"
$source-type /= "humanEntry.identified"

$review-code /= "actions.unknownActionsPerformed"
$review-code /= "actions.missing"
$review-code /= "actions.possiblyMissing"
$review-code /= "depthMap.sceneMismatch"
$review-code /= "ingredient.modified"
$review-code /= "ingredient.possiblyModified"
$review-code /= "thumbnail.primaryMismatch"
; the following three values of review-code are deprecated as of 2.0
$review-code /= "stds.iptc.location.inaccurate"
$review-code /= "stds.schema-org.CreativeWork.misattributed"
$review-code /= "stds.schema-org.CreativeWork.missingAttribution"
```

<a id="cddl_annex_validation_result_structs"></a>
