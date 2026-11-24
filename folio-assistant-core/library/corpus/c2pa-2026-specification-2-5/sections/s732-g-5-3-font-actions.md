---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s732-g-5-3-font-actions
section_title: "G.5.3. Font Actions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14757-14803
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.3. Font Actions

```cddl
; Maps, ranges and parameters for font-specific actions.

; Multiple font actions work with respect to ranges of Unicode values.
font-unicode-range-map = {
  "start": uint, ; Inclusive start
  "stop": uint, ; Inclusive end
}

; Font parameter used by font.subset, font.charactersAdded,
; font.charactersDeleted, and font.charactersModified.
font-parameter-unicode-ranges-map = {
  "ranges": [1* font-unicode-range-map] ; Array of unicode ranges
}

; Ranges for font instantiation parameters

; Valid weights or thickness for the font. 400 is normal.
font-weight-range = 1..1000

; Percentage of normal from 0% to 1000%. 100% is normal width.
font-width-range = 0.0..1000.0
font-slant-range = -90.0..90.0 ; Angle of slant with 0 degrees being no slant.

; Font parameters used when creating an instance of a font from a variable font.
; The different 'variation axis` for the fonts are detailed here. The tag
; names for the different axes are in parenthesis in the comments for each
; parameter.
font-parameter-created-from-variable-font-map = {
  ; Weight(wght) or thickness of the font to be instantiated.
  ? "weight": font-weight-range,

  ; Width(wdth) or narrowness of the letterforms of font to be instantiated.
  ? "width": font-width-range,
  ? "italic": bool, ; Get the italic(ital) version of the font.
  ? "slant": font-slant-range, ; The slant(slnt) angle of the font.

  ; The optical size(opsz) of the font, typically you want to match the font
  ; size requested.
  ? "optical-size": int / float,
  * tstr => any ; Name and type of the custom axes.
}
```

<a id="cddl_annex_ingredient"></a>
