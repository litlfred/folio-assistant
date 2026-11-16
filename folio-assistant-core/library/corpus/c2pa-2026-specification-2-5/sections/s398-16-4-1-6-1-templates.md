---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s398-16-4-1-6-1-templates
section_title: "16.4.1.6.1. Templates"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6882-6967
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.6.1. Templates

The elements of the `templates` array, in a v2 action, are described using a combination of common elements about actions, along with some template-specific values. These values are combined by a C2PA Manifest Consumer with actions of the same name, or with all actions (if the value of the `action` field is the special `*` value), to get a full picture of an action. If there are multiple templates that apply to the same action, then the values are merged starting with the `\*` template (if present) and then applied in the order they appear in the `templates` array.

Example 6. Action template example

An action and template, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
// example of a single template applied to multiple actions //
{
    "actions": [
        {
            "action": "com.joesphoto.filter",
            "when": 0("2020-02-11T09:00:00Z")
        },
        {
            "action": "c2pa.edited",
            "when": 0("2020-02-11T09:10:00Z")
        },
        {
            "action": "com.joesphoto.filter",
            "when": 0("2020-02-11T09:20:00Z"),
            "parameters": {
                "name": "com.joesphoto.override"
            }
        },
        {
            "action": "c2pa.cropped",
            "when": 0("2020-02-11T09:30:00Z")
        }
    ],
    "templates": [{
        "action": "com.joesphoto.filter",
        "description": "Magic Filter",
        "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic",
        "softwareAgent" : {
            "name": "Joe's Photo Editor",
            "version": "2.0",
            "operating_system": "Windows 10"
        },
        "parameters": {
            "name": "com.joesphoto.magicFilter",
            "multipleInstances": false
        }
    }]
}

// example of using the special all actions/`*` template, for all actions //
{
    "actions": [
        {
            "action": "c2pa.created",
            "when": 0("2024-03-09T20:04Z")
        },
        {
            "action": "c2pa.edited",
            "when": 0("2025-02-11T09:10:00Z")
        },
        {
            "action": "c2pa.cropped",
            "when": 0("2025-02-11T09:30:00Z")
        }
    ],
    "templates": [{
        "action": "*",
        "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/humanEdits",
        "softwareAgent" : {
            "name": "Jane's Human Authoring Tool",
            "version": "1.0"
        }
    }]
}
```

A C2PA Manifest Consumer shall take the values from the template and overlay the values from the action itself, which will lead to replacing any with the same name.

![Actions Template Flow](https://kroki.io/plantuml/svg/eNrtUrFOwzAQneOvsLywUMftRgakDjAgISFSCQnEYLnXxJXjs-xrQ4X67zhpWsHGwIjkwbq79-75PWvnsO_sh_UNY9uEnq-gC04T8E9WCG3IohcVFwY7uUVIoUVCubGOIIrrPLKGZKIN57lH3VjD77_1bWNJuxp30cDqEGCYaolCVZZmLzPSSIxN6aFPBjNbOSHSiKCMKPPygMkS1AdPLZA1I3XCDfU6wrIBT4JX_C1rLoTX3bjkAeEq8adBML9bW8JRUCH2ENOkdiHVqZZMC50ehMj6zBqCs0YPD5MYIOabb-pDIugG6Iv1a-wTnyvBiuM7O07-LUfLfute38JJiFqomVrM5vOVuqmUyudVXDifIe0c_Qnnf2Q_Irv89tntlBybAsyFk-3sC-gWA4o=)

Figure 18. Actions Template Flow

A template may include a `parameters` key. When a template’s `parameters` field is merged with a matching action, the individual key-value pairs within the template’s `parameters` are merged with those of the action’s own `parameters`, with the action’s values taking precedence over the template’s values for any key present in both. If the action has no `parameters` field, the template’s `parameters` are used as the action’s parameters without modification.

The `templateParameters` key is deprecated in favour of `parameters`. A C2PA Manifest Consumer that encounters a `templateParameters` field in a template shall treat its key-value pairs as if they were in the `parameters` field and merge them into matching actions using the same precedence rules.

<a id="_softwareagents"></a>
