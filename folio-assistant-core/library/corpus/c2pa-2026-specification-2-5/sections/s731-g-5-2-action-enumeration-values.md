---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s731-g-5-2-action-enumeration-values
section_title: "G.5.2. Action Enumeration Values"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14692-14756
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.2. Action Enumeration Values

```cddl
; DO NOT EDIT — generated from actions.yaml
; Run generateActions.sh to regenerate.
; Structural definitions are in actions.cddl

$action-choice /= "c2pa.addedText"
$action-choice /= "c2pa.adjustedColor"
$action-choice /= "c2pa.changedSpeed"
$action-choice /= "c2pa.color_adjustments"
$action-choice /= "c2pa.converted"
$action-choice /= "c2pa.copied"
$action-choice /= "c2pa.created"
$action-choice /= "c2pa.cropped"
$action-choice /= "c2pa.deleted"
$action-choice /= "c2pa.drawing"
$action-choice /= "c2pa.dubbed"
$action-choice /= "c2pa.edited"
$action-choice /= "c2pa.edited.metadata"
$action-choice /= "c2pa.enhanced"
$action-choice /= "c2pa.filtered"
$action-choice /= "c2pa.formatted"
$action-choice /= "c2pa.managed"
$action-choice /= "c2pa.mastered"
$action-choice /= "c2pa.mixed"
$action-choice /= "c2pa.modified"
$action-choice /= "c2pa.opened"
$action-choice /= "c2pa.orientation"
$action-choice /= "c2pa.placed"
$action-choice /= "c2pa.printed"
$action-choice /= "c2pa.produced"
$action-choice /= "c2pa.published"
$action-choice /= "c2pa.redacted"
$action-choice /= "c2pa.remixed"
$action-choice /= "c2pa.removed"
$action-choice /= "c2pa.rendered"
$action-choice /= "c2pa.repackaged"
$action-choice /= "c2pa.resized"
$action-choice /= "c2pa.resized.proportional"
$action-choice /= "c2pa.reviewed"
$action-choice /= "c2pa.saved"
$action-choice /= "c2pa.transcoded"
$action-choice /= "c2pa.translated"
$action-choice /= "c2pa.trimmed"
$action-choice /= "c2pa.unknown"
$action-choice /= "c2pa.version_updated"
$action-choice /= "c2pa.watermarked"
$action-choice /= "c2pa.watermarked.bound"
$action-choice /= "c2pa.watermarked.unbound"
$action-choice /= "font.charactersAdded"
$action-choice /= "font.charactersDeleted"
$action-choice /= "font.charactersModified"
$action-choice /= "font.createdFromVariableFont"
$action-choice /= "font.edited"
$action-choice /= "font.hinted"
$action-choice /= "font.merged"
$action-choice /= "font.openTypeFeatureAdded"
$action-choice /= "font.openTypeFeatureModified"
$action-choice /= "font.openTypeFeatureRemoved"
$action-choice /= "font.subset"
$action-choice /= tstr .regexp "([\\da-zA-Z_-]+\\.)+[\\da-zA-Z_-]+"
```

<a id="cddl_annex_font_actions"></a>
