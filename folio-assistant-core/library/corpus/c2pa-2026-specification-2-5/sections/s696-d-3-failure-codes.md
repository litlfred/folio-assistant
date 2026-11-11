---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s696-d-3-failure-codes
section_title: "D.3. Failure codes"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 13091-13184
source_sha256: ff401df19d1fde8c
granularity: heading
---
### D.3. Failure codes

**Table 20. Validation failure codes**

| Value | Meaning | `url` Usage |
| --- | --- | --- |
| `algorithm.unsupported` | The algorithm is unspecified or unsupported. | C2PA Claim Box or C2PA Assertion |
| `assertion.action.ingredientMismatch` | An action that requires an associated ingredient either does not have one or the one specified cannot be located | C2PA Assertion |
| `assertion.action.malformed` | An actions assertion is malformed. | C2PA Assertion |
| `assertion.action.redacted` | An actions assertion was redacted when the claim was created. | C2PA Assertion |
| `assertion.action.redactionMismatch` | An action that requires an associated redaction either does not have one or the one specified cannot be located | C2PA Assertion |
| `assertion.action.softBindingMissing` | An action that requires an associated soft binding does not have one | C2PA Assertion |
| `assertion.alternativeContentRepresentation.hashMismatch` | The hash of the original preservation image content does not match the hash declared in the assertion. | C2PA Assertion |
| `assertion.alternativeContentRepresentation.malformed` | The original preservation image assertion is malformed or contains invalid fields (e.g., both boxes and url fields are present, or invalid target usage). | C2PA Assertion |
| `assertion.alternativeContentRepresentation.missing` | The original preservation image assertion, or its required content, could not be found or resolved. | C2PA Assertion |
| `assertion.bmffHash.malformed` | A BMFF hash assertion is malformed. | C2PA Assertion |
| `assertion.bmffHash.mismatch` | The hash of a box-based asset does not match the hash declared in a BMFF hash assertion. | C2PA Assertion |
| `assertion.boxesHash.malformed` | The general box hash assertion is malformed. | C2PA Assertion |
| `assertion.boxesHash.mismatch` | The hash of a general box-like asset format does not match the hash declared in a general box hash assertion. | C2PA Assertion |
| `assertion.boxesHash.unknownBox` | A box other than those expected was found | C2PA Assertion |
| `assertion.cbor.invalid` | The cbor of an assertion is not valid | C2PA Assertion |
| `assertion.cloud-data.actions` | An update manifest contains a cloud data assertion referencing an actions assertion. | C2PA Assertion |
| `assertion.cloud-data.hardBinding` | A hard binding assertion is in a cloud data assertion. | C2PA Assertion |
| `assertion.cloud-data.labelMismatch` | The label of the JUMBF box retrieved from the cloud data assertion does not match the expected label. | C2PA Assertion |
| `assertion.cloud-data.malformed` | The cloud-data assertion was incomplete | C2PA Assertion |
| `assertion.collectionHash.incorrectFileCount` | An asset that was listed in the collection data hash assertion is missing from the collection. | C2PA Assertion |
| `assertion.collectionHash.invalidURI` | A URI of an asset in the collection data hash assertion contains the file part '..' or '.'. | C2PA Assertion |
| `assertion.collectionHash.malformed` | The collection hash assertion was incomplete | C2PA Assertion |
| `assertion.collectionHash.mismatch` | A hash of an asset in the collection does not match hash declared in the collection data hash assertion. | C2PA Assertion |
| `assertion.dataHash.malformed` | A data hash assertion is malformed. | C2PA Assertion |
| `assertion.dataHash.mismatch` | The hash of a byte range of the asset does not match the hash declared in the data hash assertion. | C2PA Assertion |
| `assertion.dataHash.redacted` | (DEPRECATED) A hard binding assertion was redacted. | C2PA Assertion |
| `assertion.external-reference.created` | The external reference assertion was present in the list of created assertions | C2PA Assertion |
| `assertion.external-reference.hashMismatch` | The hash of retrieved data does not match the hash declared in the `location` field of a hashed external reference | C2PA Assertion |
| `assertion.external-reference.labelMismatch` | The label of the JUMBF box retrieved from the external reference assertion does not match the expected label. | C2PA Assertion |
| `assertion.external-reference.malformed` | The external reference assertion was incomplete | C2PA Assertion |
| `assertion.hardBinding.redacted` | A hard binding assertion was redacted. | C2PA Assertion |
| `assertion.hashedURI.mismatch` | The hash of the referenced assertion in the manifest does not match the corresponding hash in the assertion’s hashed URI in the claim. | C2PA Assertion |
| `assertion.inaccessible` | A non-embedded (remote) assertion was inaccessible at the time of validation. | C2PA Assertion |
| `assertion.ingredient.malformed` | The ingredient assertion was incomplete | C2PA Assertion |
| `assertion.json.invalid` | The JSON(-LD) of an assertion is not valid | C2PA Assertion |
| `assertion.linkedResourceIntegrity.invalidURI` | A URI of a linked resource contains the file part '..'. | (not applicable — see resourceUrl) |
| `assertion.linkedResourceIntegrity.malformed` | The linked resource integrity assertion is missing required fields or contains an empty resources array. | C2PA Assertion |
| `assertion.linkedResourceIntegrity.notCreated` | The linked resource integrity assertion was in `gathered_assertions` instead of `created_assertions`. | C2PA Assertion |
| `assertion.metadata.malformed` | The `processStart` and `processEnd` fields of an assertion’s metadata are present but `processStart` is later than `processEnd`. | C2PA Assertion |
| `assertion.missing` | An assertion listed in the manifest’s claim is missing from the asset’s manifest. | C2PA Claim Box |
| `assertion.multiAssetHash.malformed` | A multi-asset hash assertion is malformed. | C2PA Assertion |
| `assertion.multiAssetHash.mismatch` | The hash of a part of a multi-part asset does not match the hash declared in the multi-asset hash assertion. | C2PA Assertion |
| `assertion.multiAssetHash.missingPart` | A required part of the multi-part asset cannot be located. | C2PA Assertion |
| `assertion.multipleHardBindings` | The manifest has more than one hard binding assertion. | C2PA Assertion Store Box |
| `assertion.notRedacted` | An assertion was declared as redacted in the claim but is still present in the manifest. | C2PA Assertion |
| `assertion.outsideManifest` | An assertion listed in the claim is not in the same C2PA Manifest as the claim | C2PA Claim Box |
| `assertion.segmentHash.malformed` | A segment hash assertion is malformed, or declares a version that the validator does not recognise. | C2PA Assertion |
| `assertion.segmentHash.mismatch` | The hash of the segment of the asset does not match the hash declared in the segment hash assertion, or the sentinel line is not at the byte offset declared in that assertion. | C2PA Assertion |
| `assertion.segmentHash.partialCoverage` | Part of the asset is not covered by any checkpoint, because the end boundary declared by the active checkpoint does not equal the length of the asset, because the first checkpoint does not begin at the start of the asset, or because there is a gap between two consecutive checkpoints. | C2PA Assertion |
| `assertion.segmentHash.predecessorMismatch` | The hash of the preceding sentinel line’s bytes does not match the `predecessorSentinel.hash` value declared in the segment hash assertion. | C2PA Assertion |
| `assertion.selfRedacted` | An assertion was declared as redacted by its own claim. | C2PA Claim Box |
| `assertion.timestamp.malformed` | The time stamp assertion is malformed. | C2PA Assertion |
| `assertion.undeclared` | An assertion was found in the manifest that was not explicitly declared in the claim. | C2PA Assertion |
| `claim.actions.missing` | No actions assertion is present in a standard manifest. | C2PA Claim Box |
| `claim.cbor.invalid` | The cbor of the claim is not valid. | C2PA Claim Box |
| `claim.hardBindings.missing` | No hard bindings are present. | C2PA Claim Box |
| `claim.malformed` | The data/fields of the referenced claim in the manifest are not correct. | C2PA Claim Box |
| `claim.missing` | The referenced claim in the manifest cannot be found. | C2PA Claim Box |
| `claim.multiple` | More than one claim box is present in the manifest. | C2PA Claim Box |
| `claimSignature.mismatch` | The claim signature referenced in the claim failed to validate. | C2PA Claim Signature Box |
| `claimSignature.missing` | The claim signature referenced in the claim cannot be found in its manifest. | C2PA Claim Signature Box |
| `claimSignature.outsideValidity` | The claim signature referenced in the claim was created outside the validity period of the signing credential. | C2PA Claim Signature Box |
| `general.error` | A value to be used when there was an error not specifically listed here. | (multiple) |
| `hashedURI.mismatch` | The hash of a given `hashed_uri` does not match the corresponding hash of the destination URI’s data | C2PA Assertion |
| `hashedURI.missing` | The data pointed to by a `hashed_uri` cannot be located | C2PA Assertion |
| `ingredient.claimSignature.mismatch` | The hash of an embedded C2PA Manifest’s C2PA Claim Signature does not match the hash declared in the `hashed_uri` value of the `claimSignature` field in the ingredient assertion. | C2PA Assertion |
| `ingredient.claimSignature.missing` | The referenced ingredient C2PA Claim Signature was not found. | C2PA Assertion |
| `ingredient.manifest.mismatch` | The hash of an embedded C2PA Manifest does not match the hash declared in the `hashed_uri` value of the `activeManifest` field in the ingredient assertion. | C2PA Assertion |
| `ingredient.manifest.missing` | The referenced ingredient C2PA Manifest was not found. | C2PA Assertion |
| `livevideo.assertion.invalid` | The live media segment assertion is not valid: its `sequenceNumber` is not greater than that of the previous segment, or its `streamId` doesn’t match that of the previous segment. | C2PA Assertion |
| `livevideo.continuityMethod.invalid` | The `continuityMethod` is invalid or not recognized. | C2PA Assertion |
| `livevideo.init.invalid` | The initialization is not valid. For BMFF/CMAF content: (1) the init segment improperly contains a `mdat` box. For content contributed over Enhanced RTMP: (2) the C2PA Manifest identified by the segment’s `manifestId` was not obtained before the segment is validated, or (3) the most recent codec configuration of a coded frame’s track is not the one bound by that C2PA Manifest. | (not applicable) |
| `livevideo.manifest.invalid` | The manifest failed validation. | (not applicable) |
| `livevideo.segment.invalid` | The segment is not valid. For BMFF/CMAF content: (1) it contains neither a valid `emsg` box nor C2PA Manifest Box, (2) the segment’s hash does not match the `bmffHash` field, (3) the segment’s presentation time is outside the session key’s validity period, or (4) the `previousManifestId` didn’t match the previous manifest. For content contributed over Enhanced RTMP: (5) it is not closed by a valid `VideoPacketType.Metadata` or `AudioPacketType.Metadata` message carrying `c2paSegmentInfo`, (6) the segment’s hash does not match the `segmentHash` field, (7) the session key was already used to sign segments of a different track, (8) the `Metadata` message carrying the `rtmp-verifiable-segment-info` does not belong to the track it identifies, or (9) the time of validation is outside the session key’s validity period. In either case: (10) no valid session keys, (11) the session key cannot be found or the `verifiable-segment-info` signature fails signature validation, (12) the `sequenceNumber` is not greater than that of the previous segment (for Enhanced RTMP, of the same track), or (13) the `sequenceNumber` is lower than the matching session key’s `minSequenceNumber`. | (not applicable) |
| `livevideo.sessionkey.invalid` | The session key is not valid, (1) does not meet requirements for session keys, (2) `signerBinding` doesn’t validate, or (3) the Claim Generator’s certificate used to protect delivery of the session key is no longer valid (for example, expired or revoked). | C2PA Assertion |
| `manifest.appendOnlyText.noSentinel` | No complete sentinel line was found in the append-only text file, or the last sentinel line was incomplete or malformed. | C2PA Claim Box |
| `manifest.compressed.invalid` | The compressed manifest was not valid. | C2PA Claim Box |
| `manifest.inaccessible` | A non-embedded (remote) manifest was inaccessible at the time of validation. | C2PA Claim Box |
| `manifest.inaccessible.encrypted` | The C2PA Manifest Store is encrypted, or is located within an encrypted region of the asset, such that the validator cannot read its contents. | C2PA Claim Box |
| `manifest.inaccessible.malformed` | The C2PA Manifest Store was retrieved and is readable, but its contents cannot be interpreted as a valid C2PA Manifest Store, such as due to a malformed JUMBF structure or an unsupported or unrecognized box format. | C2PA Claim Box |
| `manifest.multipleParents` | The manifest has more than one ingredient whose `relationship` is `parentOf`. | C2PA Claim Box |
| `manifest.update.invalid` | The manifest is an update manifest, but it contains a disallowed assertion, such as a hard binding or actions assertions. | C2PA Claim Box |
| `manifest.update.wrongParents` | The manifest is an update manifest, but it contains either zero or multiple `parentOf` ingredients. | C2PA Claim Box |
| `signingCredential.invalid` | The signing credential is not valid for signing. | C2PA Claim Signature Box |
| `signingCredential.ocsp.revoked` | The OCSP response indicates that the signing credential has been revoked by the issuer. | C2PA Claim Signature Box |
| `signingCredential.untrusted` | The signing credential is not listed on any of the validator’s applicable [trust lists](#_c2pa_signers). | C2PA Claim Signature Box |

<a id="versioning_annex"></a>
