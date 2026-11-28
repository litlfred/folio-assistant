---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s747-g-5-18-font-information
section_title: "G.5.18. Font Information"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15615-15707
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.18. Font Information

```cddl
; Assertion data for font.info assertion.
font-info-map = {
  "fullName": tstr, ; The full name of the font.
  ; A version in the semantic versioning (semver) format.
  ? "version": semver-string, ; The version of the font in SemVer format.

  ; A URL to the release notes associated with this version of the font.
  ? "versionUrl": ext-url-type,

  ; The date this version of the font was released or published.
  ? "releaseDate": tdate,
  "familyName": tstr, ; The Font Family.
  "style": $font-style, ; The style of the font, e.g. italic or regular.
  "weight": font-weight-map, ; The weight of the font with name and value.
  ; The PostScript name, ID 6, from the font 'name' table.

  ; Characters from ASCII 33-126 except the following: [](){}<>/%
  "postScriptName": tstr .regexp "^(?!.*[\\[\\]\\(\\)\\{\\}<>\\/%])[!-~]{1,63}$",
  "format": $font-format-choice, ; The format of this font.
  "copyrightNotice": tstr, ; The copyright associated with this font.

  ; The entity that holds the copyright to the font.
  ? "copyrightHolder": font-entity-map,

  ; The years for which the holder asserts copyright.
  ? "copyrightYears": [1* font-copyright-year-range],

  ; The individuals that designed the font.
  ? "designers": [1* font-designer-map],
  ? "designFoundry": font-entity-map, ; The foundry that designed the font.
  ? "sourceFoundry": font-entity-map, ; The foundry that distributes the font.
  ? "identifier": tstr, ; Internal identier of font for foundry or vendor use.

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

; Font Formats
$font-format-choice /= "TrueType"
$font-format-choice /= "OpenType"

; Copyright year range
font-copyright-year-range = 1..9999

; Font weight range
font-weight-range /= 1..1000

; The font style
$font-style /= "Normal"
$font-style /= "Italic"
$font-style /= "Oblique"
$font-style /= "Roman"
$font-style /= "Regular"

; Data for a font weight
font-weight-map = {
  ; The descriptive name of the weight class, e.g. bold or thin.
  "class": $font-weight-class,
  "value": font-weight-range, ; The value of the weight.
}

; Data for an entity with a name and credentials
font-entity-map = {
  "name": tstr, ; The name of the person or foundry.

  ; A URL for additional information about this person or foundry.
  ? "url": ext-url-type,
}

; Data for a font designer
font-designer-map = {
  "person": font-entity-map, ; The person who designed the font.

  ; The name of the foundry with which the designer was associated when
  ; contributing to the font design.
  ? "foundry": font-entity-map,

  ; A description of what the designer contributed to the font. For example,
  ; 'All the Latin and Arabic characters'.
  ? "contribution": tstr,

  ; "When the designer started to contribute to the font design.
  ? "startDate": tdate,

  ; When the designer ended contributions to the font design.
  ? "endDate": tdate,
}
```

<a id="cddl_annex_font_weight_class"></a>
