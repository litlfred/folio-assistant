---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s404-16-4-1-10-soft-binding-lookup
section_title: "16.4.1.10. Soft Binding Lookup"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7057-7111
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.10. Soft Binding Lookup

When performing either a `c2pa.opened` or `c2pa.placed` action with an asset that does not contain a C2PA Manifest, the claim generator may use a soft binding lookup to find the C2PA Manifest for that asset. If successful, the claim generator should add the located C2PA Manifest as the value of the `activeManifest` field in the ingredient assertion. If it does so, then the ingredient assertion shall also contain a `softBindingsMatched` field with a value of true and a `softBindingAlgorithmsMatched` whose value contains at least one entry in the array.

> **NOTE:**
> Adding these fields indicates to the C2PA Manifest consumer that soft binding lookup was used.

> **NOTE:**
> Since most soft binding recovered manifests will contain a hard binding assertion that does not match the asset being looked up, it is to be expected that validation failures will be reported in the ingredient assertion.

An example of an ingredient action showing that its manifest was retrieved via soft binding, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// an ingredient assertion that had its manifest recovered via soft-binding //
{
  "dc:format": "image/jpeg",
  "relationship": "parentOf",
  "softBindingsMatched": true,
  "softBindingAlgorithmsMatched": [
    "com.foo.watermark.1"
  ]
  "activeManifest": {
      "url": "self#jumbf=/c2pa/urn:c2pa:5E7B01FC-4932-4BAB-AB32-D4F12A8AA322",
      "hash": b64'1kjJTO108b71cL95UxgfHD3eDgk9VrCedW8n3fYTRMk='
  },
}



// an actions assertion pointing to the ingredient //
{
  "actions": [
    {
      "action": "c2pa.opened",
      "when": 0("2025-04-07T09:00:00Z"),
      "softwareAgent": {
        "name": "Joe's Photo Editor",
        "version": "2.0",
        "operating_system": "Windows 10"
      },
      "parameters": {
        "ingredients": [
          {
            "url": "self#jumbf=c2pa.assertions/c2pa.ingredient.v3",
            "alg": "sha256",
            "hash": "b64'...'"
          }
        ]
      }
    }
  ]
}
```

<a id="_removing_previous_ingredients"></a>
