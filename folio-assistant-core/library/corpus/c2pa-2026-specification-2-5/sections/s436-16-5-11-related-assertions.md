---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s436-16-5-11-related-assertions
section_title: "16.5.11. Related Assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8487-8524
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 16.5.11. Related Assertions

In cases where there are other assertions in the active manifest that should be understood as being about an ingredient rather than about the current asset, the claim generator may reference those assertions using the `relatedAssertions` field of the ingredient assertion. The value of this field shall be an array of one or more hashed JUMBF URIs, each referencing an assertion, in the same C2PA Manifest, that is neither an ingredient nor an action assertion.

An ingredient assertion can contain both an `activeManifest` and a `relatedAssertions` key. However, assertions about an ingredient should appear in the ingredient’s manifest whenever possible.

> **NOTE:**
> If the same assertion type appears in the C2PA Manifest pointed to by `activeManifest` and the `relatedAssertions` referenced in the ingredient assertion, handling of any conflict is implementation dependent.

Each assertion referenced by `relatedAssertions` shall have a label ending in `.ingredient`, following the same naming convention used for [ingredient thumbnails](#thumbnail_assertion) (see [Section 8.2, “Labels”](#assertion_labels)). For example, a `c2pa.ai-disclosure` assertion that is about an ingredient, rather than about the current asset, would have the label `c2pa.ai-disclosure.ingredient`. This also applies to [entity-specific namespaces](#_namespacing), such as `com.litware.metadata.ingredient` would be valid. This label component shall follow the usual [rules for assertion labels](#_multiple_instances) with respect to multiple instances (e.g., `c2pa.ai-disclosure.ingredient__1` or `com.litware.metadata.ingredient__1` for a second such instance).

> **NOTE:**
> One use case is when the ingredient comes from a tool that is not C2PA-compliant but the claim generator needs to assert some information about that ingredient, such as that found in a `c2pa.ai-disclosure` assertion.

> **NOTE:**
> When the multiple instance naming occurs, it is not expected that the numbering for assertions match the numbering for a given assertion, such as `c2pa.thumbnail.ingredient__4` could be for `c2pa.ingredient__1`.

Example 11. Example of ingredient with a related assertion

An example of an ingredient with a `relatedAssertions` field referencing a `c2pa.ai-disclosure.ingredient` assertion, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// ingredient v3 (inputTo, no activeManifest, with a relatedAssertions entry) //
{
  "dc:format": "image/jpeg",
  "relationship": "inputTo",
  "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
  "relatedAssertions": [
    {
      "url": "self#jumbf=c2pa.assertions/c2pa.ai-disclosure.ingredient",
      "alg": "sha256",
      "hash": b64'UjRAYWiAq4lfCRDmksWAlDJN/XtHHFFwMWymsZsm3j8='
    }
  ]
}
```

<a id="_existing_manifests"></a>
