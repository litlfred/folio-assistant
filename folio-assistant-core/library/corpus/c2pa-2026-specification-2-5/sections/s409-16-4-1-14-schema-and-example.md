---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s409-16-4-1-14-schema-and-example
section_title: "16.4.1.14. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7172-7507
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.14. Schema and Example

The schema for `c2pa.actions` is defined by the `actions-map` rule, and the schema for `c2pa.actions.v2` is defined by the `actions-map-v2` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.1, “Actions”](#cddl_annex_actions) for the complete normative schema):

CDDL for Action choices

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

CDDL for Actions

```cddl
; Structural definitions for actions assertions.
; Pre-defined action names are in action-choices.cddl (generated from actions.yaml).

action-time-exact-group = (
  ? "when": tdate ; exact action time
)

action-time-range-group = (
  ? "whenStart": generator-lower-bound-time-type, ; exact action start or lower bound
  ? "whenEnd": generator-upper-bound-time-type ; exact action end or upper bound
)

; Version 2 (v2) of the actions assertion

$action-reason /= "c2pa.PII.present"
$action-reason /= "c2pa.invalid.data"
$action-reason /= "c2pa.trade-secret.present"
$action-reason /= "c2pa.government.confidential"
$action-reason /= tstr .regexp "([\\da-zA-Z_-]+\\.)+[\\da-zA-Z_-]+"

actions-map-v2 = {
  "actions" : [1* action-item-map-v2], ; list of actions

  ; list of templates for the actions
  ? "templates": [1* action-template-map-v2],

  ; A list of the software/hardware that did the action
  ? "softwareAgents": [1* generator-info-map],

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,

  ; If true, indicates that all actions performed are included in an actions
  ; assertion
  ; NOTE: In previous versions of this specification, this field was optional
  "allActionsIncluded": bool
}

action-common-map-v2 = {
  ; Description of the software/hardware that did the action
  ? "softwareAgent": generator-info-map,

  ; 0-based index into the softwareAgents array in the actions-map-2
  ? "softwareAgentIndex": int,

  ; Additional description of the action, important for custom actions
  ? "description": tstr .size (1..max-tstr-length),

  ; One of the defined source types at
  ; https://cv.iptc.org/newscodes/digitalsourcetype/ or in this specification
  ? "digitalSourceType": tstr .size (1..max-tstr-length),
}

; NOTE: an earlier version of this specification also included an "actors"
; field, however this was removed in version 2.0.
action-item-map-v2 = {
  "action": $action-choice , ; the type of action
  action-common-map-v2, ; now additional common items

  ; Because both groups are optional, mutual exclusion is enforced by the
  ; normative prose, JSON Schema, and validation procedure.
  (action-time-exact-group // action-time-range-group),

  ; A list of the regions of interest of the resource that were changed. If not
  ; present, presumed to be undefined.
  ? "changes": [1* region-map],
  ? "related": [1* action-item-map-v2], ; List of related actions

  ; the reason why this action was performed, required when the action is
  ; `c2pa.redacted`
  ? "reason": $action-reason,

  ; Additional parameters of the action. These will often vary by the type of
  ; action
  ? "parameters": parameters-map-v2
}

action-template-map-v2 = {
  ; templates support the additional special "*" option
  "action": $action-choice / "*",
  action-common-map-v2, ; additional common items

  ; hashed_uri reference to an embedded data assertion
  ? "icon": $hashed-uri-map,

  ; Parameters to be merged into the parameters of matching actions
  ? "parameters": parameters-map-v2,

  ; DEPRECATED: superseded by "parameters". Consumers shall treat the key-value
  ; pairs in templateParameters as if they were in the parameters field, merging
  ; them into matching actions using the same precedence rules.
  ? "templateParameters": { parameters-common-map-v2 }
}

parameters-common-map-v2 = (
  * tstr => any
)

parameters-map-v2 = {
  ; A JUMBF URI to the redacted assertion, required when the action is
  ; `c2pa.redacted`
  ? "redacted": jumbf-uri-type,

  ; A list of hashed JUMBF URI(s) to the ingredient (v2 or v3) assertion(s) that
  ; this action acts on
  ? "ingredients": [1* $hashed-uri-map],

  ; hashed JUMBF URI(s) to assertion(s) related to this action that are neither
  ; ingredients nor actions
  ? "relatedAssertions": [1* $hashed-uri-map],

  ; BCP-47 code of the source language of a `c2pa.translated` action
  ? "sourceLanguage": tstr .size (1..max-tstr-length),

  ; BCP-47 code of the target language of a `c2pa.translated` action
  ? "targetLanguage": tstr .size (1..max-tstr-length),

  ; A machine-readable identifier that sub-classifies the action
  ? "name": tstr .size (1..max-tstr-length),

  ? "multipleInstances": bool, ; was this action performed multiple times

  parameters-common-map-v2, ; anything from the common parameters
}

; (DEPRECATED) Version 1 of the actions assertion

buuid = #6.37(bstr)

actions-map = {
  "actions" : [1* action-items-map], ; list of actions

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

; NOTE: an earlier version of this specification also included an "actors"
; field, however this was removed in version 2.0.
action-items-map = {
  "action": $action-choice,
  ? "when": tdate, ; time stamp of when the action occurred.

  ; The software agent that performed the action.
  ? "softwareAgent": tstr .size (1..max-tstr-length),

  ; A semicolon-delimited list of the parts of the resource that were changed
  ; since the previous event history. If not present, presumed to be undefined.
  ; When tracking changes and the scope of the changed components is unknown, it
  ; can be assumed that anything could have changed.
  ? "changed": tstr .size (1..max-tstr-length),

  ; The value of the xmpMM:InstanceID property for the modified (output)
  ; resource
  ? "instanceID": buuid,

  ; Additional parameters of the action. These will often vary by the type of
  ; action
  ? "parameters": parameters-map,

  ; One of the defined source types at
  ; https://cv.iptc.org/newscodes/digitalsourcetype/
  ? "digitalSourceType": tstr .size (1..max-tstr-length),
}

parameters-map = {
  ; A hashed-uri to the ingredient assertion that this action acts on
  ? "ingredient": $hashed-uri-map,

  ; Additional description of the action
  ? "description": tstr .size (1..max-tstr-length)
  * tstr => any
}
```

Standard actions specific to font assets are described in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.3, “Font Actions”](#cddl_annex_font_actions)):

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

Example 8. Example of a v2 action

An example of a v2 action, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8), is shown below:

```none
{
  "actions": [
    {
      "action": "c2pa.filtered",
      "whenStart": {
        "value": 0("2020-02-11T08:30:00Z"),
        "timeStampType": "lowerBound"
      },
      "whenEnd": {
        "value": 0("2020-02-11T09:30:00Z"),
        "timeStampType": "upperBound"
      },
      "description": "Applied vintage filter",
      "parameters": {
        "com.fabrikam.multipleInstances": true
      },
      "softwareAgent" : {
          "name": "Joe's Photo Editor",
          "version": "2.0",
          "operating_system": "Windows 10"
      }
    },
    {
      "action": "c2pa.cropped",
      "when": 0("2020-02-11T09:30:00Z")
    }
  ],
  "metadata": {
    "dateTime": 0("2021-06-28T16:34:11.457Z"),
    "reviewRatings": [
      {
        "value": 1,
        "explanation": "Content bindings did not validate"
      }
    ]
  }
}
```

<a id="_external_reference"></a>
