---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s733-g-5-4-ingredient
section_title: "G.5.4. Ingredient"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14804-14936
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.4. Ingredient

```cddl
; Version 3 (v3) of the ingredient assertion
; Assertion that describes an ingredient used in the asset
ingredient-map-v3 = {
  ? "dc:title": tstr, ; name of the ingredient
  ? "dc:format": format-string, ; Media Type of the ingredient

  ; The relationship of this ingredient to the asset it is an ingredient of.
  "relationship": $relation-choice,

  ; Results from the claim generator performing full validation on the
  ; ingredient asset. May be present whether or not `activeManifest` is
  ; present.
  ? "validationResults": validation-results-map,

  ; unique identifier such as the value of the ingredient's `xmpMM:InstanceID`
  ? "instanceID": tstr,

  ; hashed_uri reference to an embedded data assertion or a hashed_ext_uri to
  ; external data
  ? "data" : $hashed-uri-map / $hashed-ext-uri-map,

  ; additional information about the data's type to the ingredient V3 structure
  ? "dataTypes": [1* asset-type-map],

  (
    ; hashed_uri to the box corresponding to the active manifest of the
    ; ingredient. Cannot be combined with `digitalSourceType`.
    ? "activeManifest": $hashed-uri-map
  //
    ; One of the source types defined at
    ; https://cv.iptc.org/newscodes/digitalsourcetype/ or in this specification.
    ; Cannot be combined with `activeManifest`.
    ? "digitalSourceType": tstr .size (1..max-tstr-length)
  ),

  ; hashed JUMBF URI(s) to assertion(s) related to this ingredient that are
  ; neither ingredients nor actions.
  ? "relatedAssertions": [1* $hashed-uri-map],

  ; hashed_uri to the Claim Signature box in the C2PA Manifest of the ingredient
  ? "claimSignature": $hashed-uri-map,

  ; hashed_uri reference to a thumbnail in a embedded data assertion
  ? "thumbnail": $hashed-uri-map,

  ; Additional description of the ingredient
  ? "description": tstr .size (1..max-tstr-length),

  ; URI to an informational page about the ingredient or its data
  ? "informationalURI": tstr .size (1..max-tstr-length),
  ? "softBindingsMatched": bool, ; Whether soft bindings were matched

  ; Array of algorithm names used for discovering the active manifest
  ? "softBindingAlgorithmsMatched": [1* tstr],

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map
}

; (DEPRECATED) Version 2 (v2) of the ingredient assertion
; Assertion that describes an ingredient used in the asset
ingredient-map-v2 = {
  "dc:title": tstr, ; name of the ingredient
  "dc:format": format-string, ; Media Type of the ingredient

  ; The relationship of this ingredient to the asset it is an ingredient of.
  "relationship": $relation-choice,
  ? "documentID": tstr, ; value of the ingredient's `xmpMM:DocumentID`

  ; unique identifier, such as the value of the ingredient's `xmpMM:InstanceID`
  ? "instanceID": tstr,

  ; hashed_uri reference to an embedded data assertion or a hashed_ext_uri to
  ; external data
  ? "data" : $hashed-uri-map / $hashed-ext-uri-map,

  ; additional information about the data's type to the ingredient V2 structure.
  ? "data_types": [1* asset-type-map],

  ; hashed_uri reference to the C2PA Manifest of the ingredient
  ? "c2pa_manifest": $hashed-uri-map,

  ; hashed_uri reference to a thumbnail in a embedded data assertion
  ? "thumbnail": $hashed-uri-map,
  ? "validationStatus": [1* status-map] ; validation status of the ingredient

  ; Additional description of the ingredient
  ? "description": tstr .size (1..max-tstr-length)

  ; URI to an informational page about the ingredient or its data
  ? "informational_URI": tstr .size (1..max-tstr-length)

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map
}

; (DEPRECATED) Version 1 of the ingredient assertion
; Assertion that describes an ingredient used in the asset
ingredient-map = {
  "dc:title": tstr, ; name of the ingredient
  "dc:format": format-string, ; Media Type of the ingredient
  ? "documentID": tstr, ; value of the ingredient's `xmpMM:DocumentID`

  ; unique identifier, such as the value of the ingredient's `xmpMM:InstanceID`
  "instanceID": tstr,

  ; The relationship of this ingredient to the asset it is an ingredient of.
  "relationship": $relation-choice,

  ; hashed_uri reference to the C2PA Manifest of the ingredient
  ? "c2pa_manifest": $hashed-uri-map,

  ; hashed_uri reference to an ingredient thumbnail
  ? "thumbnail": $hashed-uri-map,
  ? "validationStatus": [1* status-map] ; validation status of the ingredient

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map
}

format-string = tstr .regexp "^\\w+\/[-+.\\w]+$"

; Choices that describe the reason for how the ingredient is related to the
; asset
$relation-choice /= "parentOf"
$relation-choice /= "componentOf"
$relation-choice /= "inputTo"
```

<a id="cddl_annex_asset_ref"></a>
