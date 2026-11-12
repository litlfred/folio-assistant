---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s592-a-5-1-2-syntax
section_title: "A.5.1.2. Syntax"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11536-11577
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.5.1.2. Syntax

```none
aligned(8) class ContentProvenanceBoxHeader(string box_purpose) {
    string box_purpose;

    if (box_purpose == 'manifest' || box_purpose == 'original') {
        unsigned int(64) first_merkle_aux_offset;
    }
}

aligned(8) class ContentProvenanceBox(string box_purpose) extends FullBox (
        boxtype = 'uuid', v = 0, f = 0,
        extended_type = 0xD8 0xFE 0xC3 0xD6 0x1B 0x0E 0x48 0x3C 0x92 0x97 0x58 0x28 0x87 0x7E 0xC4 0x81) {
    ContentProvenanceBoxHeader(box_purpose)
    // the remaining bytes are the ContentProvenanceBoxPayload
}
```

`ContentProvenanceBoxPayload` is defined as all the bytes in a ContentProvenanceBox, included by the `size` or `largesize` field (as appropriate), following the `ContentProvenanceBoxHeader`.

The `box_purpose` is a null terminated string which indicates what and how to use the contents of the `ContentProvenanceBoxPayload`. The valid values are as follows:

`manifest`

The C2PA Manifest Store

`original`

The original C2PA Manifest Store when the asset has gone through an update workflow

`update`

The supplementary C2PA Manifest Store containing one or more [Update Manifests](#_update_manifests) used when the asset has gone through an update workflow

`merkle`

CBOR-encoded auxiliary information used to process Merkle-tree based validation

The `first_merkle_aux_offset` shall be set to the absolute file byte offset to the first `ContentProvenanceBox` with `box_purpose` set to `merkle`. If the file contains no such boxes it shall be set to zero.

<a id="_box_containing_the_manifest"></a>
