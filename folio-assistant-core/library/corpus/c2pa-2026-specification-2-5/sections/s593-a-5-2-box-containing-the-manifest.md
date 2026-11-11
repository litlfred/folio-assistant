---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s593-a-5-2-box-containing-the-manifest
section_title: "A.5.2. Box Containing the Manifest"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11578-11601
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.5.2. Box Containing the Manifest

Encompassing the `box_purpose` values of `'manifest'`, `'original'`, and `'update'`. The `ContentProvenanceBoxPayload` contains the raw C2PA Manifest Store bytes followed by zero or more padding bytes. Padding bytes are not permitted outside this box unless they are contained within their own box such as a `'free'` box. When a `ContentProvenanceBox` is found with a `box_purpose` of `original` it indicates that there is another `ContentProvenanceBox` whose `box_purpose` is `update`.

A `ContentProvenanceBox` with box\_purpose set to `manifest` or `original` shall be placed after the `'ftyp'` box and positioned according to the asset’s structure:

For assets with a 'moov' box

It shall appear either before the first 'mdat' or 'moov' box, or adjacent to the 'moov' box.

For assets without a 'moov' box

It shall appear before the first 'mdat' box.

A `ContentProvenanceBox` with a `box_purpose` of `update` shall be the last top-level box of the asset.

If a `ContentProvenanceBox` with a `box_purpose` of `'manifest'` is not the last box of the asset, [Update Manifests](#_update_manifests) are supported by changing the `box_purpose` from `manifest` to `original` and the active manifest shall be stored within a new `ContentProvenanceBox` with a `box_purpose` of `update`.

> **NOTE:**
> The `'original'` and `'manifest'` boxes are identical apart from value of `box_purpose` and as such hash bindings are not changed. No hashed data is moved by appending the new `update` box.

For fragmented MP4 (fMP4) files, for each initialization segment that may be present, an identical `ContentProvenanceBox` of type `manifest` shall be present for 'pull' (typical) usage; the C2PA Manifest Store shall be identical. For fragmented MP4 (fMP4) streams that are live media transmissions in a 'push' streaming scenario (e.g., over-the-air broadcast television without a pull mechanism), the manifest box need not be included in every initialization segment broadcast, but it shall be included in no fewer than one in every 10 initialization segments.

<a id="_auxiliary_c2pa_boxes_for_large_and_fragmented_files"></a>
