---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s537-a-3-4-embedding-manifests-into-ttml
section_title: "A.3.4. Embedding manifests into TTML"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10854-10891
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.4. Embedding manifests into TTML

[TTML2](https://www.w3.org/TR/ttml2/) (Timed Text Markup Language) is an XML-based format for timed text (subtitles and captions) defined by the W3C. This section applies only to standalone TTML files with the media type `application/ttml+xml`. When TTML is carried as a timed-text track inside a BMFF-based container (e.g., MP4 or IMF), the C2PA Manifest Store shall be embedded in the outer BMFF container as described in [Section A.5, “Embedding manifests into BMFF-based assets”](#_embedding_manifests_into_bmff_based_assets); the rules in this section do not apply to that case.

As an XML-based format, it is necessary to Base64 encode the binary C2PA Manifest Store when embedding it. Where existing TTML processing toolchains (caption converters, broadcast playout systems, and transcoders) do not preserve foreign-namespace elements, but are otherwise likely to preserve TTML documents bit-for-bit, the use of an [external manifest](#_external_manifests) is preferred.

The C2PA Manifest Store shall be embedded as the Base64-encoded value of a `c2pa:manifest` element that is a child of the `tt:metadata` element within the `tt:head` element of the TTML document (i.e., at the path `/tt:tt/tt:head/tt:metadata/c2pa:manifest`). A `xmlns:c2pa = "http://c2pa.org/manifest"` namespace declaration shall be added to the root `tt:tt` element.

The presence of a `c2pa:manifest` element within `tt:metadata` shall not be treated as a conformance error by a C2PA implementation, even when the asset uses a constrained TTML profile such as IMSC 1.x or EBU-TT-D.

> **NOTE:**
> The `tt:metadata` element permits children from foreign namespaces in all TTML profiles. Validators for constrained profiles may not process or validate the `c2pa:manifest` element, but its presence is permitted.

Example 19. Example of a C2PA Manifest Store in a TTML document

An example of a C2PA Manifest Store in a TTML document (with the actual C2PA Manifest’s data left out).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tt:tt xml:lang="en"
    xmlns:tt="http://www.w3.org/ns/ttml"
    xmlns:c2pa="http://c2pa.org/manifest">
  <tt:head>
    <tt:metadata>
      <c2pa:manifest>...Base64 data goes here...</c2pa:manifest>
    </tt:metadata>
  </tt:head>
  <tt:body>
    <tt:div>
      <tt:p begin="00:00:01.000" end="00:00:04.000">Example subtitle text.</tt:p>
    </tt:div>
  </tt:body>
</tt:tt>
```

A claim generator embedding a manifest in a standalone TTML file shall include a [`c2pa.hash.data`](#_data_hash) assertion with a single exclusion range covering the `c2pa:manifest` element, read in binary mode. The exclusion range shall span from the opening `<c2pa:manifest>` tag to the closing `</c2pa:manifest>` tag, inclusive.

<a id="_embedding_manifests_into_id3"></a>
