---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s714-g-2-1-claim
section_title: "G.2.1. Claim"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 13925-14023
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.2.1. Claim

```cddl
; CDDL schema for a claim map in C2PA
claim-map-v2 = {
  ; uniquely identifies a specific version of an asset
  "instanceID": tstr .size (1..max-tstr-length),

  ; the claim generator of this claim
  "claim_generator_info": generator-info-map,

  ; JUMBF URI reference to the signature of this claim
  "signature": jumbf-uri-type,
  "created_assertions": [1* $hashed-uri-map],
  ? "gathered_assertions": [1* $hashed-uri-map],

  ; name of the asset (metadata assertion preferred)
  ? "dc:title": tstr .size (1..max-tstr-length),

  ; List of JUMBF URI references to the assertions of ingredient manifests being
  ; redacted
  ? "redacted_assertions": [1* jumbf-uri-type],

  ; A string identifying the cryptographic hash algorithm used to compute all
  ; data hash assertions listed in this claim unless otherwise overridden, taken
  ; from the C2PA data hash algorithm identifier registry. This provides the
  ; value for the 'alg' field in data-hash and hashed-uri structures contained
  ; in this claim
  ? "alg": tstr .size (1..max-tstr-length),

  ; A string identifying the algorithm used to compute all soft binding
  ; assertions listed in this claim unless otherwise overridden, taken from the
  ; C2PA soft binding algorithm identifier registry."
  ? "alg_soft": tstr .size (1..max-tstr-length),

  ; (DEPRECATED) The version of the specification used to produce this claim
  ; (SemVer)
  ? "specVersion": semver-string,

  ; (DEPRECATED) additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

; (DEPRECATED) CDDL schema for a claim map in C2PA
claim-map = {
  ; A User-Agent string formatted as per
  ; http://tools.ietf.org/html/rfc7231#section-5.5.3, for including the name and
  ; version of the claims generator that created the claim
  "claim_generator": tstr,
  "claim_generator_info": [1* generator-info-map],

  ; JUMBF URI reference to the signature of this claim
  "signature": jumbf-uri-type,
  "assertions": [1* $hashed-uri-map],
  "dc:format": tstr, ; media type of the asset

  ; uniquely identifies a specific version of an asset
  "instanceID": tstr .size (1..max-tstr-length),
  ? "dc:title": tstr .size (1..max-tstr-length), ; name of the asset

  ; List of JUMBF URI references to the assertions of ingredient manifests being
  ; redacted
  ? "redacted_assertions": [1* jumbf-uri-type],

  ; A string identifying the cryptographic hash algorithm used to compute all
  ; data hash assertions listed in this claim unless otherwise overridden, taken
  ; from the C2PA data hash algorithm identifier registry. This provides the
  ; value for the 'alg' field in data-hash and hashed-uri structures contained
  ; in this claim
  ? "alg": tstr .size (1..max-tstr-length),

  ; A string identifying the algorithm used to compute all soft binding
  ; assertions listed in this claim unless otherwise overridden, taken from the
  ; C2PA soft binding algorithm identifier registry."
  ? "alg_soft": tstr .size (1..max-tstr-length),

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

generator-info-map = {
  ; A human readable string naming the claim generator
  "name": tstr .size (1..max-tstr-length),
  ? "version": tstr, ; A human readable string of the product's version

  ; hashed URI to the icon (either embedded or remote)
  ? "icon": $hashed-uri-map / $hashed-ext-uri-map,

  ; A human readable string of the operating system the claim generator is
  ; running on
  ? "operating_system": tstr,

  ; The version of the specification used to produce this manifest (SemVer)
  ? "specVersion": semver-string,
  * tstr => any
}
```

<a id="cddl_annex_tst_container"></a>
