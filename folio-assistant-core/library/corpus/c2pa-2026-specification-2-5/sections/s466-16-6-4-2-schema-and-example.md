---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s466-16-6-4-2-schema-and-example
section_title: "16.6.4.2. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9108-9286
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.4.2. Schema and Example

The schema for this type is defined by the `font-info-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.18, “Font Information”](#cddl_annex_font_info) for the complete normative schema):

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

A basic example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8), containing only required fields, is shown below:

```none
{
    "fullName": "Example Two Italic",
    "familyName": "ExampleTwo",
    "style": "Italic",
    "weight": {
        "class": "Regular",
        "value": 400
    },
    "postScriptName": "Example-Two-Italic",
    "format": "TrueType",
    "copyrightNotice": "Copyright 2011 The Example Two Project Authors (https://www.example.com/lifonts/Example-Two), with Reserved Font Name 'Example Two'.",
    "copyrightHolder": {
        "name": "Fabrikam"
    },
    "designers": [
        {
            "person": {
              "name": "John Doe",
              "url": "https://fabrikam.example.com/jdoefonts"
            }
        }
    ]
}
```

This extended example demonstrates optional fields as well:

```none
{
    "fullName": "Example Font Bold Italic",
    "version": "7.0.4-beta",
    "versionUrl": "https://fabrikam.example.com/release/efbi/7.0",
    "familyName": "ExampleFont",
    "style": "Italic",
    "weight": {
        "class": "Bold",
        "value": 700
    },
    "postScriptName": "ExampleFont-BoldItalic",
    "format": "OpenType",
    "copyrightNotice": "© 2017 Fabrikam, Inc. All Rights Reserved.",
    "copyrightHolder": {
        "name": "Fabrikam Inc."
    },
    "copyrightYears": [
        1982,
        2017
    ],
    "designers": [
        {
            "person": {
              "name": "John Doe",
              "url": "https://fabrikam.example.com/browse/designers/john-doe"
            },
            "foundry": {
               "name": "Fabrikam Fonts"
            },
            "contribution": "Ligatures."
        },
        {
            "person": {
              "name": "Jane Doe"
            },
            "foundry": {
                "name": "Fabrikam Fonts"
            },
            "contribution": "All characters."
        }
    ],
    "designFoundry": {
        "name": "Fabrikam Fonts",
        "url": "https://fabrikam.example.com"
    },
    "sourceFoundry": {
        "name": "Fonts Direct 2 U",
        "url": "https://fd2u.example.com"
    },
    "identifier": "ExampleFont Bold Italic (Fabrikam)"
}
```

<a id="_depthmap"></a>
