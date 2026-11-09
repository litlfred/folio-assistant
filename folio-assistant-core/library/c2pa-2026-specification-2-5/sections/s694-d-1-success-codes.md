---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s694-d-1-success-codes
section_title: "D.1. Success codes"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 13035-13060
source_sha256: ff401df19d1fde8c
granularity: heading
---
### D.1. Success codes

**Table 18. Validation success codes**

| Value | Meaning | `url` Usage |
| --- | --- | --- |
| `assertion.accessible` | A non-embedded (remote) assertion was accessible at the time of validation. | C2PA Assertion |
| `assertion.alternativeContentRepresentation.match` | The original preservation image assertion and its associated content validated successfully. | C2PA Assertion |
| `assertion.bmffHash.match` | Hash of a box-based asset matches the hash declared in the BMFF hash assertion. | C2PA Assertion |
| `assertion.boxesHash.match` | Hash of a box-based asset matches the hash declared in the general box hash assertion. | C2PA Assertion |
| `assertion.collectionHash.match` | Hashes of all the assets contained in a collection matches the hashes declared in the collection data hash assertion. | C2PA Assertion |
| `assertion.dataHash.match` | Hash of a byte range of the asset matches the hash declared in the data hash assertion. | C2PA Assertion |
| `assertion.hashedURI.match` | The hash of the referenced assertion matches the corresponding hash in the assertion’s hashed URI in the claim. | C2PA Assertion |
| `assertion.linkedResourceIntegrity.match` | A resource listed in the linked resource integrity assertion was retrieved and every applicable check (size, media type, and hash) succeeded. | (not applicable — see resourceUrl) |
| `assertion.multiAssetHash.match` | The hash of one part of a multi-asset hash assertion matches the corresponding hash in the assertion’s multi-asset-hash-map. | C2PA Assertion |
| `assertion.segmentHash.match` | Hash of a segment of the asset matches the hash declared in the segment hash assertion. | C2PA Assertion |
| `claimSignature.insideValidity` | The claim signature referenced in the claim was created within the validity period of the signing credential | C2PA Claim Signature Box |
| `claimSignature.validated` | The claim signature referenced in the claim validated. | C2PA Claim Signature Box |
| `ingredient.claimSignature.validated` | The hash of the ingredient’s C2PA Claim Signature box was successfully validated. | C2PA Assertion |
| `ingredient.manifest.validated` | The hash of the ingredient’s C2PA Manifest box was successfully validated. | C2PA Assertion |
| `signingCredential.ocsp.notRevoked` | The signing credential was not revoked at the time of signing. | C2PA Claim Signature Box |
| `signingCredential.trusted` | The claim signing credential is trusted. | C2PA Claim Signature Box |
| `timeStamp.trusted` | The time stamp credential is trusted. | C2PA Claim Signature Box |
| `timeStamp.validated` | The time stamp is well-formed, has a message imprint that matches the Claim Signature, and was created within the validity period of the time stamp credential. | C2PA Claim Signature Box |

<a id="_informational_codes"></a>
