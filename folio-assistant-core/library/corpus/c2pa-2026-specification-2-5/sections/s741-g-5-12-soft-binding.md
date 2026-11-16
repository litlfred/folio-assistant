---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s741-g-5-12-soft-binding
section_title: "G.5.12. Soft Binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15281-15361
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.12. Soft Binding

```cddl
; Align regions-of-interest object structure in soft-binding assertions with
; that used for other purposes
; # include regions-of-interest

; The data structure used to store one or more soft bindings across some or all
; of the asset's content
soft-binding-map = {
  ; A string identifying the soft binding algorithm and version of that
  ; algorithm used to compute the value, taken from the C2PA soft binding
  ; algorithm list. If this field is absent, the algorithm is taken from the
  ; `alg_soft` value of the enclosing structure. If both are present, the field
  ; in this structure is used. If no value is present in any of these places,
  ; this structure is invalid; there is no default.
  "alg": tstr,
  "blocks": [1* soft-binding-block-map],
  ? "pad": bytes, ; zero-filled byte string used for filling up space
  ? "pad2": bytes, ; zero-filled byte string used for filling up space

  ; (optional) a human-readable description of what this hash covers
  ? "name": tstr .size (1..max-tstr-length),

  ; (optional) CBOR byte string describing parameters of the soft binding
  ; algorithm.
  ? "alg-params": bstr,

  ; (optional) Additional metadata of the soft binding. Useful for
  ; binding-specific information
  ? "bindingMetadata": soft-binding-metadata-map,
  ? "url": uri, ; Unused and deprecated.

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

soft-binding-block-map = {
  "scope": soft-binding-scope-map,

  ; CBOR byte string describing, in algorithm specific format, the value of the
  ; soft binding computed over this block of digital content"
  "value": bstr,
}

soft-binding-scope-map = {
  ; deprecated, CBOR byte string describing, in algorithm specific format, the
  ; part of the digital content over which the soft binding value has been
  ; computed"
  ? "extent": bstr,
  ? "timespan":soft-binding-timespan-map,
  ? "region": region-map, ; CBOR object defined in regions-of-interest.cddl
}

soft-binding-timespan-map = {
  ; Start of the time range (as milliseconds from media start) over which the
  ; soft binding value has been computed.
  "start": uint,

  ; End of the time range (as milliseconds from media start) over which the soft
  ; binding value has been computed.
  "end": uint,
}

soft-binding-metadata-map = {
  ; Additional description of the implementation or author of the binding or the
  ; algorithm
  ? "description": tstr .size (1..max-tstr-length)

  ; Contact information for the implementation or author of the binding or the
  ; algorithm,
  ? "contact": tstr .size (1..max-tstr-length)

  ; A web page containing more details about the implementation or author of the
  ; binding or the algorithm.
  ? "informationalUrl": tstr .size (1..max-tstr-length)
* tstr => any
}
```

<a id="cddl_annex_environmental_sustainability"></a>
