---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s740-g-5-11-region-role-enumeration-values
section_title: "G.5.11. Region Role Enumeration Values"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15254-15280
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.11. Region Role Enumeration Values

```cddl
; Enumerated values for $role-choice (used in regions-of-interest.cddl)
; These values of role-choice are deprecated
$role-choice /= "c2pa.areaOfInterest" ; arbitrary area worth identifying

; this area is all that is left after a crop action
$role-choice /= "c2pa.cropped"
$role-choice /= "c2pa.edited" ; this area has had edits applied to it
$role-choice /= "c2pa.placed" ; the area where an ingredient was placed/added
$role-choice /= "c2pa.redacted" ; something in this area was redacted
$role-choice /= "c2pa.subjectArea" ; area specific to a subject (human or not)
$role-choice /= "c2pa.deleted" ; a range of information was removed/deleted
$role-choice /= "c2pa.styled" ; styling was applied to this area

; watermarking was applied to this area for the purpose of soft binding
$role-choice /= "c2pa.watermarked"

; watermarking was applied to this area for the purpose of soft binding
$role-choice /= "c2pa.watermarked.bound"

; watermarking was applied to this area without creating a soft binding
$role-choice /= "c2pa.watermarked.unbound"
```

<a id="cddl_annex_soft_binding"></a>
