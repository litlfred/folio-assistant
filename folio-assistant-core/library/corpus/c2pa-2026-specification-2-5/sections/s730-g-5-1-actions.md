---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s730-g-5-1-actions
section_title: "G.5.1. Actions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14514-14691
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.1. Actions

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

<a id="cddl_annex_action_choices"></a>
