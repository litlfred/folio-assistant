---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s442-16-5-13-3-adding-manifest-references-to-the-ingr
section_title: "16.5.13.3. Adding manifest references to the ingredient assertion"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8587-8619
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.5.13.3. Adding manifest references to the ingredient assertion

If the active manifest of the ingredient has been copied into the asset’s C2PA Manifest Store, then a [URI reference](#_uri_references) to the ingredient’s active [C2PA Manifest box](#_serialization) shall be stored as the value of the `activeManifest` field in the ingredient assertion, and an additional [URI reference](#_uri_references) to the active Manifest’s [C2PA Claim Signature box](#_serialization) shall be stored as the value of `claimSignature`.

For a C2PA Manifest present in the C2PA Manifest Store, ``hashed_uri`s shall be used as the values for both of the ingredient assertion’s `activeManifest`` and `claimSignature` fields.

> **NOTE:**
> Providing both values enables efficient ingredient validation and also supports validation if one of the ingredient’s assertions were redacted.

In the case where an ingredient has an associated active manifest, it can be used to identify the `digitalSourceType` of the ingredient (through the assertions contained therein). However, in those cases where an ingredient is being added without a manifest, the ingredient assertion may include a `digitalSourceType` key, whose value shall be one of those allowed for the corresponding action field ([Section 16.4.1.4.5, “Digital Source Type”](#_digital_source_type)). An example of this can be found in [Example 12, “Example of ingredient with a digitalSourceType”](#ingredient-dst).

> **NOTE:**
> This approach is useful in scenarios where, as part of the asset creation process, an ingredient asset is created under the control of the signer, but without its own C2PA Manifest. Providing a `digitalSourceType` in the ingredient assertion makes a similar statement about the ingredient’s nature as signing a full C2PA Manifest for the ingredient in which the only action is `c2pa.created` with the same `digitalSourceType`.

An ingredient assertion shall not contain both an `activeManifest` and a `digitalSourceType` key.

Example 12. Example of ingredient with a digitalSourceType

An example of an ingredient containing a digitalSourceType identifying it as generative AI, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// ingredient v3 (componentOf, no activeManifest, with digitalSourceType) //
{
  "dc:format": "image/jpeg",
  "relationship": "componentOf",
  "digitalSourceType" : "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"
}
```

> **NOTE:**
> By including an ingredient assertion containing a `digitalSourceType` value in `created_assertions`, the signer is asserting that the ingredient has that specified `digitalSourceType`.

<a id="_ingredient_validation"></a>
