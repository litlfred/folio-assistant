---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s508-16-9-1-3-schema-and-example
section_title: "16.9.1.3. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10051-10164
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.9.1.3. Schema and Example

Below shows the core schemas used inside other assertions.

The [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) for the `assertion-metadata-map` rule is in the following listing (see [Section G.7.1, “Assertion Metadata Common Types”](#cddl_annex_assertion_metadata_common) for the complete normative schema):

CDDL for Assertion Metadata

```cddl
; Describes additional information about an assertion, including a hashed-uri
; reference to it. We use a socket/plug here to allow hashed-uri-map to be used
; in individual files without having the map defined in the same file
; Claim generator provided timestamps are RFC 3339 timestamps.
generator-lower-bound-time-map = {
  "value": tdate,
  ? "timeStampType": "absolute" / "lowerBound" ; defaults to "absolute" if omitted
}

generator-lower-bound-time-type = tdate / generator-lower-bound-time-map

generator-upper-bound-time-map = {
  "value": tdate,
  ? "timeStampType": "absolute" / "upperBound" ; defaults to "absolute" if omitted
}

generator-upper-bound-time-type = tdate / generator-upper-bound-time-map

$assertion-metadata-map /= {
  ; The RFC 3339 date-time string when the assertion was created/generated
  ? "dateTime":  tdate,

  ; Ratings given to the assertion (may be empty)
  ? "reviewRatings": [1* rating-map],

  ; hashed_uri reference to another assertion that this review is about
  ? "reference": $hashed-uri-map,

  ; (DEPRECATED) A description of the source of the assertion data, selected
  ; from a predefined list. Claim generators shall not include this field.
  ? "dataSource": source-map,

  ; localizations for strings in the assertion
  ? "localizations" : [1* $localization-data-entry]

  ; describes a region of the asset where this assertion is relevant
  ? "regionOfInterest" : region-map

  ; Recorded start of the overall process or lower bound
  ? "processStart": generator-lower-bound-time-type,

  ; Recorded end of the overall process or upper bound
  ? "processEnd": generator-upper-bound-time-type,
  * tstr => any ; custom fields
}

; NOTE: an earlier version of this specification also included an "actors"
; field, however this was removed in version 2.0.
source-map = {
  ; A value from among the enumerated list indicating whether the source of the
  ; assertion is a claim generator running in a rich execution environment
  ; (REE), a claim generator running in a trusted execution environment (TEE), a
  ; local data provider in REE (e.g. the location API from a mobile operating
  ; system), a local data running in a TEE (e.g. a trusted location trusted app
  ; from a chipset vendor), a remote data provider such as a server (e.g.
  ; Google's geolocation API service), or entry by a human.
  "type": $source-type,

  ; A human readable string giving details about the source of the assertion
  ; data, e.g. the URL of the remote server that provided the data
  ? "details": tstr .size (1..max-tstr-length),
}

int-range = 1..5

rating-map = {
  ; "A value from 1 (worst) to 5 (best) of the rating of the item"
  "value":  int-range,

  ; A label-formatted string that describes the reason for the rating
  ? "code": $review-code,

  ; A human readable string explaining why the rating is what it is
  ? "explanation": tstr .size (1..max-tstr-length),
}

; The data structures used to store localization dictionaries
$localization-data-entry /= {
  * language-string
}

language-string /= tstr .size (1..max-tstr-length)
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
{
  "reference": {
      "url": "self#jumbf=c2pa.assertions/c2pa.metadata",
      "alg": "sha256",
      "hash": b64'hoOspQQ1lFTy/4Tp8Epx670E5QW5NwkNR+2b30KFXug='
    },
  "dataSource": {
    "type": "localProvider.REE",
    "details": "EXIF GPS data provided by operating system geolocation API"
  }
}
```

In most cases, this assertion specific metadata will appear directly inside of other assertions (e.g., ingredients) as the value of their `metadata` field. However, sometimes it is necessary or desirable to store the assertion metadata in a separate, independent assertion metadata assertion, such as when an assertion is not in JSON or CBOR, such as thumbnails.

The label for the assertion metadata assertion is `c2pa.assertion.metadata`.

<a id="_datetime"></a>
