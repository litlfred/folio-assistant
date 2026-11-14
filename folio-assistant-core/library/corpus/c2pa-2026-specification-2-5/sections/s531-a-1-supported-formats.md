---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s531-a-1-supported-formats
section_title: "A.1. Supported Formats"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10752-10807
source_sha256: ff401df19d1fde8c
granularity: heading
---
### A.1. Supported Formats

A C2PA Manifest is embedded into an asset as part of the C2PA Manifest Store for that asset.

When embedding the C2PA Manifest Store into an asset, the location will vary based on the type or format of the asset. The table below indexes well-known file formats, sorted alphabetically, by their IANA Media Type (where one is officially registered), their normative reference (where this specification cites one), and the specification section that defines the embedding location.

| Format | IANA Media Type | Normative Reference | Specification Section |
| --- | --- | --- | --- |
| Append-only JSONL streams | — | — | [Embedding manifests into append-only text files](#_embedding_manifests_into_append_only_text_files) |
| Append-only plain-text files (logs and event logs) | `text/plain` | — | [Embedding manifests into append-only text files](#_embedding_manifests_into_append_only_text_files) |
| AVI | — | [RIFF](https://www.loc.gov/preservation/digital/formats/fdd/fdd000025.shtml) | [Embedding manifests into RIFF-based assets](#_embedding_manifests_into_riff_based_assets) |
| DNG | — | [DNG](https://helpx.adobe.com/content/dam/help/en/camera-raw/digital-negative/jcr_content/root/content/flex/items/position/position-par/download_section_733958301/download-1/DNG_Spec_1_7_1_0.pdf) | [Embedding manifests into TIFF-based assets](#_embedding_manifests_into_tiff_based_assets) |
| EPUB | `application/epub+zip` | — | [Embedding manifests into ZIP-based formats](#_embedding_manifests_into_zip_based_formats) |
| `.facta` | `audio/vnd.blockfact.facta` | — | [Embedding manifests into .facti/.facta/.factv](#_embedding_manifests_into_facti_facta_factv) |
| `.facti` | `image/vnd.blockfact.facti` | — | [Embedding manifests into .facti/.facta/.factv](#_embedding_manifests_into_facti_facta_factv) |
| `.factv` | `video/vnd.blockfact.factv` | — | [Embedding manifests into .facti/.facta/.factv](#_embedding_manifests_into_facti_facta_factv) |
| FLAC | `audio/flac` | [ID3](https://id3.org/id3v2.3.0) | [Embedding manifests into ID3](#_embedding_manifests_into_id3) |
| Fonts (OFF, OpenType) | `font/otf`, `font/ttf` | [Open Font Format](https://www.iso.org/standard/74461.html), [OpenType](https://learn.microsoft.com/en-us/typography/opentype/spec/) | [Embedding manifests into fonts](#_embedding_manifests_into_fonts) |
| GIF | `image/gif` | [GIF](https://www.w3.org/Graphics/GIF/spec-gif89a.txt) | [Embedding manifests into GIFs](#_embedding_manifests_into_gifs) |
| HEIF | `image/heif` | [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) | [Embedding manifests into BMFF-based assets](#_embedding_manifests_into_bmff_based_assets) |
| HTML | `text/html` | [HTML](https://www.w3.org/TR/html/) | [Embedding Manifests into HTML](#embedding_manifests_into_html) |
| JPEG 1 | `image/jpeg` | [ISO/IEC 18477-3](https://www.iso.org/standard/66071.html) | [Embedding manifests into JPEG 1](#_embedding_manifests_into_jpeg_1) |
| JPEG XL | `image/jxl` | ISO/IEC 18181-2:2024, Clause 4 | [Embedding manifests into JPEG XL](#_embedding_manifests_into_jpeg_xl) |
| MOV | `video/quicktime` | [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) | [Embedding manifests into BMFF-based assets](#_embedding_manifests_into_bmff_based_assets) |
| MP3 | `audio/mpeg` | [ID3](https://id3.org/id3v2.3.0) | [Embedding manifests into ID3](#_embedding_manifests_into_id3) |
| MP4 | `video/mp4` | [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) | [Embedding manifests into BMFF-based assets](#_embedding_manifests_into_bmff_based_assets) |
| MP4 Audio (M4A) | `audio/mp4` | [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) | [Embedding manifests into BMFF-based assets](#_embedding_manifests_into_bmff_based_assets) |
| OGG Vorbis | `audio/ogg` | [RFC 3533](https://www.rfc-editor.org/rfc/rfc3533) | [Embedding manifests into OGG Vorbis](#_embedding_manifests_into_ogg_vorbis) |
| ONNX | — | [ONNX Intermediate Representation Specification, Version 10](https://onnx.ai/onnx/repo-docs/IR.html) | [Embedding manifests into ONNX](#_embedding_manifests_into_onnx) |
| OOXML | `application/vnd.openxmlformats-officedocument.*` (one per document type) | — | [Embedding manifests into ZIP-based formats](#_embedding_manifests_into_zip_based_formats) |
| Open Document | `application/vnd.oasis.opendocument.*` (one per document type) | — | [Embedding manifests into ZIP-based formats](#_embedding_manifests_into_zip_based_formats) |
| OpenXPS | `application/oxps` | — | [Embedding manifests into ZIP-based formats](#_embedding_manifests_into_zip_based_formats) |
| Other BMFF-based formats | — | [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html) | [Embedding manifests into BMFF-based assets](#_embedding_manifests_into_bmff_based_assets) |
| Other RIFF-based formats | — | [RIFF](https://www.loc.gov/preservation/digital/formats/fdd/fdd000025.shtml) | [Embedding manifests into RIFF-based assets](#_embedding_manifests_into_riff_based_assets) |
| Other TIFF-based formats | `image/tiff` | [TIFF/EP](https://www.iso.org/standard/29377.html) | [Embedding manifests into TIFF-based assets](#_embedding_manifests_into_tiff_based_assets) |
| Other ZIP-based formats | — | — | [Embedding manifests into ZIP-based formats](#_embedding_manifests_into_zip_based_formats) |
| Parquet | `application/vnd.apache.parquet` | [Apache Parquet File Format](https://parquet.apache.org/docs/file-format/) | [Embedding manifests into Parquet](#_embedding_manifests_into_parquet) |
| PDF | `application/pdf` | ISO 32000-2 | [Embedding manifests into PDFs](#_embedding_manifests_into_pdfs) |
| PNG | `image/png` | [PNG](https://www.w3.org/TR/png-3/) | [Embedding manifests into PNG](#_embedding_manifests_into_png) |
| SafeTensors | — | [SafeTensors Format Specification](https://huggingface.co/docs/safetensors/index) | [Embedding manifests into SafeTensors](#_embedding_manifests_into_safetensors) |
| Structured text (with comment or front-matter syntax) | `text/*` (excluding `text/html` and `text/vtt`, which have their own rows, `text/csv`, and append-only text files) | [RFC 9580, section 6.2](https://www.rfc-editor.org/rfc/rfc9580#section-6.2) | [Embedding Manifests into Structured Text](#embedding_manifests_into_structured_text) |
| SVG | `image/svg+xml` | [SVG](https://www.w3.org/TR/SVG11/) | [Embedding manifests into SVG](#_embedding_manifests_into_svg) |
| TTML | `application/ttml+xml` | [TTML2](https://www.w3.org/TR/ttml2/) | [Embedding manifests into TTML](#_embedding_manifests_into_ttml) |
| Unstructured text | — | — | [Embedding Manifests into Unstructured Text](#embedding_manifests_into_unstructured_text) |
| WAV and BWF | — | [RIFF](https://www.loc.gov/preservation/digital/formats/fdd/fdd000025.shtml) | [Embedding manifests into RIFF-based assets](#_embedding_manifests_into_riff_based_assets) |
| WARC | `application/warc` | [ISO 28500:2017](https://www.iso.org/standard/68004.html) | [Embedding manifests into WARC files](#embedding_manifests_into_warc) |
| WebP | `image/webp` | [RIFF](https://www.loc.gov/preservation/digital/formats/fdd/fdd000025.shtml) | [Embedding manifests into RIFF-based assets](#_embedding_manifests_into_riff_based_assets) |
| WebVTT | `text/vtt` | [WebVTT](https://www.w3.org/TR/webvtt1/) | [Embedding Manifests into Structured Text](#embedding_manifests_into_structured_text) |

> **NOTE:**
> Non-BMFF-based audio formats which are being considered for addition to this specification include the native container version of the Free Lossless Audio Codec (Native FLAC).

> **NOTE:**
> "—" in the IANA Media Type column means no media type for that format is officially registered with IANA (verified against the IANA Media Types registry at the time of writing) — this affects AVI, DNG, ONNX, SafeTensors, WAV, and BWF, none of which have a registered type despite informal/legacy strings sometimes used for them in the wild, plus the generic "other formats" rows, which are catch-alls rather than a single format. "—" in the Normative Reference column means the corresponding section of this specification does not cite a standard via a document attribute; PDF and the ZIP-based formats cite their standards (ISO 32000-2, ECMA-376, ISO/IEC 26300, etc.) as plain text instead.

<a id="_embedding_manifests_in_multi_part_assets"></a>
