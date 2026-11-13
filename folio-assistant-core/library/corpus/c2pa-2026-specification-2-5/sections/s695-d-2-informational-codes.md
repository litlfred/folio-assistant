---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s695-d-2-informational-codes
section_title: "D.2. Informational codes"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 13061-13090
source_sha256: ff401df19d1fde8c
granularity: heading
---
### D.2. Informational codes

**Table 19. Validation informational codes**

| Value | Meaning | `url` Usage |
| --- | --- | --- |
| `algorithm.deprecated` | The algorithm has been deprecated. | C2PA Claim Box or C2PA Assertion |
| `assertion.action.ingredientLocationMismatch` | The ingredient assertion referenced by a `c2pa.opened` or `c2pa.placed` action is not present in the same field of the claim (`created_assertions` or `gathered_assertions`) as the actions assertion containing that action. | C2PA Assertion |
| `assertion.bmffHash.additionalExclusionsPresent` | A BMFF hash specified exclusion ranges other than the C2PA Manifest Store. | C2PA Assertion |
| `assertion.boxesHash.additionalExclusionsPresent` | A box hash specified exclusion ranges other than the C2PA Manifest Store. | C2PA Assertion |
| `assertion.dataHash.additionalExclusionsPresent` | A data hash specified exclusion ranges other than the C2PA Manifest Store. | C2PA Assertion |
| `assertion.linkedResourceIntegrity.formatMismatch` | The media type of a retrieved linked resource does not match the `dc:format` declared in the linked resource integrity assertion. | (not applicable — see resourceUrl) |
| `assertion.linkedResourceIntegrity.hashMismatch` | The hash of a linked resource does not match the hash declared in the linked resource integrity assertion. | (not applicable — see resourceUrl) |
| `assertion.linkedResourceIntegrity.inaccessible` | A resource listed in the linked resource integrity assertion is inaccessible. | (not applicable — see resourceUrl) |
| `assertion.linkedResourceIntegrity.sizeMismatch` | The size of a retrieved linked resource does not match the `size` declared in the linked resource integrity assertion. | (not applicable — see resourceUrl) |
| `assertion.linkedResourceIntegrity.skipped` | A resource listed in the linked resource integrity assertion was skipped because the validator chose not to perform network retrieval of the referenced resource. | (not applicable — see resourceUrl) |
| `assertion.redacted` | An assertion was redacted but is still referenced. | C2PA Assertion |
| `ingredient.unknownProvenance` | The ingredient does not have a C2PA Manifest. | C2PA Assertion |
| `signingCredential.ocsp.inaccessible` | The validator attempted to perform an online OCSP check, but did not receive a response. | C2PA Claim Signature Box |
| `signingCredential.ocsp.skipped` | The validator chose not to perform an online OCSP check. | C2PA Claim Signature Box |
| `signingCredential.ocsp.unknown` | The OCSP response contains an `unknown` status for the signing credential | C2PA Claim Signature Box |
| `timeOfSigning.insideValidity` | The claimed time of signing (in the `iat` header of the signature) is within the validity period of the signer’s certificate chain and before the time in any corresponding trusted time stamp. | C2PA Claim Signature Box |
| `timeOfSigning.outsideValidity` | The claimed time of signing (in the `iat` header of the signature) is outside the validity period of the signer’s certificate chain or later than the time in a corresponding trusted time stamp. | C2PA Claim Signature Box |
| `timeStamp.credentialInvalid` | The time stamp credential is invalid. | C2PA Claim Signature Box |
| `timeStamp.malformed` | The time stamp response included in the claim signature header is not properly formed, as per RFC 3161 | C2PA Claim Signature Box |
| `timeStamp.mismatch` | The time stamp does not correspond to the contents of the claim. | C2PA Claim Signature Box |
| `timeStamp.outsideValidity` | The signed time stamp attribute in the signature was created outside the validity period of the TSA’s certificate. | C2PA Claim Signature Box |
| `timeStamp.untrusted` | The time stamp credential is not listed on the validator’s TSA [trust lists](#time-stamp-authorities). | C2PA Claim Signature Box |

<a id="_failure_codes"></a>
