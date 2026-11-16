---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s458-16-6-2-2-1-description
section_title: "16.6.2.2.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8843-8872
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.6.2.2.1. Description

This type is used to reference "Original Preservation Image(OPI)" in [Exif](https://www.cipa.jp/std/documents/download_e.html?CIPA_DC-008-2026-E). The OPI is introduced for recording authenticity of the image at the time of capture in which subsequent post image processing is not applied, along with metadata that describes image properties. This enables users to recognize the difference between the image at the time of capture and the main image developed through the image processing by camera systems when the main image has noticeable differences from the real scene. This assertion enables applications to reference the OPI through a Manifest as an element of provenance data.

Considering that OPI is normally recorded at the time of capture as an individual image in MPF, this assertion provides both

*   1) the method to refer to OPI stored in the Asset (including validation) at capture time and
    
*   2) the method to move and record the OPI into the manifest
    

Moving OPI metadata typically occurs during editing, particularly under the following conditions

*   when the file format will be changed from Exif and / or
    
*   when the file is used as an ingredient.
    

When referencing the OPI in MPF, the location shall be specified in the alternative content representation assertion by the index number of the item from the `parts` array described in the multi-asset hash assertion in the same C2PA Manifest. If the asset is subsequently edited and the OPI is preserved, a new alternative content representation assertion should be included in the new C2PA Manifest, referencing the OPI location in the new multi-asset hash assertion.

> **NOTE:**
> An OPI referenced using a multi-asset part index can only be validated when the alternative content representation assertion exists in the active manifest, or in the presence of update manifests, the standard manifest containing the current hard binding.

When moving the OPI into the C2PA Manifest, the OPI shall be recorded using the embedded data assertion without any changes.

If the OPI in the asset is removed, the action assertion with the pre-defined “c2pa.deleted” shall be used, and when the image in the manifest is removed, the record of remove operation shall be described following the redaction rules (see [Section 8.8, “Redaction of Assertions”](#_redaction_of_assertions)).

A C2PA Manifest shall not contain more than one alternative content representation assertion with the label `exif.originalPreservationImage`.

<a id="_schema_and_example_13"></a>
