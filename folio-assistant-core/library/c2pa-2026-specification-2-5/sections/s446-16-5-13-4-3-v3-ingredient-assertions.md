---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s446-16-5-13-4-3-v3-ingredient-assertions
section_title: "16.5.13.4.3. V3 ingredient assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8642-8731
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.5.13.4.3. V3 ingredient assertions

In a v3 ingredient assertion with an `activeManifest` field, the `validationResults` field shall be present. It may also be present when an `activeManifest` field is not present — for example, to record that the claim generator was unable to establish the ingredient’s active manifest at all, such as a remote manifest that could not be retrieved (see [Section 14.5.3.1, “By Reference”](#_by_reference)).

> **NOTE:**
> The ability for `validationResults` to exist without an `activeManifest` field is a change from previous versions.

When present, the `validationResults` field shall contain a `validation-results-map` object which in turn shall contain:

1.  In `activeManifest`, full validation results for the ingredient’s active manifest.
    
2.  In `ingredientDeltas`, delta validation results for every ingredient assertion, that contains an `activeManifest` field, in every manifest in the ingredient’s C2PA Manifest Store. The delta validation results for an ingredient assertion shall contain the following:
    
    1.  In `ingredientAssertionURI`, the URI of the ingredient assertion.
        
    2.  In `validationDeltas`, the validation results for the manifest referenced by the ingredient assertion, omitting any status values present in the `activeManifest` field of the `validationResults` field in the ingredient assertion (or for v1 or v2 ingredient assertions, the `validationStatus` field). This status value comparison shall consider the status type (success, informational, or failure), `code`, and `url`, ignoring other fields.
        
    

**EXAMPLE:** Consider a multi-ingredient Manifest `E` with a complex lineage. Claim generator `E` adds Manifest `C` and Manifest `D` as ingredients via ingredient assertions. Manifest `C` itself has Manifest `A` and Manifest `B` added via ingredient assertions. Manifest `D` also has Manifest `A` added via an ingredient assertion. When adding Manifest `C`, claim generator `E` creates an ingredient assertion with a `validationResults` object that stores validation results for the active manifest of `C` in `activeManifest`, and delta validation results for manifests `A` and `B` in `ingredientDeltas`. The `ingredientDeltas` array will have two elements: one for the delta results compared against the `activeManifest` object in the `validationResults` object in Manifest `C` 's ingredient assertion of Manifest `B` (with a `hashed-uri` link to said ingredient assertion in Manifest `C`), and another element of the same attributes but for Manifest `C` 's ingredient assertion of Manifest `A`. And likewise when adding Manifest `D`, claim generator `E` creates an ingredient assertion which stores `validationResults` for both the `activeManifest` of `D`, as well as `ingredientDeltas` with a single array element containing delta validation results compared against the `activeManifest` object in the `validationResults` object in Manifest `D` 's ingredient assertion of Manifest `A`.

> **NOTE:**
> While this is an intentionally contrived example, it is designed to elucidate the expectation of how the `validationResults` data structure is to be used.

Example 13. Example of an ingredient assertion whose active manifest could not be established

An example of an ingredient assertion recording that its remote manifest was inaccessible, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// ingredient v3 (parentOf, remote active manifest could not be retrieved) //
{
  "dc:format": "image/jpeg",
  "relationship": "parentOf",
  "validationResults": {
    "activeManifest": {
      "success": [],
      "informational": [],
      "failure": [{
        "code": "manifest.inaccessible"
      }]
    }
  }
}
```

Each validation result (as described using a `status-codes-map`), consists of an array of `success`, `informational`, and `failure` codes. Each code is represented as a `status-map` object which shall contain a `code` field with the status code. In addition, it may contain a `url` field with a JUMBF URI reference to the specific element in the manifest about which the status refers, and an optional `explanation` field with a human-readable explanation of the status. Status codes are defined in [Appendix D, _Standard Validation Status Codes_](#validation_codes_annex).

Custom status codes are permitted when a claim generator has a need to record some process-specific status information. The code shall conform to the same syntax as [entity-specific namespaces](#_namespacing) (e.g. `com.litware.malformedFrobber`).

Additionally, a `validation-results-map` may contain a SemVer formatted `specVersion` field which represents the version of this specification that was used as the basis for the validation procedure. It may also contain either a `trustListUri` field (DEPRECATED), which is a single URI or a `trustListUris` field, which is an array of objects. In either case, they identify the trust list(s) that were used to [validate the claim signature](#_validate_the_signature).

EXAMPLE: For C2PA 2.5, the value of `specVersion` would be `2.5.0`.

If present, the `trustListUris` field shall contain one or more objects, each of which identifies a trust list on which a trust anchor match occurred during the validation of the claim signature or a TSA time-stamp. Each `trust-list-uri-map` object in the `trustListUris` array shall contain a `uri` field, which identifies the trust list, and a `type` field, which identifies the type of trust list.

> **NOTE:**
> While other trust lists may have been used in the validation process, only those trust lists that contained the matching trust anchor(s) are included in the `trustListUris` field.

When it is necessary to identify that the C2PA Trust List was used, then the `uri` for the C2PA Trust List is `[https://c2pa.org/trustlist](https://c2pa.org/trustlist)`. Similarly, identifying that the C2PA TSA Trust List was used, then the `uri` for the C2PA TSA Trust List is `[https://c2pa.org/trustlist-tsa](https://c2pa.org/trustlist-tsa)`.

> **NOTE:**
> A `uri` value in a `trustListUris` object is a URI and not a URL, meaning that the elements of the array need not resolve to an actual machine-readable list, but instead they are just unique identifiers for a specific trust list. If an official URI is not known, a descriptive unique value in the form of a URI can be used.

The `type` field shall conform to the same syntax as [entity-specific namespaces](#_namespacing) (e.g. `c2pa.trustList` or `com.litware.trustList`). Two values for the `type` field are defined in this specification: `c2pa.trustList` and `c2pa.tsaTrustList`. The `c2pa.trustList` type is used for trust lists that contain claim-signing credentials, while the `c2pa.tsaTrustList` type is used for trust lists that contain TSA credentials. Other types may be defined by other specifications or by individual entities.

A `trust-list-uri-map` object may also contain an optional `identifier` field, which is a unique identifier for a specific instance of the trust list. For trust lists formatted per [ETSI TS 119 602](https://www.etsi.org/deliver/etsi_ts/119600_119699/119602/01.01.01_60/ts_119602v010101p.pdf) or [ETSI TS 119 612](https://www.etsi.org/deliver/etsi_ts/119600_119699/119612/02.04.01_60/ts_119612v020401p.pdf) (including the C2PA Trust List and C2PA TSA Trust List), if the `identifier` field is present, it shall contain the decimal string representation of the sequence number (`LoTESequenceNumber`, e.g. `"1"`, `"42"`) from the trust list’s `ListAndSchemeInformation` header. For all other trust lists, this may be a version number, a commit hash, a release date, or another unique identifier defined by the maintaining authority.

An example `validation-results-map` referencing the C2PA Trust List and C2PA TSA Trust List with illustrative sequence numbers is shown in [Validation results with trust list references in CBOR diagnostic notation (RFC 8949, clause 8)](#example-trust-list-uri-map).

Validation results with trust list references in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8)

```none
{
  "specVersion": "2.5.0",
  "trustListUris": [
    {
      "uri": "https://c2pa.org/trustlist",
      "type": "c2pa.trustList",
      "identifier": "42"
    },
    {
      "uri": "https://c2pa.org/trustlist-tsa",
      "type": "c2pa.tsaTrustList",
      "identifier": "17"
    }
  ]
}
```

<a id="_ingredient_metadata"></a>
