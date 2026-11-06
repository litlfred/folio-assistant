---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s547-a-3-9-embedding-manifests-into-riff-based-assets
section_title: "A.3.9. Embedding manifests into RIFF-based assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11012-11021
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.9. Embedding manifests into RIFF-based assets

The [RIFF](https://www.loc.gov/preservation/digital/formats/fdd/fdd000025.shtml) format provides a generic container format for storing data in tagged chunks. It is primarily used to store multimedia such as images, sound and video. It serves as the container format for [WAV](https://en.wikipedia.org/wiki/WAV), [BWF, Broadcast Wave](https://en.wikipedia.org/wiki/Broadcast_Wave_Format), [AVI](https://en.wikipedia.org/wiki/Audio_Video_Interleave) and [WebP](https://en.wikipedia.org/wiki/WebP).

> **NOTE:**
> RIFF is based on an older format called [IFF](https://en.wikipedia.org/wiki/Interchange_File_Format).

The C2PA Manifest Store shall be embedded into a RIFF-compatible file (i.e., WAV, AVI or WebP) as the data of a chunk with an identifier of `C2PA`. For compatibility reasons, this C2PA chunk shall appear as the last sub-chunk of the first RIFF header chunk.

<a id="_embedding_manifests_into_gifs"></a>
