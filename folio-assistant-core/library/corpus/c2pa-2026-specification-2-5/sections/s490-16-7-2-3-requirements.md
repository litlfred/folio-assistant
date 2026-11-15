---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s490-16-7-2-3-requirements
section_title: "16.7.2.3. Requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9718-9726
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.2.3. Requirements

A time stamp assertion shall have a label of `c2pa.time-stamp`, and there shall be at most one time stamp assertion per C2PA Manifest.

The time stamp assertion consists of a CBOR map (defined as a `time-stamp-map`) which shall contain at least one key-value pair (defined as a `time-stamp-entry`). The key shall be the label of the C2PA Manifest receiving the time stamp, and the value shall be a CBOR byte string whose contents are described in the following paragraph.

The value for each `time-stamp-entry` shall be the same binary data found in the `timeStampToken` field of the `TimeStampResp` structure received in reply from an RFC 3161-compliant Time Stamping Authority (TSA) ([RFC 3161](https://www.rfc-editor.org/rfc/rfc3161)) using detached content mode. The `TimeStampResp` itself shall be obtained using the same process as described in [Section 10.3.2.5.3, “Obtaining the time stamp”](#_obtaining_the_time_stamp), with the exception that the contents of the `payload` field of `Sig_structure` shall be the value of the `signature` field of the `COSE_Sign1_Tagged` structure contained in the C2PA Claim Signature box of the C2PA Manifest that is receiving the time stamp.

<a id="_session_keys"></a>
