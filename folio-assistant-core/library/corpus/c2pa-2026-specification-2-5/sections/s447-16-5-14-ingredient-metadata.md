---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s447-16-5-14-ingredient-metadata
section_title: "16.5.14. Ingredient Metadata"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8732-8783
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.14. Ingredient Metadata

As described in [assertion metadata](#_metadata_about_assertions), the `metadata` field of the ingredient assertion may contain metadata about the ingredient, such as the date and time when it was generated or other data that may help Manifest Consumers to make informed decisions about the provenance or veracity of the assertion data.

One common use for the `metadata` field is when only a portion of an ingredient is used in the creation or editing of an asset. In such cases, the `metadata` field should contain a `regionOfInterest` field (as described in [Section 16.9.1.5, “Region of Interest”](#_region_of_interest)) which describes the relevant portions of the ingredient that were used. An example of this can be found in [Example 14, “Example of ingredient with metadata containing regions”](#ingredient-metadata).

> **NOTE:**
> Although the field contains only a single region of interest, the `region-map` object can specify multiple regions as the values of its `region` field. This would be useful when multiple parts of a single ingredient are involved.

Example 14. Example of ingredient with metadata containing regions

An example of an ingredient containing a region of interest in its metadata, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
{
  "metadata": {
	"regionOfInterest" : {
  		"description": "10 seconds of audio",
		"region": [
			{
				"type": "temporal",
				"time": {
					"type": "npt",
					"start": "10",
					"end": "20"
				}
			},
			{
				"type": "identified",
				"item": {
					"identifier": "track_id",
					"value": "3"   
				} 
			}
		]
	}
  }
  "dc:format": "video/mp4",
  "relationship": "componentOf",
  "activeManifest" : {
      "url": "self#jumbf=/c2pa/urn:c2pa:98782815-5116-4d78-93de-3f5d8b4f4615",
      "hash": b64'TEWww2UCIR/e8mmR0XvzkFVZYTJ59Q8Ip4nkYxrS/Ys='
  },
  "claimSignature" : {
      "url": "self#jumbf=/c2pa/urn:c2pa:98782815-5116-4d78-93de-3f5d8b4f4615/c2pa.signature",
      "hash": b64'ICJkYzpmb3JtYXQiOiAiaW1hZ2UvanBlZyIsCiAgImR='
  },
  "validationResults": { ... }
}
```

<a id="_soft_bindings_2"></a>
