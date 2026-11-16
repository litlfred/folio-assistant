---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s078-8-9-specifications-of-time-in-assertions
section_title: "8.9. Specifications of time in assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 926-952
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 8.9. Specifications of time in assertions

The default specification for a date/time value in an assertion is the date/time format which is serialized in CBOR as tag number `0` ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), 3.4.1) and represented in CDDL as type `tdate`.

> **NOTE:**
> CBOR Tag 0 is described in [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949) as "the date-time production in [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339), as refined by Section 3.3 of [RFC 4287](https://www.rfc-editor.org/rfc/rfc4287), representing the point in time described there". This means that the presence of either an explicit timezone or `Z` (for UTC) is required.

Time values in this specification have different evidentiary meanings:

*   The standard use of time records the signer’s claim of the time in question.
    
*   A [claimed time of signing](#_adding_a_claimed_time_of_signing) specifically records the time (or interval) of signing, as claimed by the signer. It is not independently authoritative.
    
*   A [trusted time stamp](#timestamp_assertion) contains evidence from a Time-Stamping Authority (TSA) about the data submitted to that TSA. Its meaning and validation are defined by the time stamp profile and do not replace the semantics of other time fields.
    

Claim generator provided timestamp fields use `generator-lower-bound-time-type` or `generator-upper-bound-time-type`. A value may be either a direct `tdate` or a map containing a `tdate` in `value` and an optional `timeStampType`. A direct `tdate`, or a map without `timeStampType`, shall be interpreted as `absolute`.

`absolute` indicates recorded time. `lowerBound` indicates a lower bound on the recorded time but makes no guarantee about the actual time. `upperBound` indicates an upper bound on the recorded time but makes no guarantee about the actual time. When provided on corresponding start and end fields, lower and upper bounds bracket the range within which the actual process or action occurred.

There is one case, as described when [adding a claimed time of signing](#_adding_a_claimed_time_of_signing), where the time is represented as a CBOR tag number `1` ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), 3.4.2) (as the number of seconds from 1970-01-01T00:00Z).

Additionally there is the [time stamp assertion](#timestamp_assertion), which uses the standard time-stamping formats as described in [the signing process](#_signing_a_claim).

The reason why there are different types of date & time representations is to allow for the most appropriate representation, based on existing standards in use, for each specific use case.

<a id="_unique_identifiers"></a>
