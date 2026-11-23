---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s394-16-4-1-4-8-parameters
section_title: "16.4.1.4.8. Parameters"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6798-6856
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.4.8. Parameters

An action may include a `parameters` key that provides for the specification of some action-specific information via some pre-defined as well as the open-ended inclusion of any custom fields (and their associated values). Custom fields shall conform to the same syntax as [entity-specific namespacing](#_namespacing), e.g. `com.litware.someFieldName`.

> **NOTE:**
> This is useful for providing extra information that would be useful to a specific workflow or C2PA Manifest Consumer.

A claim generator that performs the same action over and over, with the same parameters & settings, may use the `multipleInstances` field to indicate that the action was performed multiple times or not. If the `multipleInstances` field is not present, then it is unknown whether the action was performed multiple times.

When using a `c2pa.opened` or `c2pa.placed` action, the `ingredient` field (for v1) or `ingredients` field (for v2) in the `parameters` object shall contain the hashed JUMBF URIs to one or more related ingredient assertions. In a `c2pa.deleted` action, if the deletion covers all of the content of an ingredient added in a previous manifest, this field may contain the hashed JUMBF URI to a `componentOf` ingredient assertion of that ingredient.

In some cases, only a portion of an ingredient is relevant to the action; in such cases the ingredient assertion should contain [assertion metadata](#_metadata_about_assertions) containing a `regionOfInterest` field specifying the relevant regions of the ingredient (as described in [Section 16.5.14, “Ingredient Metadata”](#_ingredient_metadata)).

> **NOTE:**
> In previous versions of this specification, `c2pa.transcoded` and `c2pa.repackaged` actions were required to reference the `parentOf` ingredient assertion referenced by the preceding `c2pa.opened` action; claim generators can do so for compatibility with older validators.

When using a `c2pa.translated` action, the `sourceLanguage` and `targetLanguage` fields in the `parameters` object shall contain [RFC 5646, BCP 47](https://www.rfc-editor.org/rfc/rfc5646) language codes.

An action may include a `name` field in the `parameters` object to provide a machine-readable identifier that sub-classifies the action. The `name` field complements the human-readable `description` field; where `description` provides free text for display, `name` provides a stable token suitable for programmatic use. Claim generators that record tool or operation identifiers in entity-specific parameter keys (e.g. `com.litware.tool`) may use the `name` field instead for interoperability. Values of `name` may be any string; values conforming to the syntax of [entity-specific namespacing](#_namespacing) may also be used.

Example 5. Example of an action for Generative AI

The `c2pa.created` action for an image created by a Generative AI model, could look like this, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// an actions assertion used to describe output of Generative AI //
{
  "actions": [
    {
      "action": "c2pa.created",
      "when": 0("2023-02-11T09:00:00Z"),
      "softwareAgent" : {
          "name": "Joe's Photo Editor",
          "version": "2.0",
          "operating_system": "Windows 10"
      },
      "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
      "parameters" : {
        "ingredients" : [ 
          {
            "url": "self#jumbf=c2pa.assertions/c2pa.ingredient.v3", 
            "alg": "sha256",
            "hash" : b64'...',
          },
          {
            "url": "self#jumbf=c2pa.assertions/c2pa.ingredient.v3__1", 
            "alg": "sha256",
            "hash" : b64'...',
          }
        ]
      }
    }
  ]
}
```

When using a `c2pa.redacted` action, the `redacted` field in the `parameters` object shall contain the JUMBF URI to the assertion that has been redacted.

<a id="related_assertions"></a>
