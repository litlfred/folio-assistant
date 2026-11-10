---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s757-g-7-3-validation-result-structures
section_title: "G.7.3. Validation Result Structures"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15931-15988
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.7.3. Validation Result Structures

```cddl
; custom status codes
$status-code /= tstr .regexp "([\\da-zA-Z_-]+\\.)+[\\da-zA-Z_-]+"

status-map = {
  "code": $status-code,         ; A label-formatted string that describes the status

  ; At most one of "url" and "resourceUrl" may be present.
  ; "url": JUMBF URI reference to the JUMBF box to which this status code applies.
  ; "resourceUrl": the "url" or "uri" value of the specific entry (for example, in a
  ; linked resource integrity assertion) to which this status code applies.
  (
    ? "url": jumbf-uri-type //
    ? "resourceUrl": tstr .size (1..max-tstr-length)
  ),

  ? "explanation": tstr .size (1..max-tstr-length), ; A human readable string explaining the status
  ? "success": bool             ; DEPRECATED. Does the code reflect success (true) or failure (false)
}

status-codes-map = {
    "success": [* status-map],          ; an array of validation success codes. May be empty.
    "informational": [* status-map],    ; an array of validation informational codes. May be empty.
    "failure": [* status-map]           ; an array of validation failure codes. May be empty.
}

; Objects containing validation results for a manifest and its ingredients

; Definition of a SemVer formatted regex (used in a few places)
semver-string = tstr .regexp "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$" ; Matches a SemVer version string.

; A trust list used to validate certificates in the trust chain, identified by URI and type
trust-list-uri-map = {
    "uri": tstr .size (1..max-tstr-length), ; URI identifying the trust list
    "type": tstr .regexp "([\\da-zA-Z_-]+\\.)+[\\da-zA-Z_-]+" ; label identifying the type of trust list (e.g. a C2PA-defined type such as `c2pa.trustList` or `c2pa.tsaTrustList, or a custom type using reverse-domain notation)
    ? "identifier": tstr .size (1..max-tstr-length) ; A unique identifier for a specific instance of the trust list, which may be a version number, a hash, or other unique identifier
}

validation-results-map = {
    ? "activeManifest": status-codes-map, ; Validation status codes for the ingredient's active manifest. Present if ingredient is a C2PA asset. Not present if the ingredient is not a C2PA asset.
    ? "ingredientDeltas": [* ingredient-delta-validation-result-map], ; List of any changes/deltas between the current and previous validation results for each ingredient's manifest. Present if ingredient is a C2PA asset.
    ? "specVersion": semver-string, ; The version of the specification against which the validation was performed (SemVer formatted string)
    ? (
        "trustListUri": tstr .size (1..max-tstr-length) ; DEPRECATED. URI to the trust list that was used to validate certificates
        //
        "trustListUris": [+ trust-list-uri-map] ; trust list(s) used to validate the certificates in the trust chain
      )
}

ingredient-delta-validation-result-map = {
    "ingredientAssertionURI": jumbf-uri-type,  ; JUMBF URI reference to the ingredient assertion
    "validationDeltas": status-codes-map       ; Validation results for the ingredient's active manifest
}
```

<a id="_live_media"></a>
