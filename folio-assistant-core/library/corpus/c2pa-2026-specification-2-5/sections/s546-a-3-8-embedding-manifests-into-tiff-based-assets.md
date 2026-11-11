---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s546-a-3-8-embedding-manifests-into-tiff-based-assets
section_title: "A.3.8. Embedding manifests into TIFF-based assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10997-11011
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.8. Embedding manifests into TIFF-based assets

The [DNG](https://helpx.adobe.com/content/dam/help/en/camera-raw/digital-negative/jcr_content/root/content/flex/items/position/position-par/download_section_733958301/download-1/DNG_Spec_1_7_1_0.pdf) format provides camera manufacturers to provide their camera raw formats in a standardized manner. DNG is based on which is based on [TIFF/EP](https://www.iso.org/standard/29377.html) (which is, itself, based on [TIFF v6](https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf)). An Exif uncompressed file ([Exif](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-008-2026-E), Section 3.2) is also based on TIFF.

The C2PA Manifest Store shall be embedded into a TIFF-compatible file (i.e., Exif uncompressed file ([Exif](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-008-2026-E), Section 3.2), [TIFF/EP](https://www.iso.org/standard/29377.html), [DNG](https://helpx.adobe.com/content/dam/help/en/camera-raw/digital-negative/jcr_content/root/content/flex/items/position/position-par/download_section_733958301/download-1/DNG_Spec_1_7_1_0.pdf) or other TIFF-based RAW formats) as the data of a tag with ID 52545 (decimal) or 0xCD41 (hexadecimal), with a tag type of 7.

> **NOTE:**
> The value of the `ByteOrder` field in the TIFF header does not govern the endianness of the embedded C2PA Manifest Store.

Although TIFF supports the concept of multiple pages or layers (via chaining main IFDs), there shall only be one C2PA Manifest Store for the entire asset - not one per IFD. As such, the C2PA IFD Entry shall always be located within the last IFD of the main-IFD chain in the asset. If only one single main IFD is present, the C2PA IFD Entry shall be located within that IFD or be the only entity within a new IFD following the existing single main IFD. Otherwise, the C2PA IFD Entry shall be the only entry in its IFD. To support update manifests, the C2PA Manifest Store should be located at the end of the file; this ensures that changes to the size of the C2PA Manifest Store do not impact any of the other tag offsets.

> **NOTE:**
> Previous versions of this specification required or prevented the use of IFD 0, but it was recognized that doing so restricted its use in TIFF-based RAW formats.

<a id="_embedding_manifests_into_riff_based_assets"></a>
