---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s305-15-5-1-description
section_title: "15.5.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4199-4235
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.5.1. Description

The Verifiable Segment Info Map (`verifiable-segment-info`) is a structure designed to provide concise per-segment information for a live media stream allowing for each segment to be validated independently. It enables the validation of each segment’s integrity and authenticity during playback, ensuring that the content has not been tampered with. It is used in workflows which are using [Section 15.5.5, “Session Keys”](#session_keys) to sign the segment information.

A `verifiable-segment-info` is a `COSE_Sign1_Tagged` structure where the payload field is the CBOR serialized `segment-info-map`. The payload shall be present and shall not be detached. The signature is created by a private [session key](#session_keys). The protected header shall carry the identifier of the algorithm used for the signature (`alg` field) and optionally, a timestamp representing "claimed time of signing" for the segment (`iat` field, [RFC 8392](https://www.rfc-editor.org/rfc/rfc8392)). The unprotected header shall carry the identifier of the session key (`kid` field).

A `segment-info-map` shall contain the following fields:

`sequenceNumber`

A unique identifier for the segment that is used to ensure the content order. This value shall either match the `mfhd.sequence_number` field defined in [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) or shall follow the segment-indexing rules defined in [ISO/IEC 23009-9](https://www.iso.org/standard/85639.html), Section 6.2 (conditions (a) and (f)). When used in conjunction with the per-segment C2PA Manifest Box method, the `sequenceNumber` in the `verifiable-segment-info-map` shall match the `sequenceNumber` value in the [Section 15.4.2, “Live Media Segment Assertion”](#livevideo_segment).

> **NOTE:**
> These both provide for the sequence number to increase by 1 for each subsequent segment, while not decreasing or repeating.

`manifestId`

A unique identifier for the manifest as described in [Section 9.1, “Uniquely Identifying C2PA Manifests and Assets”](#manifest-identifier). This is either the identifier of the manifest included in the current segment (via `uuid` box), or the identifier of the manifest referenced by `manifestUrl`, or the identifier of the manifest included in a previous segment (including an init segment) that is still the active manifest.

`bmffHash`

A C2PA `bmff-hash-map` that shall contain the hash of the segment (as described in [Section 16.3.2.2, “Hash Computation”](#bmff-hash-computation)), excluding all the C2PA `emsg` boxes (i.e., all `emsg` boxes with the `scheme_id_uri` [described above](#c2pa_emsg_box)). The `merkle` field shall be absent.

In order to exclude the C2PA `emsg` boxes, `bmffHash` shall at least contain one `exclusion-map` with:

*   `xpath` set to `"/emsg"`.
    
*   `data` set with `offset` field equal to 0 and the `value` field set to `urn:c2pa:verifiable-segment-info`.
    

A `segment-info-map` may also contain the following optional field:

`manifestUri` (optional)

A `hashed-ext-uri` that contains a URL from which a C2PA Manifest can be retrieved.

<a id="_use_in_an_emsg_box"></a>
