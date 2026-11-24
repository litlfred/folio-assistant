---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s429-16-5-6-schema-and-example
section_title: "16.5.6. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8148-8367
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.6. Schema and Example

The [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) for this type is shown below (see [Section G.5.4, “Ingredient”](#cddl_annex_ingredient) for the complete normative schema, including all versions):

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

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
{
  "metadata": {
    "dateTime": 0("2021-06-28T16:49:32.874Z"),
    "reviewRatings": [
      {
        "value": 5,
        "explanation": "Content bindings validated"
      }
    ]
  },
  "dc:format": "image/jpeg",
  "thumbnail": {
      "url": "self#jumbf=c2pa.assertions/c2pa.thumbnail.ingredient",
      "hash": b64'UjRAYWiAq4lfCRDmksWAlDJN/XtHHFFwMWymsZsm3j8='
  },
  "relatedAssertions": [
    {
      "url": "self#jumbf=c2pa.assertions/c2pa.thumbnail.ingredient",
      "hash": b64'UjRAYWiAq4lfCRDmksWAlDJN/XtHHFFwMWymsZsm3j8='
    }
  ],
  "relationship": "parentOf",
  "activeManifest": {
      "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322",
      "hash": b64'1kjJTO108b71cL95UxgfHD3eDgk9VrCedW8n3fYTRMk='
  },
  "claimSignature": {
      "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.signature",
      "hash": b64'85KAvU3+3YgtIjj6IV0fzKwj8si/85+gevVSK2Iw+S0='
  },
  "validationResults": {
    "activeManifest": {
      "success": [
      {
        "code": "claimSignature.validated",
        "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.signature"
      },{
        "code": "signingCredential.trusted",
        "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.signature"
      },{
        "code": "timeStamp.validated",
        "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.signature"
      },{
        "code": "timeStamp.trusted",
        "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.signature"
      },{
        "code": "assertion.hashedURI.match",
        "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.assertions/c2pa.ingredient.v3"
      }
      ],
      "informational": [{
        "code": "signingCredential.ocsp.skipped",
        "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.signature"
      }],
      "failure": []
    },
    "ingredientDeltas": [{
      "ingredientAssertionURI": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322/c2pa.assertions/c2pa.ingredient.v3",
      "validationDeltas": {
        "success": [],
        "informational": [],
        "failure": [{
          "code": "assertion.hashedURI.mismatch",
          "url": "self#jumbf=/c2pa/urn:c2pa:F095F30E-6CD5-4BF7-8C44-CE8420CA9FB7/c2pa.assertions/c2pa.metadata"
      }]
      }
    },{
      "ingredientAssertionURI": "self#jumbf=/c2pa/urn:c2pa:F095F30E-6CD5-4BF7-8C44-CE8420CA9FB7/c2pa.assertions/c2pa.ingredient.v3",
      "validationDeltas": {
        "success": [],
        "informational": [],
        "failure": [{
          "code": "signingCredential.untrusted",
          "url": "self#jumbf=/c2pa/urn:c2pa:72C28A7C-7F5B-4301-B373-3183C10AF7C5/c2pa.signature"
      }]
      }
    }
    ]
  }
}
```

<a id="_description_field"></a>
